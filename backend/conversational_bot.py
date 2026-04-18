import os
import json
import logging
from dotenv import load_dotenv
from telegram import Update, ReplyKeyboardMarkup, ReplyKeyboardRemove
from telegram.ext import (
    ApplicationBuilder,
    ContextTypes,
    MessageHandler,
    CommandHandler,
    ConversationHandler,
    filters
)

from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from database.supabase_client import get_supabase

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()
TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

llm = ChatOllama(model="minimax-m2.7:cloud", temperature=0.7)

SYSTEM_PROMPT = """You are Kramic, an intelligent AI project manager and technical consultant. 
Your goal is to help clients plan, architect, and manage freelance tasks for students.

When a user comes to you with an idea (e.g., "I need a website for my sweet shop"):
1. **Act as a Consultant**: Do not immediately ask for budget or deadlines. First, understand their business goals.
2. **Ask Targeted Questions**: Ask about their target audience, essential features (e.g., online ordering, menu display), branding, and if they have existing assets like images or logos.
3. **Propose a Plan**: Once you understand their needs, propose a real, structured project plan. Break down the idea into logical phases or micro-tasks (e.g., UI/UX Design, Frontend Development, Backend setup for orders).
4. **Gather Logistics**: After the plan is approved by the user, ask for the preferred tech stack, budget (in INR), and deadline.

ONCE the plan is fully approved and you have all necessary information (description, stack, budget, deadline), AND the user confirms they want to publish the task, you MUST output a special JSON block in your response. The JSON block should be enclosed in ```json ... ``` and have this exact structure:
```json
{
  "action": "create_task",
  "title": "Short title",
  "description": "Full description including the agreed plan and required assets (images/logos)",
  "stack": ["React", "Node"],
  "budget": 5000,
  "time_estimate_min": 120,
  "micro_tasks": [
    {"title": "Setup Frontend", "type": "Frontend"},
    {"title": "Create APIs", "type": "Backend"}
  ],
  "difficulty": "medium",
  "min_karma": 20
}
```

If the user wants to update a task later, once you know what to update, output:
```json
{
  "action": "update_task",
  "task_id": "the-uuid",
  "updates": { "budget": 6000 }
}
```

Keep your conversational responses helpful, consultative, concise, and professional. Ask one or two questions at a time to avoid overwhelming the user."""

