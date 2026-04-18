"""Pydantic models for the multi-pass agentic analysis pipeline."""
from pydantic import BaseModel, Field
from typing import List, Optional


class StructureReport(BaseModel):
    """Output of Pass 1: Project structure analysis."""
    languages: List[str] = Field(default_factory=list, description="Programming languages detected")
    framework: Optional[str] = Field(None, description="Main framework (React, Express, Flask, etc.)")
    has_readme: bool = Field(False, description="Whether a README file exists")
    has_tests: bool = Field(False, description="Whether test files exist")
    has_package_json: bool = Field(False, description="Whether package.json exists")
    file_count: int = Field(0, description="Total code files found")
    project_type: str = Field("unknown", description="web_app, api, cli, library, static_site, etc.")
    entry_point: Optional[str] = Field(None, description="Main entry point file if detected")


class CriterionResult(BaseModel):
    """Output for each evaluated criterion in Pass 2."""
    criterion: str = Field(description="The criterion being evaluated")
    passed: bool = Field(description="Whether this criterion was met")
    evidence: str = Field(description="Code quote or explanation supporting the judgment")


class CodeError(BaseModel):
    """A single error/issue found in Pass 3."""
    file: str = Field(description="File path where the issue exists")
    line: Optional[int] = Field(None, description="Line number if applicable")
    severity: str = Field("warning", description="error, warning, or info")
    message: str = Field(description="What the issue is")
    category: str = Field("logic", description="syntax, logic, style, security, performance")


class ErrorResolution(BaseModel):
    """AI-suggested fix for a detected error (Pass 4)."""
    error_index: int = Field(description="Index into the errors list this resolves")
    suggestion: str = Field(description="Human-readable suggestion for the fix")
    fixed_code: Optional[str] = Field(None, description="Corrected code snippet if applicable")


class CriteriaEvaluation(BaseModel):
    """Structured output for Pass 2."""
    results: List[CriterionResult] = Field(description="Evaluation of each criterion")


class ErrorDetection(BaseModel):
    """Structured output for Pass 3."""
    errors: List[CodeError] = Field(description="List of detected issues")


class ErrorResolutions(BaseModel):
    """Structured output for Pass 4."""
    resolutions: List[ErrorResolution] = Field(description="Suggested fixes for errors")


class AnalysisReport(BaseModel):
    """Final compiled report from all pipeline passes."""
    submission_id: Optional[str] = None
    structure: StructureReport = Field(default_factory=StructureReport)
    criteria_results: List[CriterionResult] = Field(default_factory=list)
    errors: List[CodeError] = Field(default_factory=list)
    resolutions: List[ErrorResolution] = Field(default_factory=list)
    summary: str = ""
    score_pct: float = 0.0
    karma_earned: int = 0
    files_analyzed: int = 0
    analysis_duration_ms: int = 0
    model_used: str = ""
