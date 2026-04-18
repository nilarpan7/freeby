"""
Enhanced Telegram Bot with Conversation Flow for Task Creation (Supabase Edition)

Collects project requirements step-by-step, sends them through LangChain for
structured parsing, and inserts the result into the Supabase `solo_tasks` table.

Features:
- Task creation with AI analysis
- Mocked payment flow
- Client review & fund release via /review
"""
import logging
from telegram import Update, ReplyKeyboardMarkup, ReplyKeyboardRemove
from telegram.ext import (
    ApplicationBuilder,
    ContextTypes,
    MessageHandler,
    CommandHandler,
    ConversationHandler,
    filters
)
import os
from dotenv import load_dotenv

from telegram_agent import TelegramAgent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()
TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

# Conversation states
DESCRIPTION, DESIGN, BUDGET, PAYMENT, CONFIRM = range(5)

# Review conversation states (separate handler)
REVIEW_SELECT, REVIEW_ACTION = range(10, 12)

# Agentic layer instance
agent = TelegramAgent()


# ──────────────────────────────────────────────
# Step 0: /start
# ──────────────────────────────────────────────
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start command -- initiate task creation"""
    context.user_data.clear()

    await update.message.reply_text(
        "Hey! Welcome to Kramic Task Creator!\n\n"
        "I'll help you post a task for talented students to work on.\n\n"
        "*Step 1/4* -- Describe your project.\n"
        "Tell me everything: what you need built, key features, tech preferences, etc.\n\n"
        "_Example: 'I need a React dashboard for my shop that shows sales, "
        "inventory, and has a dark mode. Should use Tailwind and connect to a "
        "Postgres database.'_",
        parse_mode="Markdown"
    )

    return DESCRIPTION


# ──────────────────────────────────────────────
# Step 1: Project Description -> LangChain parse
# ──────────────────────────────────────────────
async def get_description(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Get task description and parse with LangChain agent."""
    description = update.message.text

    await update.message.reply_text("Analyzing your request with AI...")

    try:
        bounty_spec = agent.parse_description(description)
        context.user_data['bounty_spec'] = bounty_spec
        context.user_data['description'] = description

        # Format micro-tasks for display
        micro_tasks_display = ""
        if bounty_spec.micro_tasks:
            micro_tasks_display = "\nMicro-tasks:\n"
            for i, mt in enumerate(bounty_spec.micro_tasks, 1):
                micro_tasks_display += f"   {i}. [{mt.type}] {mt.title}\n"

        await update.message.reply_text(
            f"Got it! Here's what I understood:\n\n"
            f"*Title:* {bounty_spec.title}\n"
            f"*Stack:* {', '.join(bounty_spec.stack)}\n"
            f"*Est. time:* {bounty_spec.time_estimate_min} mins\n"
            f"*Difficulty:* {bounty_spec.difficulty}\n"
            f"*Suggested karma req:* {bounty_spec.min_karma_required}\n"
            f"*Suggested price:* Rs.{bounty_spec.price_inr}"
            f"{micro_tasks_display}\n\n"
            f"*Step 2/4* -- Do you have a design or Figma file?\n"
            f"Send me the URL, or type *skip* if you don't have one.",
            parse_mode="Markdown"
        )

        return DESIGN

    except Exception as e:
        logger.error(f"Error parsing description: {e}")
        await update.message.reply_text(
            "Sorry, I couldn't understand that. Could you describe your project "
            "in more detail? What do you need built and what tech should it use?"
        )
        return DESCRIPTION


