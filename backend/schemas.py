from pydantic import BaseModel, Field
from typing import List, Optional

class BountySpec(BaseModel):
    title: str = Field(description="A short, catchy title for the bounty")
    stack: List[str] = Field(description="The primary programming languages or tools needed, e.g., ['python', 'pandas']")
    deliverable: str = Field(description="A concise description of the exact technical output expected")
    time_estimate_min: int = Field(description="Estimated time required in minutes")
    price_inr: int = Field(description="Suggested fair price in INR")
    category: str = Field(description="The general category, e.g., 'data_analysis', 'web_scraping', 'automation'")
    difficulty: str = Field(description="Difficulty tier: 'easy', 'medium', or 'hard'")
    min_karma: int = Field(default=0, description="Minimum karma score required to apply for this task")
    figma_url: Optional[str] = Field(default=None, description="Figma design URL if provided")

