"""Agentic layer to orchestrate Telegram conversations and Task creation using Supabase."""
from typing import Dict, Any, Optional
import logging
import json

from database.supabase_client import get_supabase
from agent import parse_bounty_intent
from schemas import BountySpec

logger = logging.getLogger(__name__)


class TelegramAgent:
    """Bridges Telegram conversation data → LangChain parsing → Supabase insertion."""

    def __init__(self):
        pass

    def parse_description(self, text: str) -> BountySpec:
        """Wraps `parse_bounty_intent` to return a BountySpec."""
        return parse_bounty_intent(text)

    def calculate_karma_reward(self, difficulty: str, budget: float) -> int:
        """Calculate karma reward points given to the student who completes the task."""
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

    async def create_task_in_supabase(
        self,
        bounty_spec: BountySpec,
        budget: int,
        min_karma: int,
        figma_url: Optional[str] = None,
        client_name: Optional[str] = None,
        client_telegram_id: Optional[int] = None,
    ) -> dict:
        """Insert a new row into the Supabase `solo_tasks` table.

        Returns the inserted row as a dict.
        """
        difficulty = bounty_spec.difficulty.lower()
        if difficulty not in ('easy', 'medium', 'hard'):
            difficulty = 'medium'

        karma_reward = self.calculate_karma_reward(difficulty, budget)

        # Build micro_tasks list
        micro_tasks_list = [
            {"title": mt.title, "type": mt.type}
            for mt in bounty_spec.micro_tasks
        ]

        full_description = bounty_spec.deliverable

        row = {
            "title": bounty_spec.title,
            "description": full_description,
            "stack": bounty_spec.stack,
            "difficulty": difficulty,
            "time_estimate_min": bounty_spec.time_estimate_min,
            "min_karma": min_karma,
            "reward_amount": budget,
            "karma_reward": karma_reward,
            "status": "OPEN",
        }

        # Try to include optional columns (they may not exist yet if migration wasn't run)
        optional_cols = {}
        if figma_url:
            optional_cols["figma_url"] = figma_url
        if client_name:
            optional_cols["client_name"] = client_name
        if client_telegram_id:
            optional_cols["client_telegram_id"] = client_telegram_id
        if micro_tasks_list:
            optional_cols["micro_tasks"] = micro_tasks_list  # supabase-py handles JSONB

        sb = get_supabase()

        # First try with all columns (post-migration)
        try:
            full_row = {**row, **optional_cols}
            result = sb.table("solo_tasks").insert(full_row).execute()
        except Exception as e:
            logger.warning(f"Insert with optional columns failed ({e}), retrying with base columns only")
            # Fallback: insert without the optional columns (pre-migration)
            result = sb.table("solo_tasks").insert(row).execute()

        if result.data:
            inserted = result.data[0]
            logger.info(f"Created Supabase task {inserted.get('id')} via telegram:{client_telegram_id}")
            return inserted
        else:
            raise RuntimeError(f"Supabase insert returned no data: {result}")
