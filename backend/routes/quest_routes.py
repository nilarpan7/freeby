"""API routes for quest submissions, analysis history, and karma graph."""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import logging

from database.supabase_client import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/quests", tags=["Quests & Analysis"])


# ─── Request/Response Models ───

class QuestSubmitRequest(BaseModel):
    student_id: str
    quest_id: str
    quest_type: str = "starter"  # 'starter' | 'solo'
    github_url: str
    quest_title: str
    ai_criteria: List[str]
    reward_karma: int = 15


class ReanalyzeRequest(BaseModel):
    student_id: str


# ─── Background task runner ───

async def _run_analysis(
    github_url: str,
    quest_id: str,
    quest_title: str,
    criteria: list,
    student_id: str,
    reward_karma: int,
    quest_type: str,
):
    """Run the agentic analysis pipeline in the background."""
    try:
        from services.agentic_analyzer import AgenticAnalyzer
        analyzer = AgenticAnalyzer()
        await analyzer.analyze(
            github_url=github_url,
            quest_id=quest_id,
            quest_title=quest_title,
            criteria=criteria,
            student_id=student_id,
            reward_karma=reward_karma,
            quest_type=quest_type,
        )
    except Exception as e:
        logger.error(f"Background analysis failed: {e}", exc_info=True)


# ─── Endpoints ───

@router.post("/submit")
async def submit_quest(req: QuestSubmitRequest, background_tasks: BackgroundTasks):
    """
    Submit a GitHub URL for agentic analysis.
    Returns immediately with a submission_id — frontend polls /submission/{id} for results.
    """
    # Validate URL
    if "github.com" not in req.github_url:
        raise HTTPException(status_code=400, detail="Please provide a valid GitHub URL")

    sb = get_supabase()

    # Check if already analyzing
    existing = sb.table("quest_submissions").select("id, status") \
        .eq("student_id", req.student_id) \
        .eq("quest_id", req.quest_id) \
        .eq("status", "analyzing") \
        .execute()
    if existing.data:
        return {
            "submission_id": existing.data[0]["id"],
            "status": "analyzing",
            "message": "Analysis already in progress"
        }

    # Create initial record
    attempt_result = sb.table("quest_submissions").select("attempt_number") \
        .eq("student_id", req.student_id) \
        .eq("quest_id", req.quest_id) \
        .order("attempt_number", desc=True).limit(1).execute()
    attempt = (attempt_result.data[0]["attempt_number"] + 1) if attempt_result.data else 1

    row = {
        "student_id": req.student_id,
        "quest_id": req.quest_id,
        "quest_type": req.quest_type,
        "github_url": req.github_url,
        "status": "analyzing",
        "attempt_number": attempt,
        "criteria_total": len(req.ai_criteria),
        "model_used": "gpt-oss:120b-cloud",
    }
    result = sb.table("quest_submissions").insert(row).execute()
    submission_id = result.data[0]["id"] if result.data else None

    if not submission_id:
        raise HTTPException(status_code=500, detail="Failed to create submission")

    # Kick off analysis in background
    background_tasks.add_task(
        _run_analysis_with_existing_submission,
        submission_id=submission_id,
        github_url=req.github_url,
        quest_id=req.quest_id,
        quest_title=req.quest_title,
        criteria=req.ai_criteria,
        student_id=req.student_id,
        reward_karma=req.reward_karma,
        quest_type=req.quest_type,
    )

    return {
        "submission_id": submission_id,
        "status": "analyzing",
        "attempt": attempt,
        "message": "Analysis started — poll /quests/submission/{id} for results"
    }


async def _run_analysis_with_existing_submission(
    submission_id: str,
    github_url: str,
    quest_id: str,
    quest_title: str,
    criteria: list,
    student_id: str,
    reward_karma: int,
    quest_type: str,
):
    """Run analysis using a pre-created submission record."""
    import time
    try:
        from services.agentic_analyzer import AgenticAnalyzer
        analyzer = AgenticAnalyzer()

        # Delete the pre-created record since the analyzer creates its own
        sb = get_supabase()
        sb.table("quest_submissions").delete().eq("id", submission_id).execute()

        await analyzer.analyze(
            github_url=github_url,
            quest_id=quest_id,
            quest_title=quest_title,
            criteria=criteria,
            student_id=student_id,
            reward_karma=reward_karma,
            quest_type=quest_type,
        )
    except Exception as e:
        logger.error(f"Background analysis failed: {e}", exc_info=True)
        try:
            sb = get_supabase()
            sb.table("quest_submissions").update({
                "status": "error",
                "analysis_summary": f"Pipeline error: {str(e)}",
            }).eq("id", submission_id).execute()
        except Exception:
            pass


