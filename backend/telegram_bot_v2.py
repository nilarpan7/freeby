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

llm = ChatOllama(model="gpt-oss:120b-cloud", temperature=0.7)

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
Keep your conversational responses helpful, consultative, concise, and professional. Ask one or two questions at a time to avoid overwhelming the user.

CRITICAL INSTRUCTIONS:
- Always use proper markdown code blocks (```json ... ```) when outputting actions.
- Do NOT output 'the-uuid' if you don't know the actual Task ID. If you need a Task ID from the user to perform an update, explicitly ask them for it.
- If the user asks to view, check, or verify their tasks, politely instruct them to use the "📋 View My Tasks" button from the Telegram menu instead of asking for an ID.

CHAT_STATE = 1
CONFIRM_TASK = 2

# Review states
REVIEW_SELECT, REVIEW_ACTION = range(10, 12)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start command -- initiate chat"""
    context.user_data.clear()
    context.user_data['history'] = []
    
    welcome_msg = (
        "Hey! Welcome to Kramic Task Creator!\n\n"
        "I'm an AI project manager and technical consultant. "
        "What would you like to build today? You can just type your idea, or use the menu below."
    )
    context.user_data['history'].append(AIMessage(content=welcome_msg))
    
    reply_markup = ReplyKeyboardMarkup([
        ['➕ Create a New Task', '📋 View My Tasks'],
        ['✅ Review Submissions']
    ], resize_keyboard=True)
    
    await update.message.reply_text(welcome_msg, reply_markup=reply_markup)
    return CHAT_STATE

async def handle_chat(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle conversational AI via Langchain Bounded Prompts OR Chat Replies"""
    user_text = update.message.text
    
    # Handle Menu Options
    if user_text == '📋 View My Tasks':
        from telegram.ext import ContextTypes # just in case
        await my_tasks(update, context)
        return CHAT_STATE
    elif user_text == '✅ Review Submissions':
        return await review_start(update, context)
    elif user_text == '➕ Create a New Task':
        await update.message.reply_text("Awesome! What do you want to build? Just tell me your idea.", reply_markup=ReplyKeyboardRemove())
        return CHAT_STATE
    
    # Check if this is a reply to a chat message
    if update.message.reply_to_message and update.message.reply_to_message.text:
        reply_text = update.message.reply_to_message.text
        if "💬 New Message from" in reply_text and "(ID: " in reply_text:
            import re
            task_id_match = re.search(r'\(ID: ([a-f0-9\-]+)\)', reply_text)
            if task_id_match:
                task_id = task_id_match.group(1)
                
                # Fetch the sender profile id
                sb = get_supabase()
                telegram_id = update.effective_user.id
                profile_res = sb.table("profiles").select("id").eq("telegram_chat_id", telegram_id).execute()
                
                if profile_res.data:
                    sender_id = profile_res.data[0]["id"]
                    
                    # Insert the message
                    sb.table("task_messages").insert({
                        "task_id": task_id,
                        "sender_id": sender_id,
                        "message_text": user_text,
                        "is_system_message": False
                    }).execute()
                    
                    # Notify the other party
                    task_query = sb.table("solo_tasks").select("*, profiles:assignee_id(telegram_chat_id)").eq("id", task_id).execute()
                    if task_query.data:
                        task = task_query.data[0]
                        sender_name = update.effective_user.full_name or "Someone"
                        notify_chat_id = None
                        
                        if sender_id == task.get("assignee_id"):
                            notify_chat_id = task.get("client_telegram_id")
                        else:
                            notify_chat_id = task.get("profiles", {}).get("telegram_chat_id") if task.get("profiles") else None
                            
                        if notify_chat_id:
                            notification_text = f"💬 *New Message from {sender_name}*\nTask: *{task['title']}*\n\n{user_text}\n\n_Reply to this message to chat back. (ID: {task_id})_"
                            # Can't easily import send_telegram_notification due to circular import, but we can use telegram API directly:
                            try:
                                await context.bot.send_message(chat_id=notify_chat_id, text=notification_text, parse_mode="Markdown")
                            except Exception as e:
                                print("Failed to forward:", e)
                    
                    # Add a small reaction or confirmation
                    await update.message.reply_text("✅ _Message sent_", parse_mode="Markdown")
                    return CHAT_STATE
    
    if 'history' not in context.user_data:
        context.user_data['history'] = []
        
    history = context.user_data['history']
    history.append(HumanMessage(content=user_text))
    
    if len(history) > 20:
        history = history[-20:]
        
    # Use LangChain bounded messages
    messages = [SystemMessage(content=SYSTEM_PROMPT)] + history
    
    await update.message.chat.send_action(action="typing")
    
    try:
        response = llm.invoke(messages)
        ai_text = response.content
        history.append(AIMessage(content=ai_text))
        
        # Try to parse JSON actions (with or without markdown backticks)
        import re
        action_data = None
        chat_part = ai_text
        
        # Look for markdown JSON block first
        json_match = re.search(r'```json\n(.*?)\n```', ai_text, re.DOTALL)
        if json_match:
            try:
                action_data = json.loads(json_match.group(1))
                chat_part = ai_text.split("```json")[0].strip()
            except:
                pass
        else:
            # Fallback: look for any JSON-like object
            json_match = re.search(r'(\{[\s\S]*"action"[\s\S]*\})', ai_text)
            if json_match:
                try:
                    action_data = json.loads(json_match.group(1))
                    chat_part = ai_text.replace(json_match.group(1), "").strip()
                except:
                    pass
                    
        if action_data:
            action_type = action_data.get("action")
            
            if action_type == "create_task":
                if chat_part:
                    await update.message.reply_text(chat_part)
                        
                    await update.message.reply_text("⏳ Creating your task in the database...")
                    
                    try:
                        from telegram_agent import TelegramAgent
                        agent = TelegramAgent()
                        
                        difficulty = action_data.get("difficulty", "medium").lower()
                        karma_reward = agent.calculate_karma_reward(difficulty, action_data.get("budget", 0))
                        
                        full_desc = action_data.get("description", "")
                        micro_tasks = action_data.get("micro_tasks", [])
                        
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
                        
                        context.user_data['pending_task'] = row
                        
                        # Generate a beautiful summary for confirmation
                        summary = f"📋 *Task Summary*\n\n"
                        summary += f"*{row['title']}*\n"
                        summary += f"_{row['difficulty'].title()} Difficulty | {row['time_estimate_min']} Mins_\n\n"
                        if micro_tasks:
                            summary += f"*Micro-Tasks:*\n"
                            for i, mt in enumerate(micro_tasks, 1):
                                summary += f"{i}. [{mt.get('type')}] {mt.get('title')}\n"
                        summary += f"\n*Budget:* ₹{row['reward_amount']}\n"
                        summary += f"*Karma Required:* {row['min_karma']}\n\n"
                        summary += f"Does this look good? The task is ready to be published."
                        
                        reply_markup = ReplyKeyboardMarkup([['✅ Confirm Task', '❌ Cancel']], resize_keyboard=True)
                        await update.message.reply_text(summary, parse_mode="Markdown", reply_markup=reply_markup)
                        
                    except Exception as e:
                        logger.error(f"Error preparing task creation: {e}", exc_info=True)
                        await update.message.reply_text(f"Error preparing task: {str(e)}")
                        
                    return CONFIRM_TASK
                    
            elif action_type == "update_task":
                if chat_part:
                    await update.message.reply_text(chat_part)
                
                task_id = action_data.get("task_id")
                if not task_id or task_id == "the-uuid":
                    await update.message.reply_text("I need the exact Task ID to make updates. Please provide it.")
                    return CHAT_STATE
                    
                await update.message.reply_text("⏳ Updating task in the database...")
                try:
                    sb = get_supabase()
                    updates = action_data.get("updates", {})
                    
                    res = sb.table("solo_tasks").update(updates).eq("id", task_id).execute()
                    if res.data:
                        await update.message.reply_text("✅ Task updated successfully.")
                    else:
                        await update.message.reply_text("Task not found or update failed. Please check the Task ID.")
                except Exception as e:
                    logger.error(f"Error updating task: {e}")
                    await update.message.reply_text(f"Error updating task: {str(e)}")
                    
                return CHAT_STATE

        # If no valid action was executed, just reply with the text
        if chat_part:
            await update.message.reply_text(chat_part)
        
    except Exception as e:
        logger.error(f"Error in chat: {e}", exc_info=True)
        await update.message.reply_text("Sorry, I'm having trouble processing that right now. Please try again.")

    return CHAT_STATE

