import os
import re
from github import Github
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from typing import List

# Use PyGithub without token for public repos, or with token if provided
g = Github(os.environ.get("GITHUB_TOKEN"))

llm = ChatOllama(model="minimax-m2.7:cloud", temperature=0.1)

class AnalysisResult(BaseModel):
    passed_criteria: List[bool] = Field(description="List of booleans representing if each criterion passed or failed in the same order as provided.")
    feedback: str = Field(description="A short piece of overall feedback for the student based on their repository.")

structured_llm = llm.with_structured_output(AnalysisResult)

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an expert software engineer reviewing a student's code submission. Evaluate the code against the specific criteria provided. Output a list of booleans indicating if each criterion passed, and a short piece of feedback."),
    ("user", "Task Title: {task_title}\n\nCode Files Summary:\n{code_context}\n\nCriteria to Evaluate:\n{criteria_list}")
])

chain = prompt | structured_llm

def extract_repo_info(url: str) -> tuple[str, str]:
    match = re.search(r'github\.com/([^/]+)/([^/]+)', url)
    if not match:
        raise ValueError("Invalid GitHub URL")
    return match.group(1), match.group(2).replace(".git", "")

def fetch_repo_context(owner: str, repo_name: str) -> str:
    try:
        repo = g.get_repo(f"{owner}/{repo_name}")
        contents = repo.get_contents("")
        context = ""
        # fetch up to 5 interesting files (e.g. py, js, ts, html, css, etc) to avoid massive context
        valid_extensions = ('.py', '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.sql')
        files_fetched = 0
        
        while contents and files_fetched < 10:
            file_content = contents.pop(0)
            if file_content.type == "dir":
                # Only go one level deep to save time
                if file_content.path not in ('node_modules', '.git', 'venv', '__pycache__'):
                    contents.extend(repo.get_contents(file_content.path)[:5])
            elif file_content.name.endswith(valid_extensions):
                decoded_content = file_content.decoded_content.decode('utf-8')[:2000] # Cap file size
                context += f"--- {file_content.path} ---\n{decoded_content}\n\n"
                files_fetched += 1
                
        if not context.strip():
            return "No readable code files found."
        return context
    except Exception as e:
        print(f"Error fetching repo: {e}")
        return "Failed to fetch repository details."

def analyze_github_repo(github_url: str, task_title: str, ai_criteria: list[str]) -> AnalysisResult:
    try:
        owner, repo_name = extract_repo_info(github_url)
        code_context = fetch_repo_context(owner, repo_name)
        
        criteria_str = "\n".join([f"{i+1}. {c}" for i, c in enumerate(ai_criteria)])
        
        result = chain.invoke({
            "task_title": task_title,
            "code_context": code_context,
            "criteria_list": criteria_str
        })
        return result
    except Exception as e:
        print(f"Analyzer Error: {e}")
        # Fallback response
        return AnalysisResult(passed_criteria=[False]*len(ai_criteria), feedback="Error analyzing repository: " + str(e))