CHAT_STATE = 1

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start command -- initiate chat"""
    context.user_data.clear()
    context.user_data['history'] = []
    
    welcome_msg = (
        "Hey! Welcome to Kramic Task Creator!\n\n"
        "I'm an AI project manager. I can answer questions, help you plan your project, "
        "break it into sub-tasks (frontend, backend, etc.), and list it for students to work on.\n\n"
        "What would you like to build today?"
    )
    context.user_data['history'].append(AIMessage(content=welcome_msg))
    await update.message.reply_text(welcome_msg)
    return CHAT_STATE

async def handle_chat(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle conversation"""
    user_text = update.message.text
    
    if 'history' not in context.user_data:
        context.user_data['history'] = []
        
    history = context.user_data['history']
    history.append(HumanMessage(content=user_text))
    
    # Keep history manageable
    if len(history) > 20:
        history = history[-20:]
        
    messages = [SystemMessage(content=SYSTEM_PROMPT)] + history
    
    await update.message.chat.send_action(action="typing")
    
    try:
        response = llm.invoke(messages)
        ai_text = response.content
        
        history.append(AIMessage(content=ai_text))
        
        # Check for JSON actions
        if "```json" in ai_text:
            # Parse the JSON block
            import re
            json_match = re.search(r'```json\n(.*?)\n```', ai_text, re.DOTALL)
            if json_match:
                action_data = json.loads(json_match.group(1))
                action_type = action_data.get("action")
                
                if action_type == "create_task":
                    # Extract conversational part to send first
                    chat_part = ai_text.split("```json")[0].strip()
                    if chat_part:
                        await update.message.reply_text(chat_part)
                        
                    await update.message.reply_text("⏳ Creating your task in the database...")
                    
                    try:
                        from telegram_agent import TelegramAgent
                        agent = TelegramAgent()
                        
                        sb = get_supabase()
                        
                        difficulty = action_data.get("difficulty", "medium").lower()
                        karma_reward = agent.calculate_karma_reward(difficulty, action_data.get("budget", 0))
                        
                        full_desc = action_data.get("description", "")
                        micro_tasks = action_data.get("micro_tasks", [])
                        if micro_tasks:
                            full_desc += "\n\n### Micro-Tasks Breakdown\n"
                            for i, mt in enumerate(micro_tasks, 1):
                                full_desc += f"{i}. [{mt.get('type')}] {mt.get('title')}\n"
                        
                        row = {
                            "title": action_data.get("title", "New Task"),
                            "description": full_desc,
                            "stack": action_data.get("stack", []),
                            "difficulty": difficulty,
                            "time_estimate_min": action_data.get("time_estimate_min", 60),
                            "min_karma": action_data.get("min_karma", 0),
                            "reward_amount": action_data.get("budget", 0),
                            "karma_reward": karma_reward,
                            "status": "OPEN",
                            "client_name": update.effective_user.full_name or update.effective_user.username,
                            "client_telegram_id": update.effective_user.id,
                            "micro_tasks": micro_tasks
                        }
                        
                        res = sb.table("solo_tasks").insert(row).execute()
                        if res.data:
                            task_id = res.data[0].get("id")
                            await update.message.reply_text(
                                f"✅ *Task Created Successfully!*\n\n"
                                f"*Task ID:* `{task_id}`\n"
                                f"Students can now view and claim this task on the platform.\n"
                                f"I am here if you need to create another task or have questions.",
                                parse_mode="Markdown"
                            )
                        else:
                            await update.message.reply_text("Failed to create task in DB.")
                    except Exception as e:
                        logger.error(f"Error executing create_task action: {e}", exc_info=True)
                        await update.message.reply_text(f"Error creating task: {str(e)}")
                        
                    return CHAT_STATE
                    
                elif action_type == "update_task":
                    chat_part = ai_text.split("```json")[0].strip()
                    if chat_part:
                        await update.message.reply_text(chat_part)
                    
                    await update.message.reply_text("⏳ Updating task in the database...")
                    try:
                        sb = get_supabase()
                        updates = action_data.get("updates", {})
                        task_id = action_data.get("task_id")
                        
                        res = sb.table("solo_tasks").update(updates).eq("id", task_id).execute()
                        if res.data:
                            await update.message.reply_text("✅ Task updated successfully.")
                        else:
                            await update.message.reply_text("Task not found or update failed.")
                    except Exception as e:
                        logger.error(f"Error updating task: {e}")
                        await update.message.reply_text(f"Error updating task: {str(e)}")
                        
                    return CHAT_STATE

        # Normal message
        await update.message.reply_text(ai_text)
        
    except Exception as e:
        logger.error(f"Error in chat: {e}", exc_info=True)
        await update.message.reply_text("Sorry, I'm having trouble processing that right now. Please try again.")

    return CHAT_STATE

async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Cancel the conversation."""
    context.user_data.clear()
    await update.message.reply_text(
        "Chat reset.\n\nUse /start to begin again.",
        reply_markup=ReplyKeyboardRemove()
    )
    return ConversationHandler.END


# Re-use the review handlers from telegram_bot_v2.py
from telegram_bot_v2 import review_start, review_select, review_action, my_tasks, help_command, REVIEW_SELECT, REVIEW_ACTION

def start_conversational_bot():
    """Start the new Agentic Telegram bot."""
    if not TELEGRAM_TOKEN or TELEGRAM_TOKEN == "your_bot_token_here":
        print("[WARN] TELEGRAM_BOT_TOKEN not configured. Skipping bot.")
        return

    try:
        from database.supabase_client import get_supabase
        get_supabase()
    except Exception as e:
        print(f"[ERROR] Supabase connection failed: {e}")
        return

    app = ApplicationBuilder().token(TELEGRAM_TOKEN).build()

    conv_handler = ConversationHandler(
        entry_points=[CommandHandler('start', start), MessageHandler(filters.TEXT & ~filters.COMMAND, handle_chat)],
        states={
            CHAT_STATE: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_chat)],
        },
        fallbacks=[CommandHandler('cancel', cancel)],
    )

    review_handler = ConversationHandler(
        entry_points=[CommandHandler('review', review_start)],
        states={
            REVIEW_SELECT: [MessageHandler(filters.TEXT & ~filters.COMMAND, review_select)],
            REVIEW_ACTION: [MessageHandler(filters.TEXT & ~filters.COMMAND, review_action)],
        },
        fallbacks=[CommandHandler('cancel', cancel)],
    )

    app.add_handler(conv_handler)
    app.add_handler(review_handler)
    app.add_handler(CommandHandler('mytasks', my_tasks))
    app.add_handler(CommandHandler('help', help_command))

    print("[BOT] Conversational Agent Bot started (Supabase mode)")
    print("[BOT] Commands: /start, /mytasks, /review, /cancel, /help")
    app.run_polling()

if __name__ == "__main__":
    start_conversational_bot()
