"""
Multi-pass agentic code analysis pipeline.

Runs 4 sequential LLM passes on a GitHub repository:
  Pass 1: Structure Analysis — detect languages, framework, project type
  Pass 2: Criteria Evaluation — check each requirement criterion
  Pass 3: Error Detection — find bugs, style issues, security concerns
  Pass 4: Resolution Suggestions — propose fixes for detected errors

Each pass persists its results to the analysis_passes table.
"""
import os
import time
import json
import logging
from typing import List, Optional

from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage, HumanMessage

from services.analysis_models import (
    StructureReport, CriteriaEvaluation, CriterionResult,
    ErrorDetection, CodeError, ErrorResolutions, ErrorResolution,
    AnalysisReport,
)
from services.github_fetcher import build_code_context, CodeContext
from database.supabase_client import get_supabase

logger = logging.getLogger(__name__)

MODEL_NAME = os.environ.get("ANALYSIS_MODEL", "gpt-oss:120b-cloud")


def _get_llm(temperature: float = 0.1):
    """Get a ChatOllama instance."""
    return ChatOllama(model=MODEL_NAME, temperature=temperature)


def _safe_json_parse(text: str) -> dict:
    """Extract and parse JSON from LLM response text."""
    text = text.strip()
    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Try extracting from markdown code block
    if "```json" in text:
        start = text.index("```json") + 7
        end = text.index("```", start)
        return json.loads(text[start:end].strip())
    if "```" in text:
        start = text.index("```") + 3
        end = text.index("```", start)
        return json.loads(text[start:end].strip())
    # Try finding first { to last }
    first_brace = text.find("{")
    last_brace = text.rfind("}")
    if first_brace != -1 and last_brace != -1:
        return json.loads(text[first_brace:last_brace + 1])
    raise ValueError(f"Could not parse JSON from LLM output: {text[:200]}")


