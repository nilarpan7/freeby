"""
Enhanced Telegram Bot with Conversation Flow for Task Creation (Supabase Edition)

Collects project requirements step-by-step, sends them through LangChain for
structured parsing, and inserts the result into the Supabase `solo_tasks` table.
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
import asyncio

from telegram_agent import TelegramAgent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()
TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

# Conversation states
DESCRIPTION, DESIGN, BUDGET, CONFIRM = range(4)

# Agentic layer instance
agent = TelegramAgent()


# ──────────────────────────────────────────────
# Step 0: /start
# ──────────────────────────────────────────────
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start command — initiate task creation"""
    # Clear any previous conversation data
    context.user_data.clear()

    await update.message.reply_text(
        "👋 Welcome to Kramic Task Creator!\n\n"
        "I'll help you post a task for talented students to work on.\n\n"
        "📝 *Step 1/3* — Describe your project.\n"
        "Tell me everything: what you need built, key features, tech preferences, etc.\n\n"
        "_Example: 'I need a React dashboard for my shop that shows sales, "
        "inventory, and has a dark mode. Should use Tailwind and connect to a "
        "Postgres database.'_",
        parse_mode="Markdown"
    )

    return DESCRIPTION


# ──────────────────────────────────────────────
# Step 1: Project Description → LangChain parse
# ──────────────────────────────────────────────
async def get_description(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Get task description and parse with LangChain agent."""
    description = update.message.text

    await update.message.reply_text("🧠 Analyzing your request with AI...")

    try:
        bounty_spec = agent.parse_description(description)
        context.user_data['bounty_spec'] = bounty_spec
        context.user_data['description'] = description

        # Format micro-tasks for display
        micro_tasks_display = ""
        if bounty_spec.micro_tasks:
            micro_tasks_display = "\n🔨 *Micro-tasks:*\n"
            for i, mt in enumerate(bounty_spec.micro_tasks, 1):
                micro_tasks_display += f"   {i}. [{mt.type}] {mt.title}\n"

        await update.message.reply_text(
            f"✅ Got it! Here's what I understood:\n\n"
            f"📝 *Title:* {bounty_spec.title}\n"
            f"💻 *Stack:* {', '.join(bounty_spec.stack)}\n"
            f"⏱️ *Est. time:* {bounty_spec.time_estimate_min} mins\n"
            f"📊 *Difficulty:* {bounty_spec.difficulty}\n"
            f"⚡ *Suggested karma req:* {bounty_spec.min_karma_required}\n"
            f"💰 *Suggested price:* ₹{bounty_spec.price_inr}"
            f"{micro_tasks_display}\n\n"
            f"🎨 *Step 2/3* — Do you have a design or Figma file?\n"
            f"Send me the URL, or type *skip* if you don't have one.",
            parse_mode="Markdown"
        )

        return DESIGN

    except Exception as e:
        logger.error(f"Error parsing description: {e}")
        await update.message.reply_text(
            "❌ Sorry, I couldn't understand that. Could you describe your project "
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
        design_msg = "No design — no problem! "
    else:
        context.user_data['figma_url'] = response
        design_msg = f"✅ Design link saved! "

    bounty_spec = context.user_data['bounty_spec']

    await update.message.reply_text(
        f"{design_msg}\n\n"
        f"💰 *Step 3/3* — What's your budget?\n\n"
        f"The AI suggested *₹{bounty_spec.price_inr}* based on complexity.\n"
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
                "❌ Please enter a valid number for the budget (e.g. `5000`), "
                "or type *suggested* to use the AI recommendation.",
                parse_mode="Markdown"
            )
            return BUDGET

    context.user_data['budget'] = budget
    min_karma = bounty_spec.min_karma_required

    # Build confirmation summary
    micro_summary = ""
    if bounty_spec.micro_tasks:
        micro_summary = "\n🔨 *Micro-tasks:*\n"
        for i, mt in enumerate(bounty_spec.micro_tasks, 1):
            micro_summary += f"   {i}. [{mt.type}] {mt.title}\n"

    design_line = ""
    if context.user_data.get('figma_url'):
        design_line = f"🎨 *Design:* {context.user_data['figma_url']}\n"

    summary = (
        "📋 *Task Summary — Please confirm:*\n\n"
        f"📝 *Title:* {bounty_spec.title}\n"
        f"💻 *Stack:* {', '.join(bounty_spec.stack)}\n"
        f"📊 *Difficulty:* {bounty_spec.difficulty}\n"
        f"⏱️ *Time:* {bounty_spec.time_estimate_min} mins\n"
        f"💰 *Budget:* ₹{budget}\n"
        f"⚡ *Min Karma:* {min_karma}\n"
        f"{design_line}"
        f"{micro_summary}\n"
        f"📄 *Description:*\n{bounty_spec.deliverable[:500]}\n"
    )

    reply_keyboard = [['✅ Create Task', '❌ Cancel']]

    await update.message.reply_text(
        summary + "\n*Looks good?*",
        reply_markup=ReplyKeyboardMarkup(reply_keyboard, one_time_keyboard=True),
        parse_mode="Markdown"
    )

    return CONFIRM


# ──────────────────────────────────────────────
# Step 4: Confirm & Insert into Supabase
# ──────────────────────────────────────────────
async def confirm_and_create(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Confirm and create the task in Supabase."""
    response = update.message.text

    if response == '✅ Create Task':
        await update.message.reply_text(
            "⏳ Creating your task in Supabase...",
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
                f"✅ *Task Created Successfully!*\n\n"
                f"🎯 *Task ID:* `{task_id}`\n"
                f"📝 *Title:* {bounty_spec.title}\n"
                f"💰 *Budget:* ₹{budget}\n"
                f"⚡ *Min Karma:* {bounty_spec.min_karma_required}\n"
                f"🏆 *Karma Reward:* {karma_reward} points\n\n"
                f"Students can now see and apply for your task on the website!\n\n"
                f"Use /start to create another task.",
                parse_mode="Markdown"
            )

            context.user_data.clear()
            return ConversationHandler.END

        except Exception as e:
            logger.error(f"Error creating task: {e}", exc_info=True)
            await update.message.reply_text(
                f"❌ Error creating task: {str(e)}\n\n"
                f"Please try again with /start"
            )
            return ConversationHandler.END
    else:
        await update.message.reply_text(
            "❌ Task creation cancelled.\n\n"
            "Use /start to create a new task.",
            reply_markup=ReplyKeyboardRemove()
        )
        context.user_data.clear()
        return ConversationHandler.END


# ──────────────────────────────────────────────
# Utility handlers
# ──────────────────────────────────────────────
async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Cancel the conversation."""
    context.user_data.clear()
    await update.message.reply_text(
        "❌ Task creation cancelled.\n\nUse /start to begin again.",
        reply_markup=ReplyKeyboardRemove()
    )
    return ConversationHandler.END


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show help info."""
    await update.message.reply_text(
        "🤖 *Kramic Task Bot*\n\n"
        "I help you post freelance tasks for students.\n\n"
        "*Commands:*\n"
        "/start — Create a new task\n"
        "/cancel — Cancel current task creation\n"
        "/help — Show this message\n\n"
        "*How it works:*\n"
        "1️⃣ Describe your project\n"
        "2️⃣ Share a design link (optional)\n"
        "3️⃣ Set your budget\n"
        "4️⃣ Confirm & publish!\n\n"
        "The AI will automatically analyze complexity, suggest pricing, "
        "and break your project into micro-tasks.",
        parse_mode="Markdown"
    )


async def fallback_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Reply to messages outside the conversation flow."""
    await update.message.reply_text(
        "👋 Hi! Use /start to create a task, or /help for more info."
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

    # Conversation handler: describe -> design -> budget -> confirm
    conv_handler = ConversationHandler(
        entry_points=[CommandHandler('start', start)],
        states={
            DESCRIPTION: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_description)],
            DESIGN: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_design)],
            BUDGET: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_budget)],
            CONFIRM: [MessageHandler(filters.TEXT & ~filters.COMMAND, confirm_and_create)],
        },
        fallbacks=[CommandHandler('cancel', cancel)],
    )

    # Register handlers (conversation first, then fallbacks)
    app.add_handler(conv_handler)
    app.add_handler(CommandHandler('help', help_command))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, fallback_text))

    print("[BOT] Kramic Telegram Bot started (Supabase mode)")
    print("[BOT] Send /start to begin creating a task")
    # run_polling() manages its own event loop — do NOT use asyncio.run()
    app.run_polling()


if __name__ == "__main__":
    start_telegram_bot()

