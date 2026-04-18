from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List
from services.github_analyzer import analyze_github_repo
from database.supabase_client import get_supabase

router = APIRouter(prefix="/github", tags=["Github Analysis"])

class AnalyzeRequest(BaseModel):
    user_id: str
    github_url: str
    task_id: str
    task_title: str
    ai_criteria: List[str]
    reward_karma: int

@router.post("/analyze")
async def analyze_repo(req: AnalyzeRequest):
    try:
        # Perform analysis via Langchain+Ollama
        analysis_result = analyze_github_repo(
            github_url=req.github_url,
            task_title=req.task_title,
            ai_criteria=req.ai_criteria
        )
        
        # Calculate karma earned based on passed criteria
        total_criteria = len(req.ai_criteria)
        passed_count = sum(analysis_result.passed_criteria)
        
        if total_criteria == 0:
            karma_earned = req.reward_karma
        else:
            karma_earned = int(req.reward_karma * (passed_count / total_criteria))
            
        # Update user karma in Supabase
        sb = get_supabase()
        profile_res = sb.table("profiles").select("karma_score").eq("id", req.user_id).execute()
        
        if not profile_res.data:
            raise HTTPException(status_code=404, detail="User profile not found")
            
        current_karma = profile_res.data[0].get("karma_score", 0)
        new_karma = current_karma + karma_earned
        
        sb.table("profiles").update({"karma_score": new_karma}).eq("id", req.user_id).execute()
        
        return {
            "success": True,
            "passed": analysis_result.passed_criteria,
            "feedback": analysis_result.feedback,
            "karma_earned": karma_earned,
            "new_total_karma": new_karma
        }
        
    except Exception as e:
        print(f"Error in analyze_repo: {e}")
        raise HTTPException(status_code=500, detail=str(e))
