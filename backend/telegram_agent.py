"""Agentic layer to orchestrate Telegram conversations and Task creation using MongoDB (Beanie)."""
from typing import Dict, Any
import logging

from database.mongodb_models import Task as MongoTask, User as MongoUser, TaskStatus, Difficulty
from agent import parse_bounty_intent

logger = logging.getLogger(__name__)


class TelegramAgent:
    def __init__(self):
        pass

    def parse_description(self, text: str):
        """Wraps `parse_bounty_intent` to return a BountySpec."""
        return parse_bounty_intent(text)

    def calculate_karma_reward(self, difficulty: str, budget: float) -> int:
        base_karma = {
            'easy': 5,
            'medium': 10,
            'hard': 20
        }
        karma = base_karma.get(difficulty.lower(), 10)
        if budget > 10000:
            karma += 10
        elif budget > 5000:
            karma += 5
        return karma

    async def ensure_client_user(self, client_tele_id: int, name: str = None) -> MongoUser:
        """Find or create a client user in MongoDB corresponding to the Telegram user."""
        client_id = f"telegram-{client_tele_id}"
        user = await MongoUser.find_one(MongoUser.id == client_id)
        if user:
            return user

        # Create minimal client user record
        doc = MongoUser(
            id=client_id,
            email=f"{client_id}@telegram.local",
            name=name or f"telegram_user_{client_tele_id}",
            role="client"
        )
        await doc.insert()
        logger.info(f"Created Mongo client user {client_id}")
        return doc

    async def create_task_from_conversation(self, client_tele_id: int, data: Dict[str, Any], client_name: str = None) -> MongoTask:
        """Persist a Task to MongoDB using the structured data from the conversation.

        `data` is expected to contain:
          - bounty_spec (BountySpec)
          - budget (int)
          - min_karma (int)
          - figma_url (optional)
        """
        bounty_spec = data['bounty_spec']

        # Ensure the client user exists in MongoDB
        client_user = await self.ensure_client_user(client_tele_id, name=client_name)

        task = MongoTask(
            title=bounty_spec.title,
            description=bounty_spec.deliverable,
            stack=bounty_spec.stack,
            difficulty=bounty_spec.difficulty.lower() if isinstance(bounty_spec.difficulty, str) else bounty_spec.difficulty,
            time_estimate_min=bounty_spec.time_estimate_min,
            min_karma=data.get('min_karma', 0),
            reward_amount=data.get('budget', 0),
            reward_karma=self.calculate_karma_reward(bounty_spec.difficulty, data.get('budget', 0)),
            figma_url=data.get('figma_url'),
            design_files=[],
            client_id=client_user.id,
            status=TaskStatus.OPEN,
            match_score=85
        )

        await task.insert()
        logger.info(f"Created Mongo task {task.id} from telegram:{client_tele_id}")
        return task