async def handle_confirm_task(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle the user's response to the task confirmation prompt."""
    text = update.message.text
    
    if text == '✅ Confirm Task':
        row = context.user_data.get('pending_task')
        if not row:
            await update.message.reply_text("No pending task found. Let's start over.", reply_markup=ReplyKeyboardRemove())
            return CHAT_STATE
            
        await update.message.reply_text("⏳ Publishing your task...", reply_markup=ReplyKeyboardRemove())
        
        try:
            sb = get_supabase()
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
            logger.error(f"Error inserting confirmed task: {e}", exc_info=True)
            await update.message.reply_text(f"Error creating task: {str(e)}")
            
        context.user_data.pop('pending_task', None)
        return CHAT_STATE
        
    elif text == '❌ Cancel':
        context.user_data.pop('pending_task', None)
        await update.message.reply_text("Task creation cancelled. What would you like to change?", reply_markup=ReplyKeyboardRemove())
        return CHAT_STATE
        
    else:
        # User typed something else, maybe asking for modifications before confirming.
        context.user_data.pop('pending_task', None)
        await update.message.reply_text("I'll cancel the current draft and take your notes. What needs changing?", reply_markup=ReplyKeyboardRemove())
        return CHAT_STATE

async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Cancel the conversation."""
    context.user_data.clear()
    await update.message.reply_text(
        "Chat reset.\n\nUse /start to begin again.",
        reply_markup=ReplyKeyboardRemove()
    )
    return ConversationHandler.END


# ──────────────────────────────────────────────
# /review command — Client reviews submissions
# ──────────────────────────────────────────────
async def review_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show tasks with submissions for the client to review."""
    telegram_id = update.effective_user.id
    context.user_data['review_mode'] = True

    try:
        from database.supabase_client import get_supabase
        sb = get_supabase()

        result = sb.table('solo_tasks').select('*').eq(
            'client_telegram_id', telegram_id
        ).eq('status', 'IN_REVIEW').execute()

        tasks = result.data or []

        if not tasks:
            claimed = sb.table('solo_tasks').select('*').eq(
                'client_telegram_id', telegram_id
            ).eq('status', 'CLAIMED').execute()

            if claimed.data:
                task_list = "\n".join([
                    f"  - *{t['title']}* (In Progress)"
                    for t in claimed.data
                ])
                await update.message.reply_text(
                    f"Your tasks that are currently being worked on:\n\n"
                    f"{task_list}\n\n"
                    f"No submissions to review yet. I'll notify you when a student submits!",
                    parse_mode="Markdown"
                )
            else:
                await update.message.reply_text(
                    "You don't have any tasks with pending submissions.\n\n"
                    "Use /start to create a new task, or /mytasks to see all your tasks."
                )
            return ConversationHandler.END

        task_list = ""
        for i, t in enumerate(tasks, 1):
            task_list += (
                f"\n*{i}. {t['title']}*\n"
                f"   Budget: Rs.{t.get('reward_amount', 0)}\n"
                f"   Submission: {t.get('submission_link', 'N/A')}\n"
            )

        context.user_data['review_tasks'] = tasks

        await update.message.reply_text(
            f"*Tasks Ready for Review:*\n"
            f"{task_list}\n\n"
            f"Reply with the task number (e.g. `1`) to review it.",
            parse_mode="Markdown"
        )
        return REVIEW_SELECT

    except Exception as e:
        logger.error(f"Review error: {e}", exc_info=True)
        await update.message.reply_text(
            f"Error fetching tasks: {str(e)}"
        )
        return ConversationHandler.END


async def review_select(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Select a task to review."""
    text = update.message.text.strip()
    tasks = context.user_data.get('review_tasks', [])

    try:
        idx = int(text) - 1
        if idx < 0 or idx >= len(tasks):
            raise ValueError()
    except ValueError:
        await update.message.reply_text(
            f"Please enter a number between 1 and {len(tasks)}."
        )
        return REVIEW_SELECT

    task = tasks[idx]
    context.user_data['reviewing_task'] = task

    submission_link = task.get('submission_link')
    ai_feedback_msg = ""
    
    if submission_link and "github.com" in submission_link:
        await update.message.reply_text("Fetching and analyzing student's GitHub repository. Please wait...")
        from services.github_analyzer import analyze_github_repo
        
        micro_tasks = task.get('micro_tasks') or []
        if isinstance(micro_tasks, list) and len(micro_tasks) > 0:
            criteria = [mt.get('title', 'Unknown criteria') for mt in micro_tasks]
        else:
            criteria = ["Code executes without errors", "Requirements are met", "Code is clean and documented"]
            
        try:
            analysis = analyze_github_repo(submission_link, task['title'], criteria)
            passed = sum(analysis.passed_criteria)
            total = len(criteria)
            ai_feedback_msg = f"\n*🤖 AI Analysis Results:*\nPassed {passed}/{total} criteria.\n*Feedback:* {analysis.feedback}\n"
        except Exception as e:
            ai_feedback_msg = f"\n*🤖 AI Analysis Failed:* {str(e)}\n"

    reply_keyboard = [['Approve & Release Funds', 'Request Changes', 'Cancel Review']]

    await update.message.reply_text(
        f"*Reviewing:* {task['title']}\n\n"
        f"*Submission Link:* {submission_link or 'None'}\n"
        f"*Budget:* Rs.{task.get('reward_amount', 0)}\n"
        f"{ai_feedback_msg}\n"
        f"What would you like to do?",
        reply_markup=ReplyKeyboardMarkup(reply_keyboard, one_time_keyboard=True),
        parse_mode="Markdown"
    )

    return REVIEW_ACTION


async def review_action(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Process review action — approve or request changes."""
    action = update.message.text.strip().lower()
    task = context.user_data.get('reviewing_task')

    if not task:
        await update.message.reply_text(
            "No task selected. Use /review to start again.",
            reply_markup=ReplyKeyboardRemove()
        )
        return ConversationHandler.END

    from database.supabase_client import get_supabase
    sb = get_supabase()

    if 'approve' in action:
        try:
            sb.table('solo_tasks').update({
                'status': 'APPROVED'
            }).eq('id', task['id']).execute()

            await update.message.reply_text(
                f"*Task Approved!*\n\n"
                f"*{task['title']}* has been approved.\n"
                f"Rs.{task.get('reward_amount', 0)} released to the student. (mock)\n"
                f"The student will receive karma points!\n\n"
                f"Thank you for using Kramic!",
                reply_markup=ReplyKeyboardRemove(),
                parse_mode="Markdown"
            )
        except Exception as e:
            await update.message.reply_text(
                f"Error approving task: {str(e)}",
                reply_markup=ReplyKeyboardRemove()
            )
    elif 'changes' in action or 'revision' in action:
        try:
            sb.table('solo_tasks').update({
                'status': 'CLAIMED'
            }).eq('id', task['id']).execute()

            await update.message.reply_text(
                f"Sent *{task['title']}* back for revisions.\n"
                f"The student will be notified.\n\n"
                f"Use /review again when they resubmit.",
                reply_markup=ReplyKeyboardRemove(),
                parse_mode="Markdown"
            )
        except Exception as e:
            await update.message.reply_text(
                f"Error: {str(e)}",
                reply_markup=ReplyKeyboardRemove()
            )
    else:
        await update.message.reply_text(
            "Review cancelled.",
            reply_markup=ReplyKeyboardRemove()
        )

    context.user_data.clear()
    return ConversationHandler.END


async def my_tasks(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show all tasks for this Telegram user."""
    telegram_id = update.effective_user.id
    try:
        from database.supabase_client import get_supabase
        sb = get_supabase()
        result = sb.table('solo_tasks').select('*').eq(
            'client_telegram_id', telegram_id
        ).order('created_at', desc=True).execute()

        tasks = result.data or []
        if not tasks:
            await update.message.reply_text(
                "You haven't created any tasks yet.\n"
                "Just chat with me to create your first task!"
            )
            return

        status_emoji = {
            'OPEN': '[OPEN]',
            'CLAIMED': '[IN PROGRESS]',
            'IN_REVIEW': '[REVIEW NEEDED]',
            'APPROVED': '[DONE]',
        }

        task_list = ""
        for t in tasks:
            status = status_emoji.get(t.get('status', ''), t.get('status', ''))
            task_list += (
                f"\n{status} *{t['title']}*\n"
                f"   Budget: Rs.{t.get('reward_amount', 0)} | "
                f"Karma req: {t.get('min_karma', 0)}\n"
            )

        await update.message.reply_text(
            f"*Your Tasks:*\n{task_list}\n\n"
            f"Use /review to approve submitted work.",
            parse_mode="Markdown"
        )
    except Exception as e:
        await update.message.reply_text(f"Error: {str(e)}")


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show help info."""
    await update.message.reply_text(
        "*Kramic AI Task Bot*\n\n"
        "I am a conversational AI project manager. Just chat with me to plan and post your freelance tasks!\n\n"
        "*Commands:*\n"
        "/start -- Start a new chat session\n"
        "/mytasks -- View your tasks\n"
        "/review -- Review & approve student work\n"
        "/cancel -- Reset the chat\n"
        "/help -- Show this message\n\n"
        "Just say 'I want to build a website...' and I will guide you!",
        parse_mode="Markdown"
    )


def start_telegram_bot():
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

    # The main conversational state
    conv_handler = ConversationHandler(
        entry_points=[CommandHandler('start', start), MessageHandler(filters.TEXT & ~filters.COMMAND, handle_chat)],
        states={
            CHAT_STATE: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_chat)],
            CONFIRM_TASK: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_confirm_task)],
        },
        fallbacks=[CommandHandler('cancel', cancel)],
    )

    # Review workflow
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
    start_telegram_bot()
