"""GitHub REST API fetcher — fetches repository structure and code files using httpx.

Uses the GitHub REST API (unauthenticated or with token) to:
1. Fetch the full repo tree via the Git Trees API
2. Download file contents for analysis
3. Build a structured code context for the LLM pipeline
"""
import os
import re
import httpx
import logging
from typing import Optional
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
GITHUB_API = "https://api.github.com"

# File extensions we care about for code analysis
CODE_EXTENSIONS = {
    '.py', '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.scss',
    '.sql', '.java', '.go', '.rs', '.rb', '.php', '.c', '.cpp', '.h',
    '.svelte', '.vue', '.sh', '.bat', '.yaml', '.yml', '.toml',
}

# Config/metadata files we always want
CONFIG_FILES = {
    'package.json', 'requirements.txt', 'Pipfile', 'pyproject.toml',
    'Cargo.toml', 'go.mod', 'Gemfile', 'pom.xml', 'build.gradle',
    'tsconfig.json', 'vite.config.ts', 'vite.config.js',
    'next.config.js', 'next.config.ts', 'webpack.config.js',
    '.eslintrc.json', '.eslintrc.js',
}

# Directories to skip
SKIP_DIRS = {
    'node_modules', '.git', 'venv', '__pycache__', '.next', 'dist',
    'build', '.cache', 'coverage', '.vscode', '.idea',
}

# Max file size to fetch (characters)
MAX_FILE_SIZE = 3000
MAX_FILES = 25
MAX_TOTAL_CONTEXT = 40000  # Total character budget


@dataclass
class FileEntry:
    """A single file in the repo tree."""
    path: str
    size: int = 0
    is_dir: bool = False


@dataclass
class FileContent:
    """Downloaded file content."""
    path: str
    content: str
    size: int = 0
    truncated: bool = False


@dataclass
class RepoStructure:
    """Analyzed repo structure."""
    owner: str
    repo: str
    files: list[FileEntry] = field(default_factory=list)
    readme_content: str = ""
    has_readme: bool = False
    has_tests: bool = False
    has_package_json: bool = False
    languages: set = field(default_factory=set)
    total_files: int = 0


@dataclass
class CodeContext:
    """Complete code context ready for LLM analysis."""
    repo_url: str
    owner: str
    repo: str
    structure: RepoStructure
    file_contents: list[FileContent] = field(default_factory=list)
    context_text: str = ""
    files_analyzed: int = 0


def _headers() -> dict:
    """Build GitHub API headers."""
    h = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Kramic-Analyzer/1.0",
    }
    if GITHUB_TOKEN:
        h["Authorization"] = f"token {GITHUB_TOKEN}"
    return h


def extract_repo_info(url: str) -> tuple[str, str]:
    """Extract owner/repo from a GitHub URL."""
    match = re.search(r'github\.com/([^/]+)/([^/\s?#]+)', url)
    if not match:
        raise ValueError(f"Invalid GitHub URL: {url}")
    owner = match.group(1)
    repo = match.group(2).replace(".git", "").rstrip("/")
    return owner, repo


async def fetch_repo_tree(owner: str, repo: str) -> RepoStructure:
    """Fetch full repo file tree using the Git Trees API (recursive)."""
    structure = RepoStructure(owner=owner, repo=repo)

    async with httpx.AsyncClient(timeout=15.0) as client:
        # Get default branch
        repo_resp = await client.get(
            f"{GITHUB_API}/repos/{owner}/{repo}",
            headers=_headers()
        )
        if repo_resp.status_code != 200:
            raise ValueError(f"Repository not found or not accessible: {owner}/{repo} (status {repo_resp.status_code})")

        default_branch = repo_resp.json().get("default_branch", "main")

        # Fetch recursive tree
        tree_resp = await client.get(
            f"{GITHUB_API}/repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1",
            headers=_headers()
        )
        if tree_resp.status_code != 200:
            raise ValueError(f"Failed to fetch repo tree (status {tree_resp.status_code})")

        tree = tree_resp.json().get("tree", [])

        for item in tree:
            path = item.get("path", "")
            item_type = item.get("type", "")
            size = item.get("size", 0)

            # Skip unwanted directories
            parts = path.split("/")
            if any(p in SKIP_DIRS for p in parts):
                continue

            if item_type == "blob":
                entry = FileEntry(path=path, size=size, is_dir=False)
                structure.files.append(entry)
                structure.total_files += 1

                # Track metadata
                filename = parts[-1].lower()
                ext = "." + filename.rsplit(".", 1)[-1] if "." in filename else ""

                if filename in ('readme.md', 'readme.txt', 'readme', 'readme.rst'):
                    structure.has_readme = True
                if filename == 'package.json':
                    structure.has_package_json = True
                if 'test' in path.lower() or 'spec' in path.lower() or '__test__' in path.lower():
                    structure.has_tests = True

                # Detect languages
                lang_map = {
                    '.py': 'Python', '.js': 'JavaScript', '.jsx': 'JavaScript',
                    '.ts': 'TypeScript', '.tsx': 'TypeScript', '.html': 'HTML',
                    '.css': 'CSS', '.scss': 'SCSS', '.sql': 'SQL',
                    '.java': 'Java', '.go': 'Go', '.rs': 'Rust',
                    '.rb': 'Ruby', '.php': 'PHP', '.c': 'C', '.cpp': 'C++',
                    '.svelte': 'Svelte', '.vue': 'Vue',
                }
                if ext in lang_map:
                    structure.languages.add(lang_map[ext])

    return structure