@router.get("/submission/{submission_id}")
async def get_submission(submission_id: str):
    """Get full analysis details for a single submission."""
    sb = get_supabase()

    result = sb.table("quest_submissions").select("*").eq("id", submission_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Submission not found")

    submission = result.data[0]

    # Fetch analysis passes
    passes = sb.table("analysis_passes").select("*") \
        .eq("submission_id", submission_id) \
        .order("pass_number").execute()

    submission["passes"] = passes.data or []
    return submission


@router.get("/history/{student_id}")
async def get_history(student_id: str, quest_type: Optional[str] = None, status: Optional[str] = None):
    """Get all submissions for a student, with optional filters."""
    sb = get_supabase()

    query = sb.table("quest_submissions").select("*").eq("student_id", student_id)

    if quest_type:
        query = query.eq("quest_type", quest_type)
    if status:
        query = query.eq("status", status)

    result = query.order("created_at", desc=True).execute()
    return result.data or []


@router.get("/stats/{student_id}")
async def get_stats(student_id: str):
    """Aggregated stats for a student."""
    sb = get_supabase()

    subs = sb.table("quest_submissions").select("*").eq("student_id", student_id).execute()
    all_subs = subs.data or []

    passed = [s for s in all_subs if s["status"] == "passed"]
    failed = [s for s in all_subs if s["status"] == "failed"]

    total_karma = sum(s.get("karma_earned", 0) for s in passed)
    avg_score = sum(s.get("score_pct", 0) for s in all_subs) / len(all_subs) if all_subs else 0

    quests_completed = list(set(s["quest_id"] for s in passed))

    return {
        "total_submissions": len(all_subs),
        "total_passed": len(passed),
        "total_failed": len(failed),
        "total_karma_earned": total_karma,
        "avg_score": round(avg_score, 1),
        "quests_completed": quests_completed,
    }


@router.post("/reanalyze/{submission_id}")
async def reanalyze(submission_id: str, background_tasks: BackgroundTasks):
    """Re-run analysis on a previously failed/errored submission."""
    sb = get_supabase()

    result = sb.table("quest_submissions").select("*").eq("id", submission_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Submission not found")

    sub = result.data[0]
    if sub["status"] == "analyzing":
        return {"message": "Analysis already in progress", "submission_id": submission_id}

    background_tasks.add_task(
        _run_analysis,
        github_url=sub["github_url"],
        quest_id=sub["quest_id"],
        quest_title=sub.get("quest_title", "Quest"),
        criteria=[],  # Will need to be fetched from quest config
        student_id=sub["student_id"],
        reward_karma=sub.get("karma_earned", 15),
        quest_type=sub.get("quest_type", "starter"),
    )

    return {"message": "Re-analysis started", "submission_id": submission_id}


# ─── Karma Graph ───

@router.get("/karma-graph/{student_id}")
async def get_karma_graph(student_id: str, days: int = 30):
    """
    Get karma history data for the work graph visualization.
    Returns daily karma events and cumulative totals.
    """
    sb = get_supabase()

    # Fetch karma history ordered by date
    result = sb.table("karma_history").select("*") \
        .eq("student_id", student_id) \
        .order("created_at", desc=False) \
        .execute()

    events = result.data or []

    # Also fetch quest submissions for activity data
    subs = sb.table("quest_submissions").select(
        "id, quest_id, quest_type, status, score_pct, karma_earned, created_at, completed_at"
    ).eq("student_id", student_id) \
        .order("created_at", desc=False).execute()

    submissions = subs.data or []

    # Build daily aggregation
    daily_data = {}
    running_total = 0

    for event in events:
        date = event["created_at"][:10]  # YYYY-MM-DD
        if date not in daily_data:
            daily_data[date] = {
                "date": date,
                "karma_earned": 0,
                "events": [],
                "cumulative": 0,
            }
        daily_data[date]["karma_earned"] += event["karma_delta"]
        daily_data[date]["events"].append({
            "type": event["event_type"],
            "title": event["event_title"],
            "delta": event["karma_delta"],
        })

    # Fill cumulative
    for date in sorted(daily_data.keys()):
        running_total += daily_data[date]["karma_earned"]
        daily_data[date]["cumulative"] = running_total

    # Get current karma from profile
    profile = sb.table("profiles").select("karma_score").eq("id", student_id).execute()
    current_karma = profile.data[0]["karma_score"] if profile.data else 0

    return {
        "current_karma": current_karma,
        "daily_data": list(daily_data.values()),
        "recent_submissions": submissions[-10:],  # Last 10
        "total_events": len(events),
    }