class AgenticAnalyzer:
    """Multi-pass agentic code analysis pipeline."""

    def __init__(self):
        self.llm = _get_llm()
        self.sb = get_supabase()

    async def analyze(
        self,
        github_url: str,
        quest_id: str,
        quest_title: str,
        criteria: List[str],
        student_id: str,
        reward_karma: int,
        quest_type: str = "starter",
    ) -> AnalysisReport:
        """Run the full 4-pass agentic pipeline."""
        start_time = time.time()

        # Create submission record
        attempt = self._get_attempt_number(student_id, quest_id)
        sub_row = {
            "student_id": student_id,
            "quest_id": quest_id,
            "quest_type": quest_type,
            "github_url": github_url,
            "status": "analyzing",
            "attempt_number": attempt,
            "criteria_total": len(criteria),
            "model_used": MODEL_NAME,
        }
        sub_result = self.sb.table("quest_submissions").insert(sub_row).execute()
        submission_id = sub_result.data[0]["id"] if sub_result.data else None

        try:
            # Step 1: Fetch code from GitHub
            logger.info(f"[Pipeline] Fetching repo: {github_url}")
            code_ctx = await build_code_context(github_url)

            # Pass 1: Structure Analysis
            logger.info("[Pipeline] Pass 1: Structure Analysis")
            structure = await self._pass_structure(code_ctx, submission_id)

            # Pass 2: Criteria Evaluation
            logger.info("[Pipeline] Pass 2: Criteria Evaluation")
            criteria_results = await self._pass_criteria(code_ctx, quest_title, criteria, submission_id)

            # Pass 3: Error Detection
            logger.info("[Pipeline] Pass 3: Error Detection")
            errors = await self._pass_errors(code_ctx, structure, submission_id)

            # Pass 4: Resolution Suggestions (only if errors found)
            resolutions = []
            if errors:
                logger.info(f"[Pipeline] Pass 4: Resolution for {len(errors)} errors")
                resolutions = await self._pass_resolutions(code_ctx, errors, submission_id)
            else:
                logger.info("[Pipeline] Pass 4: Skipped (no errors)")

            # Compute final scores
            passed_count = sum(1 for c in criteria_results if c.passed)
            total_count = len(criteria)
            score_pct = (passed_count / total_count * 100) if total_count > 0 else 100
            karma_earned = int(reward_karma * (passed_count / total_count)) if total_count > 0 else reward_karma

            duration_ms = int((time.time() - start_time) * 1000)

            # Build summary
            error_count = len([e for e in errors if e.severity == "error"])
            warning_count = len([e for e in errors if e.severity == "warning"])
            summary = (
                f"Analyzed {code_ctx.files_analyzed} files from {code_ctx.owner}/{code_ctx.repo}. "
                f"Passed {passed_count}/{total_count} criteria ({score_pct:.0f}%). "
                f"Found {error_count} errors and {warning_count} warnings. "
                f"Karma earned: +{karma_earned}."
            )

            status = "passed" if score_pct >= 50 else "failed"

            report = AnalysisReport(
                submission_id=submission_id,
                structure=structure,
                criteria_results=criteria_results,
                errors=errors,
                resolutions=resolutions,
                summary=summary,
                score_pct=score_pct,
                karma_earned=karma_earned,
                files_analyzed=code_ctx.files_analyzed,
                analysis_duration_ms=duration_ms,
                model_used=MODEL_NAME,
            )

            # Update submission record
            if submission_id:
                self.sb.table("quest_submissions").update({
                    "status": status,
                    "analysis_summary": summary,
                    "criteria_results": [c.model_dump() for c in criteria_results],
                    "error_report": [e.model_dump() for e in errors],
                    "structure_report": structure.model_dump(),
                    "criteria_passed": passed_count,
                    "score_pct": float(score_pct),
                    "karma_earned": karma_earned,
                    "files_analyzed": code_ctx.files_analyzed,
                    "analysis_duration_ms": duration_ms,
                    "completed_at": "now()",
                }).eq("id", submission_id).execute()

            # Update karma in profiles
            if karma_earned > 0 and student_id:
                self._update_karma(student_id, karma_earned, quest_title, submission_id)

            return report

        except Exception as e:
            logger.error(f"[Pipeline] Failed: {e}", exc_info=True)
            if submission_id:
                self.sb.table("quest_submissions").update({
                    "status": "error",
                    "analysis_summary": f"Analysis failed: {str(e)}",
                    "completed_at": "now()",
                }).eq("id", submission_id).execute()
            raise

    def _get_attempt_number(self, student_id: str, quest_id: str) -> int:
        """Get the next attempt number for this student+quest combo."""
        try:
            result = self.sb.table("quest_submissions").select("attempt_number") \
                .eq("student_id", student_id).eq("quest_id", quest_id) \
                .order("attempt_number", desc=True).limit(1).execute()
            if result.data:
                return result.data[0]["attempt_number"] + 1
        except Exception:
            pass
        return 1

    def _update_karma(self, student_id: str, karma_earned: int, quest_title: str, submission_id: str):
        """Update profile karma and add karma_history entry."""
        try:
            # Get current karma
            profile = self.sb.table("profiles").select("karma_score").eq("id", student_id).execute()
            current = profile.data[0]["karma_score"] if profile.data else 0
            new_total = current + karma_earned

            # Update profile
            self.sb.table("profiles").update({"karma_score": new_total}).eq("id", student_id).execute()

            # Insert karma history
            self.sb.table("karma_history").insert({
                "student_id": student_id,
                "karma_delta": karma_earned,
                "karma_total": new_total,
                "event_type": "quest_pass",
                "event_ref_id": submission_id,
                "event_title": quest_title,
            }).execute()
        except Exception as e:
            logger.error(f"Failed to update karma: {e}")

    def _save_pass(self, submission_id: str, pass_number: int, pass_type: str,
                   input_context: str, output_raw: str, output_parsed: dict, duration_ms: int):
        """Persist an analysis pass to the database."""
        if not submission_id:
            return
        try:
            self.sb.table("analysis_passes").insert({
                "submission_id": submission_id,
                "pass_number": pass_number,
                "pass_type": pass_type,
                "input_context": input_context[:5000] if input_context else None,
                "output_raw": output_raw[:5000] if output_raw else None,
                "output_parsed": output_parsed,
                "duration_ms": duration_ms,
            }).execute()
        except Exception as e:
            logger.warning(f"Failed to save pass {pass_number}: {e}")

    # ─── PASS 1: STRUCTURE ANALYSIS ───

    async def _pass_structure(self, ctx: CodeContext, submission_id: str) -> StructureReport:
        """Analyze project structure."""
        t0 = time.time()

        file_tree = "\n".join(f.path for f in ctx.structure.files[:80])
        prompt = f"""Analyze this GitHub repository structure and return a JSON object.

Repository: {ctx.owner}/{ctx.repo}
File Tree:
{file_tree}

Return ONLY valid JSON with these fields:
{{
  "languages": ["list", "of", "languages"],
  "framework": "main framework or null",
  "has_readme": true/false,
  "has_tests": true/false,
  "has_package_json": true/false,
  "file_count": number,
  "project_type": "web_app|api|cli|library|static_site|unknown",
  "entry_point": "main entry file or null"
}}"""

        try:
            response = self.llm.invoke([HumanMessage(content=prompt)])
            raw = response.content
            parsed = _safe_json_parse(raw)
            report = StructureReport(**parsed)
        except Exception as e:
            logger.warning(f"Pass 1 LLM failed, using heuristics: {e}")
            report = StructureReport(
                languages=list(ctx.structure.languages),
                has_readme=ctx.structure.has_readme,
                has_tests=ctx.structure.has_tests,
                has_package_json=ctx.structure.has_package_json,
                file_count=ctx.structure.total_files,
            )
            raw = str(e)

        duration_ms = int((time.time() - t0) * 1000)
        self._save_pass(submission_id, 1, "structure", file_tree, raw, report.model_dump(), duration_ms)
        return report

    # ─── PASS 2: CRITERIA EVALUATION ───

    async def _pass_criteria(self, ctx: CodeContext, quest_title: str,
                             criteria: List[str], submission_id: str) -> List[CriterionResult]:
        """Evaluate each criterion against the code."""
        t0 = time.time()

        criteria_str = "\n".join(f"{i+1}. {c}" for i, c in enumerate(criteria))
        prompt = f"""You are an expert code reviewer evaluating a student's submission.

Task: {quest_title}
Repository: {ctx.owner}/{ctx.repo}

Code Files:
{ctx.context_text[:20000]}

Criteria to evaluate:
{criteria_str}

For EACH criterion, determine if it PASSED or FAILED based on the actual code.
Return ONLY valid JSON:
{{
  "results": [
    {{"criterion": "criterion text", "passed": true/false, "evidence": "brief explanation with code reference"}}
  ]
}}"""

        try:
            response = self.llm.invoke([HumanMessage(content=prompt)])
            raw = response.content
            parsed = _safe_json_parse(raw)
            results = [CriterionResult(**r) for r in parsed.get("results", [])]
        except Exception as e:
            logger.warning(f"Pass 2 LLM failed: {e}")
            results = [CriterionResult(criterion=c, passed=False, evidence="Analysis error") for c in criteria]
            raw = str(e)

        # Ensure we have results for all criteria
        if len(results) < len(criteria):
            for c in criteria[len(results):]:
                results.append(CriterionResult(criterion=c, passed=False, evidence="Not evaluated"))

        duration_ms = int((time.time() - t0) * 1000)
        self._save_pass(submission_id, 2, "criteria", criteria_str, raw,
                        {"results": [r.model_dump() for r in results]}, duration_ms)
        return results

    # ─── PASS 3: ERROR DETECTION ───

    async def _pass_errors(self, ctx: CodeContext, structure: StructureReport,
                           submission_id: str) -> List[CodeError]:
        """Detect errors, bugs, and issues in the code."""
        t0 = time.time()

        prompt = f"""You are an expert code reviewer. Analyze this codebase for errors, bugs, and issues.

Project type: {structure.project_type}
Framework: {structure.framework}
Languages: {', '.join(structure.languages)}

Code Files:
{ctx.context_text[:20000]}

Find real issues: syntax errors, logic bugs, missing error handling, security issues, performance problems.
Do NOT report style preferences or minor formatting. Focus on real problems.

Return ONLY valid JSON:
{{
  "errors": [
    {{
      "file": "path/to/file.js",
      "line": 42,
      "severity": "error|warning|info",
      "message": "description of the issue",
      "category": "syntax|logic|style|security|performance"
    }}
  ]
}}

If no errors found, return {{"errors": []}}"""

        try:
            response = self.llm.invoke([HumanMessage(content=prompt)])
            raw = response.content
            parsed = _safe_json_parse(raw)
            errors = [CodeError(**e) for e in parsed.get("errors", [])]
        except Exception as e:
            logger.warning(f"Pass 3 LLM failed: {e}")
            errors = []
            raw = str(e)

        duration_ms = int((time.time() - t0) * 1000)
        self._save_pass(submission_id, 3, "error_detection", "code context", raw,
                        {"errors": [e.model_dump() for e in errors]}, duration_ms)
        return errors

    # ─── PASS 4: RESOLUTION SUGGESTIONS ───

    async def _pass_resolutions(self, ctx: CodeContext, errors: List[CodeError],
                                submission_id: str) -> List[ErrorResolution]:
        """Suggest fixes for detected errors."""
        t0 = time.time()

        error_list = "\n".join(
            f"{i}. [{e.severity}] {e.file}:{e.line or '?'} — {e.message}"
            for i, e in enumerate(errors)
        )

        prompt = f"""You are a senior developer helping a student fix issues in their code.

Errors found:
{error_list}

Relevant code:
{ctx.context_text[:15000]}

For each error, provide a practical fix suggestion and corrected code when possible.

Return ONLY valid JSON:
{{
  "resolutions": [
    {{
      "error_index": 0,
      "suggestion": "clear explanation of the fix",
      "fixed_code": "corrected code snippet or null"
    }}
  ]
}}"""

        try:
            response = self.llm.invoke([HumanMessage(content=prompt)])
            raw = response.content
            parsed = _safe_json_parse(raw)
            resolutions = [ErrorResolution(**r) for r in parsed.get("resolutions", [])]
        except Exception as e:
            logger.warning(f"Pass 4 LLM failed: {e}")
            resolutions = []
            raw = str(e)

        duration_ms = int((time.time() - t0) * 1000)
        self._save_pass(submission_id, 4, "resolution", error_list, raw,
                        {"resolutions": [r.model_dump() for r in resolutions]}, duration_ms)
        return resolutions