# ──────────────────────────────────────────────
# Step 2: Design / Figma URL (or skip)
# ──────────────────────────────────────────────
async def get_design(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Get Figma/design URL or skip."""
    response = update.message.text.strip()

    if response.lower() in ('skip', 'no', 'none', 'no design', 'nope', 'n/a', '-'):
        context.user_data['figma_url'] = None
        design_msg = "No design -- no problem! "
    else:
        context.user_data['figma_url'] = response
        design_msg = "Design link saved! "

    bounty_spec = context.user_data['bounty_spec']

    await update.message.reply_text(
        f"{design_msg}\n\n"
        f"*Step 3/4* -- What's your budget?\n\n"
        f"The AI suggested *Rs.{bounty_spec.price_inr}* based on complexity.\n"
        f"Enter the amount in INR (just the number, e.g. `5000`), or type "
        f"*suggested* to use the AI's recommendation.",
        parse_mode="Markdown"
    )

    return BUDGET


# ──────────────────────────────────────────────
# Step 3: Budget
# ──────────────────────────────────────────────
async def get_budget(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Get budget amount."""
    budget_text = update.message.text.strip()
    bounty_spec = context.user_data['bounty_spec']

    if budget_text.lower() in ('suggested', 'suggest', 'auto', 'ai', 'default'):
        budget = bounty_spec.price_inr
    else:
        try:
            budget = int(''.join(filter(str.isdigit, budget_text)))
            if budget <= 0:
                raise ValueError("Budget must be positive")
        except (ValueError, TypeError):
            await update.message.reply_text(
                "Please enter a valid number for the budget (e.g. `5000`), "
                "or type *suggested* to use the AI recommendation.",
                parse_mode="Markdown"
            )
            return BUDGET

    context.user_data['budget'] = budget

    # Move to payment mock step
    await update.message.reply_text(
        f"*Step 4/4* -- Payment\n\n"
        f"Your task budget is *Rs.{budget}*.\n"
        f"The funds will be held in escrow and released to the student "
        f"only after you review and approve the work.\n\n"
        f"To proceed, type *paid {budget}* to confirm mock payment.\n\n"
        f"_This is a simulated payment for demo purposes._",
        parse_mode="Markdown"
    )

    return PAYMENT


# ──────────────────────────────────────────────
# Step 4: Mock Payment
# ──────────────────────────────────────────────
async def handle_payment(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle the mock payment confirmation."""
    text = update.message.text.strip().lower()
    budget = context.user_data['budget']

    # Accept various payment confirmations
    valid = (
        text.startswith('paid') or
        text.startswith('pay') or
        text == 'yes' or
        text == 'confirm'
    )

    if not valid:
        await update.message.reply_text(
            f"Please type *paid {budget}* to confirm payment and create the task.\n"
            f"Or /cancel to abort.",
            parse_mode="Markdown"
        )
        return PAYMENT

    context.user_data['payment_confirmed'] = True

    bounty_spec = context.user_data['bounty_spec']
    min_karma = bounty_spec.min_karma_required

    # Build confirmation summary
    micro_summary = ""
    if bounty_spec.micro_tasks:
        micro_summary = "\nMicro-tasks:\n"
        for i, mt in enumerate(bounty_spec.micro_tasks, 1):
            micro_summary += f"   {i}. [{mt.type}] {mt.title}\n"

    design_line = ""
    if context.user_data.get('figma_url'):
        design_line = f"*Design:* {context.user_data['figma_url']}\n"

    summary = (
        f"Payment of Rs.{budget} confirmed! (mock)\n\n"
        f"*Task Summary:*\n\n"
        f"*Title:* {bounty_spec.title}\n"
        f"*Stack:* {', '.join(bounty_spec.stack)}\n"
        f"*Difficulty:* {bounty_spec.difficulty}\n"
        f"*Time:* {bounty_spec.time_estimate_min} mins\n"
        f"*Budget:* Rs.{budget}\n"
        f"*Min Karma:* {min_karma}\n"
        f"{design_line}"
        f"{micro_summary}\n"
        f"*Description:*\n{bounty_spec.deliverable[:500]}\n"
    )

    reply_keyboard = [['Create Task', 'Cancel']]

    await update.message.reply_text(
        summary + "\n*Looks good? Create the task?*",
        reply_markup=ReplyKeyboardMarkup(reply_keyboard, one_time_keyboard=True),
        parse_mode="Markdown"
    )

    return CONFIRM


# ──────────────────────────────────────────────
# Step 5: Confirm & Insert into Supabase
# ──────────────────────────────────────────────
async def confirm_and_create(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Confirm and create the task in Supabase."""
    response = update.message.text.strip().lower()

    if response in ('create task', 'yes', 'confirm', 'create'):
        await update.message.reply_text(
            "Creating your task in Supabase...",
            reply_markup=ReplyKeyboardRemove()
        )

        try:
            bounty_spec = context.user_data['bounty_spec']
            budget = context.user_data['budget']

            inserted = await agent.create_task_in_supabase(
                bounty_spec=bounty_spec,
                budget=budget,
                min_karma=bounty_spec.min_karma_required,
                figma_url=context.user_data.get('figma_url'),
                client_name=update.effective_user.full_name or update.effective_user.username,
                client_telegram_id=update.effective_user.id,
            )

            task_id = inserted.get('id', 'N/A')
            karma_reward = inserted.get('karma_reward', '?')

            await update.message.reply_text(
                f"*Task Created Successfully!*\n\n"
                f"*Task ID:* `{task_id}`\n"
                f"*Title:* {bounty_spec.title}\n"
                f"*Budget:* Rs.{budget} (held in escrow)\n"
                f"*Min Karma:* {bounty_spec.min_karma_required}\n"
                f"*Karma Reward:* {karma_reward} points\n\n"
                f"Students can now see and apply for your task!\n\n"
                f"When a student submits work, use /review to check and approve it.\n"
                f"Funds will be released after your approval.\n\n"
                f"Use /start to create another task.",
                parse_mode="Markdown"
            )

            context.user_data.clear()
            return ConversationHandler.END

        except Exception as e:
            logger.error(f"Error creating task: {e}", exc_info=True)
            await update.message.reply_text(
                f"Error creating task: {str(e)}\n\n"
                f"Please try again with /start"
            )
            return ConversationHandler.END
    else:
        await update.message.reply_text(
            "Task creation cancelled.\n\n"
            "Use /start to create a new task.",
            reply_markup=ReplyKeyboardRemove()
        )
        context.user_data.clear()
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

        # Find tasks by this client that are IN_REVIEW
        result = sb.table('solo_tasks').select('*').eq(
            'client_telegram_id', telegram_id
        ).eq('status', 'IN_REVIEW').execute()

        tasks = result.data or []

        if not tasks:
            # Also check for CLAIMED tasks (in progress)
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

        # Show tasks for review
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

    reply_keyboard = [['Approve & Release Funds', 'Request Changes', 'Cancel Review']]

    await update.message.reply_text(
        f"*Reviewing:* {task['title']}\n\n"
        f"*Submission Link:* {task.get('submission_link', 'None')}\n"
        f"*Budget:* Rs.{task.get('reward_amount', 0)}\n\n"
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
        # Approve the task & release funds
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
                'status': 'CLAIMED'  # Send back to in-progress
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


# ──────────────────────────────────────────────
# /mytasks — Show all client's tasks
# ──────────────────────────────────────────────
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
                "Use /start to create your first task!"
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


# ──────────────────────────────────────────────
# Utility handlers
# ──────────────────────────────────────────────
async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Cancel the conversation."""
    context.user_data.clear()
    await update.message.reply_text(
        "Cancelled.\n\nUse /start to begin again.",
        reply_markup=ReplyKeyboardRemove()
    )
    return ConversationHandler.END


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show help info."""
    await update.message.reply_text(
        "*Kramic Task Bot*\n\n"
        "I help you post freelance tasks for students.\n\n"
        "*Commands:*\n"
        "/start -- Create a new task\n"
        "/mytasks -- View your tasks\n"
        "/review -- Review & approve student work\n"
        "/cancel -- Cancel current action\n"
        "/help -- Show this message\n\n"
        "*How it works:*\n"
        "1. Describe your project\n"
        "2. Share a design link (optional)\n"
        "3. Set your budget\n"
        "4. Confirm payment (mocked)\n"
        "5. Students apply & submit work\n"
        "6. You review via /review & release funds\n\n"
        "The AI analyzes complexity, suggests pricing, "
        "and breaks your project into micro-tasks.",
        parse_mode="Markdown"
    )


async def fallback_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Reply to messages outside the conversation flow."""
    await update.message.reply_text(
        "Hi! Use /start to create a task, /mytasks to see your tasks, or /help for more info."
    )


# ──────────────────────────────────────────────
# Bot entry point
# ──────────────────────────────────────────────
def start_telegram_bot():
    """Start the Telegram bot with conversation handler."""
    if not TELEGRAM_TOKEN or TELEGRAM_TOKEN == "your_bot_token_here":
        print("[WARN] TELEGRAM_BOT_TOKEN not configured. Skipping bot.")
        return

    # Verify Supabase connection early
    try:
        from database.supabase_client import get_supabase
        get_supabase()
    except Exception as e:
        print(f"[ERROR] Supabase connection failed: {e}")
        print("   Check SUPABASE_URL and SUPABASE_KEY in your .env file.")
        return

    app = ApplicationBuilder().token(TELEGRAM_TOKEN).build()

    # Task creation conversation: describe -> design -> budget -> payment -> confirm
    create_handler = ConversationHandler(
        entry_points=[CommandHandler('start', start)],
        states={
            DESCRIPTION: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_description)],
            DESIGN: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_design)],
            BUDGET: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_budget)],
            PAYMENT: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_payment)],
            CONFIRM: [MessageHandler(filters.TEXT & ~filters.COMMAND, confirm_and_create)],
        },
        fallbacks=[CommandHandler('cancel', cancel)],
    )

    # Review conversation: select task -> approve/reject
    review_handler = ConversationHandler(
        entry_points=[CommandHandler('review', review_start)],
        states={
            REVIEW_SELECT: [MessageHandler(filters.TEXT & ~filters.COMMAND, review_select)],
            REVIEW_ACTION: [MessageHandler(filters.TEXT & ~filters.COMMAND, review_action)],
        },
        fallbacks=[CommandHandler('cancel', cancel)],
    )

    # Register handlers
    app.add_handler(create_handler)
    app.add_handler(review_handler)
    app.add_handler(CommandHandler('mytasks', my_tasks))
    app.add_handler(CommandHandler('help', help_command))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, fallback_text))

    print("[BOT] Kramic Telegram Bot started (Supabase mode)")
    print("[BOT] Commands: /start, /mytasks, /review, /help")
    # run_polling() manages its own event loop
    app.run_polling()


if __name__ == "__main__":
    start_telegram_bot()
