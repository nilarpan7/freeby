from pydantic import BaseModel, Field
from typing import List, Optional


class MicroTask(BaseModel):
    """A single sub-task that the main project can be decomposed into."""
    title: str = Field(description="Short title for this micro-task, e.g. 'Setup Database Schema'")
    type: str = Field(description="Category: 'Frontend', 'Backend', 'Design', 'Data', 'DevOps', or 'Other'")


class BountySpec(BaseModel):
    """Structured output from the LangChain agent for a client's task request."""
    title: str = Field(description="A short, catchy title for the bounty")
    stack: List[str] = Field(description="The primary programming languages or tools needed, e.g., ['Python', 'React']")
    deliverable: str = Field(description="A concise description of the exact technical output expected")
    time_estimate_min: int = Field(description="Estimated time required in minutes")
    price_inr: int = Field(description="Suggested fair price in INR")
    category: str = Field(description="The general category, e.g., 'data_analysis', 'web_scraping', 'automation'")
    difficulty: str = Field(description="Difficulty tier: 'easy', 'medium', or 'hard'")
    min_karma_required: int = Field(
        default=0,
        description="Minimum karma score required. 0 for beginners, 20-50 for intermediate, 50+ for experienced tasks."
    )
    micro_tasks: List[MicroTask] = Field(
        default_factory=list,
        description="Break the project into 2-6 concrete micro-tasks, each with a title and type."
    )
    figma_url: Optional[str] = Field(default=None, description="Figma design URL if provided")
