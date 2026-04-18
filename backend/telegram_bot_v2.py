"""
Enhanced Telegram Bot with Conversation Flow for Task Creation
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
import json

from database.mongodb import connect_to_mongodb
from telegram_agent import TelegramAgent
logging.basicConfig(level=logging.INFO)

load_dotenv()
TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

# Conversation states
DESCRIPTION, FEATURES, DESIGN, BUDGET, MIN_KARMA, CONFIRM = range(6)

# Temporary storage for conversation data
user_data_store = {}

# Agentic layer instance
agent = TelegramAgent()

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start command - initiate task creation"""
    user_id = update.effective_user.id
    user_data_store[user_id] = {}
    
    await update.message.reply_text(
        "👋 Welcome to Kramic Task Creator!\n\n"
        "I'll help you create a task for students to work on.\n\n"
        "Let's start: What do you need to build?\n"
        "Example: 'I need a website for my shop' or 'I need a data analysis script'"
    )
    
    return DESCRIPTION

async def get_description(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Get task description"""
    user_id = update.effective_user.id
    description = update.message.text
    
    # Use AI to parse the description via agent
    await update.message.reply_text("🧠 Analyzing your request...")
    
    try:
        bounty_spec = agent.parse_description(description)
        user_data_store[user_id]['bounty_spec'] = bounty_spec
        user_data_store[user_id]['description'] = description
        
        await update.message.reply_text(
            f"✅ Got it! I understood:\n\n"
            f"📝 Title: {bounty_spec.title}\n"
            f"💻 Stack: {', '.join(bounty_spec.stack)}\n"
            f"⏱️ Estimated time: {bounty_spec.time_estimate_min} minutes\n"
            f"📊 Difficulty: {bounty_spec.difficulty}\n\n"
            f"Now, tell me more about the features you need.\n"
            f"What specific functionality should it have?"
        )
        
        return FEATURES
    except Exception as e:
        logging.error(f"Error parsing description: {e}")
        await update.message.reply_text(
            "❌ Sorry, I couldn't understand that. Please describe your project more clearly."
        )
        return DESCRIPTION

async def get_features(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Get additional features"""
    user_id = update.effective_user.id
    features = update.message.text
    
    user_data_store[user_id]['features'] = features
    
    # Update description with features
    bounty_spec = user_data_store[user_id]['bounty_spec']
    bounty_spec.deliverable += f"\n\nAdditional features: {features}"
    
    reply_keyboard = [['Yes, I have a design', 'No design yet']]
    
    await update.message.reply_text(
        "🎨 Do you have a design or Figma file ready?\n\n"
        "If yes, please share the link in the next message.\n"
        "If no, we'll proceed without it.",
        reply_markup=ReplyKeyboardMarkup(reply_keyboard, one_time_keyboard=True)
    )
    
    return DESIGN

async def get_design(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Get design file or skip"""
    user_id = update.effective_user.id
    response = update.message.text
    
    if response.lower() in ['yes, i have a design', 'yes']:
        await update.message.reply_text(
            "Great! Please send me the Figma URL or design file link:",
            reply_markup=ReplyKeyboardRemove()
        )
        user_data_store[user_id]['waiting_for_design_url'] = True
        return DESIGN
    elif user_data_store[user_id].get('waiting_for_design_url'):
        # This is the design URL
        design_url = update.message.text
        user_data_store[user_id]['figma_url'] = design_url
        user_data_store[user_id]['waiting_for_design_url'] = False
        
        await update.message.reply_text(
            f"✅ Design link saved: {design_url}\n\n"
            f"💰 What's your budget for this task?\n"
            f"Please enter the amount in INR (e.g., 5000)"
        )
        return BUDGET
    else:
        # No design
        user_data_store[user_id]['figma_url'] = None
        
        await update.message.reply_text(
            "No problem! We'll proceed without a design.\n\n"
            "💰 What's your budget for this task?\n"
            "Please enter the amount in INR (e.g., 5000)",
            reply_markup=ReplyKeyboardRemove()
        )
        return BUDGET

async def get_budget(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Get budget amount"""
    user_id = update.effective_user.id
    budget_text = update.message.text
    
    try:
        # Extract number from text
        budget = int(''.join(filter(str.isdigit, budget_text)))
        user_data_store[user_id]['budget'] = budget
        
        await update.message.reply_text(
            f"✅ Budget set to ₹{budget}\n\n"
            f"⚡ What minimum karma score should students have to apply?\n\n"
            f"Karma represents a student's experience and reliability:\n"
            f"• 0-20: Beginners\n"
            f"• 20-50: Intermediate\n"
            f"• 50-100: Experienced\n"
            f"• 100+: Expert\n\n"
            f"Enter a number (e.g., 0 for beginners, 50 for experienced):"
        )
        
        return MIN_KARMA
    except ValueError:
        await update.message.reply_text(
            "❌ Please enter a valid number for the budget (e.g., 5000)"
        )
        return BUDGET

async def get_min_karma(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Get minimum karma requirement"""
    user_id = update.effective_user.id
    karma_text = update.message.text
    
    try:
        min_karma = int(''.join(filter(str.isdigit, karma_text)))
        user_data_store[user_id]['min_karma'] = min_karma
        
        # Show summary
        data = user_data_store[user_id]
        bounty_spec = data['bounty_spec']
        
        summary = (
            "📋 Task Summary:\n\n"
            f"📝 Title: {bounty_spec.title}\n"
            f"💻 Stack: {', '.join(bounty_spec.stack)}\n"
            f"📊 Difficulty: {bounty_spec.difficulty}\n"
            f"⏱️ Time: {bounty_spec.time_estimate_min} minutes\n"
            f"💰 Budget: ₹{data['budget']}\n"
            f"⚡ Min Karma: {min_karma}\n"
        )
        
        if data.get('figma_url'):
            summary += f"🎨 Design: {data['figma_url']}\n"
        
        summary += f"\n📄 Description:\n{bounty_spec.deliverable}\n"
        
        reply_keyboard = [['✅ Create Task', '❌ Cancel']]
        
        await update.message.reply_text(
            summary + "\n\nLooks good?",
            reply_markup=ReplyKeyboardMarkup(reply_keyboard, one_time_keyboard=True)
        )
        
        return CONFIRM
    except ValueError:
        await update.message.reply_text(
            "❌ Please enter a valid number for minimum karma (e.g., 0, 20, 50)"
        )
        return MIN_KARMA

async def confirm_and_create(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Confirm and create the task"""
    user_id = update.effective_user.id
    response = update.message.text
    
    if response == '✅ Create Task':
        await update.message.reply_text(
            "⏳ Creating your task...",
            reply_markup=ReplyKeyboardRemove()
        )
        
        try:
            data = user_data_store[user_id]
            bounty_spec = data['bounty_spec']

            # Create task via agentic layer (await async Beanie operations)
            task = await agent.create_task_from_conversation(user_id, data, client_name=update.effective_user.full_name or update.effective_user.username)

            await update.message.reply_text(
                f"✅ Task Created Successfully!\n\n"
                f"🎯 Task ID: {task.id}\n"
                f"📝 Title: {task.title}\n"
                f"💰 Budget: ₹{task.reward_amount}\n"
                f"⚡ Min Karma: {task.min_karma}\n"
                f"🏆 Karma Reward: {task.reward_karma} points\n\n"
                f"Students can now see and apply for your task on the website!\n\n"
                f"Use /start to create another task."
            )
            
            # Clear user data
            del user_data_store[user_id]
            
            return ConversationHandler.END
            
        except Exception as e:
            logging.error(f"Error creating task: {e}")
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
        del user_data_store[user_id]
        return ConversationHandler.END

async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Cancel the conversation"""
    user_id = update.effective_user.id
    if user_id in user_data_store:
        del user_data_store[user_id]
    
    await update.message.reply_text(
        "❌ Task creation cancelled.\n\n"
        "Use /start to create a new task.",
        reply_markup=ReplyKeyboardRemove()
    )
    return ConversationHandler.END

async def help_fallback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Fallback for plain text messages outside the conversation."""
    await update.message.reply_text(
        "Hi — to create a task please use the /start command."
    )


async def log_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Print every incoming message/update to the console for debugging."""
    user = update.effective_user
    try:
        text = update.message.text if update.message and update.message.text is not None else "<non-text>"
    except Exception:
        text = str(update)

    uname = getattr(user, 'username', None)
    fullname = getattr(user, 'full_name', None) if user else None
    print(f"[TELEGRAM] from={getattr(user,'id',None)} username={uname} name={fullname} text={text}")
    logging.info(f"Telegram update: user={getattr(user,'id',None)} text={text}")

def calculate_karma_reward(difficulty: str, budget: float) -> int:
    """Calculate karma reward based on difficulty and budget"""
    base_karma = {
        'easy': 5,
        'medium': 10,
        'hard': 20
    }
    
    karma = base_karma.get(difficulty.lower(), 10)
    
    # Bonus karma for higher budgets
    if budget > 10000:
        karma += 10
    elif budget > 5000:
        karma += 5
    
    return karma


async def start_telegram_bot():
    """Start the Telegram bot with conversation handler (async version)"""
    if not TELEGRAM_TOKEN or TELEGRAM_TOKEN == "your_bot_token_here":
        print("TELEGRAM_BOT_TOKEN not configured. Skipping bot.")
        return
    # Ensure MongoDB connection for Beanie models is initialized
    try:
        await connect_to_mongodb()
    except Exception as e:
        print(f"Failed to connect to MongoDB before starting bot: {e}")
        return

    app = ApplicationBuilder().token(TELEGRAM_TOKEN).build()

    # Conversation handler
    conv_handler = ConversationHandler(
        entry_points=[CommandHandler('start', start)],
        states={
            DESCRIPTION: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_description)],
            FEATURES: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_features)],
            DESIGN: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_design)],
            BUDGET: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_budget)],
            MIN_KARMA: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_min_karma)],
            CONFIRM: [MessageHandler(filters.TEXT & ~filters.COMMAND, confirm_and_create)],
        },
        fallbacks=[CommandHandler('cancel', cancel)],
    )

    # Logging handler: print every update before other handlers
    app.add_handler(MessageHandler(filters.ALL, log_message), group=0)

    app.add_handler(conv_handler)
    # Fallback: reply to plain texts with a short help message
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, help_fallback))

    print("🤖 Starting Enhanced Telegram Bot with Conversation Flow...")
    print("📱 Send /start to begin creating a task")
    await app.run_polling()

if __name__ == "__main__":
    asyncio.run(start_telegram_bot())
