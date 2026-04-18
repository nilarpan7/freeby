"""API routes for task referrals and Telegram notifications."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import logging
import os
import httpx

from database.supabase_client import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/referrals", tags=["Referrals"])

TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")


# ─── Telegram Notification Helper ───

async def send_telegram_notification(chat_id: int, message: str):
    """Send a Telegram message to a user (fire-and-forget)."""
    if not TELEGRAM_TOKEN or not chat_id:
        return
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(
                f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage",
                json={
                    "chat_id": chat_id,
                    "text": message,
                    "parse_mode": "Markdown",
                }
            )
    except Exception as e:
        logger.warning(f"Telegram notification failed: {e}")


# ─── Request Models ───

class ReferRequest(BaseModel):
    referrer_id: str
    referred_user_id: str  # The person being referred (their profile UUID)
    task_id: str


class NotifyRequest(BaseModel):
    user_id: str
    message: str


# ─── Referral Endpoints ───

@router.post("/refer")
async def refer_user(req: ReferRequest):
    """
    Refer another user to a task.
    Referrer must have enough karma (>= 30) to refer.
    Cannot refer yourself.
    """
    sb = get_supabase()

    if req.referrer_id == req.referred_user_id:
        raise HTTPException(status_code=400, detail="You cannot refer yourself")

    # Check referrer karma
    referrer = sb.table("profiles").select("karma_score, full_name").eq("id", req.referrer_id).execute()
    if not referrer.data:
        raise HTTPException(status_code=404, detail="Referrer not found")
    if referrer.data[0]["karma_score"] < 30:
        raise HTTPException(status_code=403, detail="You need at least 30 karma to refer someone")

    # Check referred user exists
    referred = sb.table("profiles").select("id, full_name, telegram_chat_id").eq("id", req.referred_user_id).execute()
    if not referred.data:
        raise HTTPException(status_code=404, detail="Referred user not found")

    # Check task exists and is open
    task = sb.table("solo_tasks").select("id, title, status, karma_reward").eq("id", req.task_id).execute()
    if not task.data:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.data[0]["status"] != "OPEN":
        raise HTTPException(status_code=400, detail="Task is not open for referrals")

    # Check duplicate referral
    existing = sb.table("task_referrals").select("id") \
        .eq("referrer_id", req.referrer_id) \
        .eq("referred_id", req.referred_user_id) \
        .eq("task_id", req.task_id).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="You already referred this user to this task")

    # Create referral
    result = sb.table("task_referrals").insert({
        "referrer_id": req.referrer_id,
        "referred_id": req.referred_user_id,
        "task_id": req.task_id,
        "status": "pending",
    }).execute()

    # Notify referred user via Telegram if they have a chat_id
    referred_chat_id = referred.data[0].get("telegram_chat_id")
    if referred_chat_id:
        await send_telegram_notification(
            referred_chat_id,
            f"🔗 *Referral Received!*\n\n"
            f"*{referrer.data[0]['full_name']}* referred you to the task:\n"
            f"*{task.data[0]['title']}*\n\n"
            f"Check it out on the platform!"
        )

    return {
        "success": True,
        "referral_id": result.data[0]["id"] if result.data else None,
        "message": f"Successfully referred {referred.data[0]['full_name']} to the task"
    }


@router.get("/my-referrals/{user_id}")
async def get_my_referrals(user_id: str):
    """Get all referrals made by or to this user."""
    sb = get_supabase()

    # Referrals I made
    made = sb.table("task_referrals").select(
        "*, solo_tasks:task_id(title, status, karma_reward)"
    ).eq("referrer_id", user_id).order("created_at", desc=True).execute()

    # Referrals made to me
    received = sb.table("task_referrals").select(
        "*, solo_tasks:task_id(title, status, karma_reward)"
    ).eq("referred_id", user_id).order("created_at", desc=True).execute()

    return {
        "made": made.data or [],
        "received": received.data or [],
    }


@router.post("/resolve/{referral_id}")
async def resolve_referral(referral_id: str, outcome: str):
    """
    Resolve a referral after task completion/rejection.
    outcome: 'completed' or 'rejected'

    On completion:
      - Referred user gets full task karma
      - Referrer gets 10% of that karma
    On rejection:
      - Referred user loses karma
      - Referrer loses 5% of project karma
    """
    sb = get_supabase()

    ref = sb.table("task_referrals").select("*").eq("id", referral_id).execute()
    if not ref.data:
        raise HTTPException(status_code=404, detail="Referral not found")

    referral = ref.data[0]
    if referral["status"] not in ("pending", "accepted"):
        raise HTTPException(status_code=400, detail="Referral already resolved")

    task = sb.table("solo_tasks").select("karma_reward, title").eq("id", referral["task_id"]).execute()
    project_karma = task.data[0]["karma_reward"] if task.data else 10

    if outcome == "completed":
        # Referred user gets full karma (handled by task approval)
        # Referrer gets 10% bonus
        referrer_bonus = max(1, int(project_karma * 0.10))

        # Update referrer karma
        referrer_profile = sb.table("profiles").select("karma_score").eq("id", referral["referrer_id"]).execute()
        if referrer_profile.data:
            new_karma = referrer_profile.data[0]["karma_score"] + referrer_bonus
            sb.table("profiles").update({"karma_score": new_karma}).eq("id", referral["referrer_id"]).execute()

        # Log karma history
        sb.table("karma_history").insert({
            "student_id": referral["referrer_id"],
            "karma_delta": referrer_bonus,
            "karma_total": new_karma if referrer_profile.data else referrer_bonus,
            "event_type": "referral_bonus",
            "event_ref_id": referral["task_id"],
            "event_title": f"Referral bonus for {task.data[0]['title'] if task.data else 'task'}",
        }).execute()

        sb.table("task_referrals").update({
            "status": "completed",
            "karma_earned_referrer": referrer_bonus,
            "resolved_at": "now()",
        }).eq("id", referral_id).execute()

        # Notify referrer
        referrer = sb.table("profiles").select("telegram_chat_id").eq("id", referral["referrer_id"]).execute()
        if referrer.data and referrer.data[0].get("telegram_chat_id"):
            await send_telegram_notification(
                referrer.data[0]["telegram_chat_id"],
                f"🎉 *Referral Bonus!*\n\n"
                f"Your referral completed their task and you earned *+{referrer_bonus} karma*!"
            )

        return {"success": True, "referrer_bonus": referrer_bonus}

    elif outcome == "rejected":
        # Referrer loses 5% of project karma
        referrer_penalty = max(1, int(project_karma * 0.05))

        referrer_profile = sb.table("profiles").select("karma_score").eq("id", referral["referrer_id"]).execute()
        if referrer_profile.data:
            new_karma = max(0, referrer_profile.data[0]["karma_score"] - referrer_penalty)
            sb.table("profiles").update({"karma_score": new_karma}).eq("id", referral["referrer_id"]).execute()

        sb.table("karma_history").insert({
            "student_id": referral["referrer_id"],
            "karma_delta": -referrer_penalty,
            "karma_total": new_karma if referrer_profile.data else 0,
            "event_type": "referral_penalty",
            "event_ref_id": referral["task_id"],
            "event_title": f"Referral penalty for {task.data[0]['title'] if task.data else 'task'}",
        }).execute()

        sb.table("task_referrals").update({
            "status": "rejected",
            "karma_penalty_referrer": referrer_penalty,
            "resolved_at": "now()",
        }).eq("id", referral_id).execute()

        return {"success": True, "referrer_penalty": referrer_penalty}

    raise HTTPException(status_code=400, detail="Invalid outcome. Use 'completed' or 'rejected'")


# ─── Notification Endpoints ───

@router.post("/notify")
async def notify_user(req: NotifyRequest):
    """Send a Telegram notification to a user."""
    sb = get_supabase()
    profile = sb.table("profiles").select("telegram_chat_id").eq("id", req.user_id).execute()
    if not profile.data or not profile.data[0].get("telegram_chat_id"):
        return {"success": False, "message": "User has no Telegram linked"}

    await send_telegram_notification(profile.data[0]["telegram_chat_id"], req.message)
    return {"success": True}


@router.post("/notify-task-update")
async def notify_task_update(task_id: str, event: str, details: str = ""):
    """
    Send notification about task events to relevant parties.
    Events: 'submitted', 'rejected', 'approved', 'claimed'
    """
    sb = get_supabase()

    task = sb.table("solo_tasks").select("*, profiles:assignee_id(full_name, telegram_chat_id)") \
        .eq("id", task_id).execute()
    if not task.data:
        return {"success": False, "message": "Task not found"}

    t = task.data[0]
    assignee_chat = t.get("profiles", {}).get("telegram_chat_id") if t.get("profiles") else None

    # Also notify the client (task creator)
    client_chat = None
    if t.get("client_telegram_id"):
        client_chat = t["client_telegram_id"]

    messages = {
        "submitted": (
            f"📤 *Work Submitted!*\n\n"
            f"Task: *{t['title']}*\n"
            f"The developer has submitted their work for review."
        ),
        "rejected": (
            f"❌ *Submission Rejected*\n\n"
            f"Task: *{t['title']}*\n"
            f"{details or 'The submission did not meet requirements.'}\n\n"
            f"You can submit again with improvements!"
        ),
        "approved": (
            f"✅ *Task Approved!*\n\n"
            f"Task: *{t['title']}*\n"
            f"Great work! Your karma has been updated."
        ),
        "claimed": (
            f"🎯 *Task Claimed!*\n\n"
            f"Task: *{t['title']}*\n"
            f"A developer has started working on your task."
        ),
    }

    msg = messages.get(event, f"Task update: {event}")

    # Notify developer for rejected/approved, client for submitted/claimed
    if event in ("rejected", "approved") and assignee_chat:
        await send_telegram_notification(assignee_chat, msg)
    if event in ("submitted", "claimed") and client_chat:
        await send_telegram_notification(client_chat, msg)

    return {"success": True}
