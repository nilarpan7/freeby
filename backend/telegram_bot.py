import logging
from telegram import Update
from telegram.ext import ApplicationBuilder, ContextTypes, MessageHandler, filters
import os
from dotenv import load_dotenv

from agent import parse_bounty_intent
from database.mock_db import create_bounty

load_dotenv()
logging.basicConfig(level=logging.INFO)

TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_text = update.message.text
    await update.message.reply_text("Processing request with Langchain Agent... 🧠")
    
    # 1. Parse intent
    bounty_spec = parse_bounty_intent(user_text)
    
    # 2. Save bounty
    bounty = create_bounty(bounty_spec)
    
    # 3. Respond
    response_msg = (
        f"✅ Bounty Created Successfully! \n\n"
        f"🎯 Title: {bounty_spec.title}\n"
        f"💻 Stack: {', '.join(bounty_spec.stack)}\n"
        f"💰 Price Estimate: ₹{bounty_spec.price_inr}\n"
        f"⏱️ Time Limit: {bounty_spec.time_estimate_min} mins\n\n"
        f"Local students have been notified."
    )
    await update.message.reply_text(response_msg)

def start_telegram_polling():
    if not TELEGRAM_TOKEN or TELEGRAM_TOKEN == "your_bot_token_here":
        print("TELEGRAM_BOT_TOKEN not configured. Skipping bot polling.")
        return
        
    app = ApplicationBuilder().token(TELEGRAM_TOKEN).build()
    app.add_handler(MessageHandler(filters.TEXT & (~filters.COMMAND), handle_message))
    
    print("Starting Telegram Bot Polling...")
    app.run_polling()

if __name__ == "__main__":
    start_telegram_polling()
