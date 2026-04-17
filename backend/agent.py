import os
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from schemas import BountySpec
from dotenv import load_dotenv

load_dotenv()

llm = ChatOpenAI(model="gpt-4o", temperature=0.2)
structured_llm = llm.with_structured_output(BountySpec)

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an expert technical product manager for a Zero-Trust Talent Protocol. "
               "Your job is to read unstructured task descriptions (which may be transcribed voice notes "
               "in Hindi, Bengali, or English) from MSME business owners, and reliably convert them into "
               "a structured, machine-readable Bounty Specification. Estimate a fair price in INR and a reasonable time limit."),
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
        # Fallback empty/default schema if parsing fails critically
        return BountySpec(
            title="Parse Error Task",
            stack=["Unknown"],
            deliverable="Failed to parse correctly. Needs manual review.",
            time_estimate_min=60,
            price_inr=100,
            category="Other",
            difficulty="medium"
        )