async def fetch_file_contents(owner: str, repo: str, paths: list[str]) -> list[FileContent]:
    """Fetch the raw content of multiple files."""
    contents = []

    async with httpx.AsyncClient(timeout=15.0) as client:
        for path in paths[:MAX_FILES]:
            try:
                resp = await client.get(
                    f"{GITHUB_API}/repos/{owner}/{repo}/contents/{path}",
                    headers={**_headers(), "Accept": "application/vnd.github.v3.raw"},
                )
                if resp.status_code == 200:
                    text = resp.text
                    truncated = len(text) > MAX_FILE_SIZE
                    contents.append(FileContent(
                        path=path,
                        content=text[:MAX_FILE_SIZE],
                        size=len(text),
                        truncated=truncated,
                    ))
            except Exception as e:
                logger.warning(f"Failed to fetch {path}: {e}")

    return contents


def _prioritize_files(structure: RepoStructure) -> list[str]:
    """Prioritize which files to fetch for analysis."""
    config_files = []
    code_files = []
    readme_file = None

    for f in structure.files:
        filename = f.path.split("/")[-1].lower()
        ext = "." + filename.rsplit(".", 1)[-1] if "." in filename else ""

        if filename in ('readme.md', 'readme.txt', 'readme'):
            readme_file = f.path
        elif filename in CONFIG_FILES or filename.lower() in {c.lower() for c in CONFIG_FILES}:
            config_files.append(f.path)
        elif ext in CODE_EXTENSIONS and f.size < 50000:
            code_files.append(f.path)

    # Sort code files: prefer shorter paths (top-level), then by extension importance
    priority_ext = ['.tsx', '.ts', '.jsx', '.js', '.py', '.html', '.css']
    def sort_key(path):
        ext = "." + path.rsplit(".", 1)[-1] if "." in path else ""
        depth = path.count("/")
        ext_priority = priority_ext.index(ext) if ext in priority_ext else len(priority_ext)
        return (depth, ext_priority)

    code_files.sort(key=sort_key)

    result = []
    if readme_file:
        result.append(readme_file)
    result.extend(config_files[:3])
    result.extend(code_files[:MAX_FILES - len(result)])

    return result


async def build_code_context(github_url: str) -> CodeContext:
    """Full pipeline: URL → tree → prioritized files → code context string."""
    owner, repo = extract_repo_info(github_url)

    # Step 1: Fetch tree
    structure = await fetch_repo_tree(owner, repo)

    # Step 2: Pick files to download
    priority_paths = _prioritize_files(structure)

    # Step 3: Download file contents
    file_contents = await fetch_file_contents(owner, repo, priority_paths)

    # Step 4: Build context string
    context_parts = []
    total_chars = 0

    # File tree overview
    tree_str = "### Repository File Tree\n"
    for f in structure.files[:100]:
        tree_str += f"  {'📁' if f.is_dir else '📄'} {f.path} ({f.size}B)\n"
    context_parts.append(tree_str)
    total_chars += len(tree_str)

    # File contents
    for fc in file_contents:
        if total_chars >= MAX_TOTAL_CONTEXT:
            break
        chunk = f"\n--- {fc.path} ---\n{fc.content}\n"
        if fc.truncated:
            chunk += f"[... truncated, full file is {fc.size} chars]\n"
        context_parts.append(chunk)
        total_chars += len(chunk)

    ctx = CodeContext(
        repo_url=github_url,
        owner=owner,
        repo=repo,
        structure=structure,
        file_contents=file_contents,
        context_text="\n".join(context_parts),
        files_analyzed=len(file_contents),
    )

    return ctx
