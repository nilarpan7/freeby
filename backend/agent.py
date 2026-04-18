"""LangChain agent that converts unstructured task descriptions into structured BountySpec JSON.

The agent uses GPT-4o with structured output to guarantee a valid Pydantic model
containing title, stack, deliverable, micro_tasks, min_karma_required, etc.
"""
import os
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from schemas import BountySpec
from dotenv import load_dotenv

load_dotenv()

llm = ChatOpenAI(model="gpt-4o", temperature=0.2)
structured_llm = llm.with_structured_output(BountySpec)

prompt = ChatPromptTemplate.from_messages([
    ("system",
     "You are an expert technical product manager for a freelance task marketplace. "
     "Your job is to read unstructured task descriptions (which may be transcribed voice notes "
     "in Hindi, Bengali, or English) from business owners and reliably convert them into "
     "a structured, machine-readable Bounty Specification.\n\n"
     "IMPORTANT RULES:\n"
     "1. Always estimate a fair price in INR.\n"
     "2. Always decompose the work into 2-6 concrete micro_tasks. "
     "Each micro_task must have a short title and a type (Frontend, Backend, Design, Data, DevOps, or Other).\n"
     "3. Set min_karma_required based on complexity: "
     "0 for trivial tasks any beginner can do, "
     "10-30 for simple tasks, "
     "30-60 for intermediate tasks, "
     "60-100 for advanced tasks, "
     "100+ for expert-level tasks.\n"
     "4. difficulty MUST be one of: 'easy', 'medium', or 'hard'.\n"
     "5. If a Figma/design URL is mentioned, extract it into figma_url."),
    ("user", "Extract intent from the following request:\n\n{request_text}")
])

chain = prompt | structured_llm


def parse_bounty_intent(text: str) -> BountySpec:
    """Takes unstructured text and returns a validated Pydantic model for the bounty."""
    try:
        result = chain.invoke({"request_text": text})
        return result
    except Exception as e:
        print(f"Error parsing intent: {e}")
        # Fallback with defaults if parsing fails critically
        return BountySpec(
            title="Parse Error Task",
            stack=["Unknown"],
            deliverable="Failed to parse correctly. Needs manual review.",
            time_estimate_min=60,
            price_inr=100,
            category="Other",
            difficulty="medium",
            min_karma_required=0,
            micro_tasks=[]
        )
