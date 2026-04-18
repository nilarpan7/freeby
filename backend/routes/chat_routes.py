from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import logging

from database.supabase_client import get_supabase
from routes.referral_routes import send_telegram_notification

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])

class ChatMessageBase(BaseModel):
    message_text: str

class SendMessageRequest(ChatMessageBase):
    sender_id: str

class ChatMessageResponse(BaseModel):
    id: str
    task_id: str
    sender_id: str
    message_text: str
    is_system_message: bool
    created_at: str
    sender_name: Optional[str] = None

@router.get("/{task_id}", response_model=List[ChatMessageResponse])
async def get_task_messages(task_id: str):
    """Get all chat messages for a specific task."""
    sb = get_supabase()
    
    # We also join with profiles to get the sender's name
    messages_query = sb.table("task_messages").select(
        "*, profiles:sender_id(full_name)"
    ).eq("task_id", task_id).order("created_at", desc=False).execute()
    
    result = []
    for msg in messages_query.data or []:
        sender_name = msg.get("profiles", {}).get("full_name") if msg.get("profiles") else None
        result.append(ChatMessageResponse(
            id=msg["id"],
            task_id=msg["task_id"],
            sender_id=msg["sender_id"],
            message_text=msg["message_text"],
            is_system_message=msg.get("is_system_message", False),
            created_at=msg["created_at"],
            sender_name=sender_name
        ))
    
    return result

@router.post("/{task_id}")
async def send_message(task_id: str, request: SendMessageRequest):
    """Send a message in the task chat and notify the other party."""
    sb = get_supabase()
    
    # 1. Insert the message
    msg_insert = sb.table("task_messages").insert({
        "task_id": task_id,
        "sender_id": request.sender_id,
        "message_text": request.message_text,
        "is_system_message": False
    }).execute()
    
    if not msg_insert.data:
        raise HTTPException(status_code=500, detail="Failed to save message")
        
    msg_data = msg_insert.data[0]
    
    # 2. Figure out who to notify (client or assignee)
    task_query = sb.table("solo_tasks").select("*, profiles:assignee_id(telegram_chat_id)").eq("id", task_id).execute()
    if not task_query.data:
        return {"success": True, "message": msg_data}
        
    task = task_query.data[0]
    
    sender_profile_query = sb.table("profiles").select("full_name").eq("id", request.sender_id).execute()
    sender_name = sender_profile_query.data[0]["full_name"] if sender_profile_query.data else "Someone"
    
    notify_chat_id = None
    
    # If sender is assignee -> notify client
    if request.sender_id == task.get("assignee_id"):
        notify_chat_id = task.get("client_telegram_id")
    # If sender is client (or anyone else) -> notify assignee
    else:
        # Assuming client_telegram_id belongs to the client, but the client might also have a profile ID.
        # This is a bit tricky if clients are only identified by Telegram ID in solo_tasks.
        # But if the assignee is set, we can notify them.
        notify_chat_id = task.get("profiles", {}).get("telegram_chat_id") if task.get("profiles") else None
        
    if notify_chat_id:
        # If the message contains a large base64 attachment, truncate it for Telegram
        display_text = request.message_text
        if "📎 Attached Document:" in display_text and len(display_text) > 500:
            lines = display_text.split('\n')
            display_text = f"{lines[0]}\n\n[Attachment visible on web dashboard]"

        notification_text = f"💬 *New Message from {sender_name}*\nTask: *{task['title']}*\n\n{display_text}\n\n_Reply to this message to chat back. (ID: {task_id})_"
        try:
            await send_telegram_notification(notify_chat_id, notification_text)
        except Exception as e:
            logger.error(f"Failed to send telegram notification: {e}")
        
    return {"success": True, "message": msg_data}
