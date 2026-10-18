import re
from typing import List, Dict, Any, Tuple, Optional
from pydantic import BaseModel, Field

class DetectedArtefact(BaseModel):
    artefact_type: str = Field(..., description="ui_button, editor_tab, line_gutter, or duplicate_heading")
    raw_text: str
    cleaned_action: str
    confidence: float
    line_number: Optional[int] = None
    restorable: bool = True

class CleanedContentResult(BaseModel):
    cleaned_content: str
    detected_artefacts: List[DetectedArtefact] = Field(default_factory=list)
    inferred_title: Optional[str] = None
    suggested_subject: Optional[str] = None

class DocumentIntelligence:
    # Common UI artifacts from web learning platforms (freeCodeCamp, Codecademy, MDN, etc.)
    UI_BUTTON_PATTERNS = [
        re.compile(r"^\s*(?:open sandbox|run tests|run code|reset (?:this )?(?:lesson|code|sandbox)|console|next (?:challenge|lesson)|submit and go to next challenge|ask for help|get a hint|watch a video|download solution|copy code|copied!)\s*$", re.IGNORECASE),
        re.compile(r"^\s*(?:test output|terminal output|sandbox environment|hint:\s*click run)\s*$", re.IGNORECASE),
    ]

    # File tab labels immediately preceding code
    EDITOR_TAB_PATTERN = re.compile(r"^\s*([a-zA-Z0-9_\-\./]+\.(?:html|css|js|jsx|ts|tsx|py|sql|sh|bash|json|java|cpp|c|h|md))\s*$", re.IGNORECASE)

    # Isolated code gutter line number sequences (e.g., "1\n2\n3\n4\n" or "1 2 3 4 5")
    GUTTER_LINE_PATTERN = re.compile(r"^\s*\d+\s*$")

    # Script leakage and third-party tracking widgets
    OAUTH_TRACKING_PATTERNS = [
        re.compile(r"^\s*<script[^>]*accounts\.google\.com\/gsi\/client[^>]*>.*?<\/script>\s*$", re.IGNORECASE),
        re.compile(r"^\s*<div[^>]*(?:g_id_onload|g_id_signin)[^>]*>.*?<\/div>\s*$", re.IGNORECASE),
        re.compile(r"^\s*<script[^>]*googletagmanager\.com[^>]*>.*?<\/script>\s*$", re.IGNORECASE),
    ]

    @classmethod
    def clean_raw_content(cls, raw_content: str) -> CleanedContentResult:
        """
        Conservative pre-processing pipeline:
        1. Strips interactive UI buttons and editor noise.
        2. Attaches isolated editor tab labels to the following code block.
        3. Filters out code gutter line number columns without harming numbered lists.
        4. Logs all removals into detected_artefacts for user transparency & restoration.
        """
        lines = raw_content.splitlines()
        cleaned_lines: List[str] = []
        artefacts: List[DetectedArtefact] = []

        i = 0
        while i < len(lines):
            line = lines[i]
            trimmed = line.strip()

            # 1. Check for UI button artifacts
            is_ui_button = False
            for pat in cls.UI_BUTTON_PATTERNS:
                if pat.match(trimmed):
                    artefacts.append(DetectedArtefact(
                        artefact_type="ui_button",
                        raw_text=line,
                        cleaned_action="Removed web sandbox / test runner button label",
                        confidence=0.95,
                        line_number=i + 1
                    ))
                    is_ui_button = True
                    break
            if is_ui_button:
                i += 1
                continue

            # Check for leaked OAuth or analytics tracking widgets
            is_tracking = False
            for pat in cls.OAUTH_TRACKING_PATTERNS:
                if pat.match(trimmed):
                    artefacts.append(DetectedArtefact(
                        artefact_type="tracking_script",
                        raw_text=line,
                        cleaned_action="Removed leaked Google OAuth / analytics tracking widget",
                        confidence=0.98,
                        line_number=i + 1
                    ))
                    is_tracking = True
                    break
            if is_tracking:
                i += 1
                continue

            # 2. Check for isolated code gutter numbers (e.g. 5+ sequential standalone numbers)
            if cls.GUTTER_LINE_PATTERN.match(trimmed):
                # Look ahead to see if this is a consecutive numeric sequence column
                seq_count = 1
                j = i + 1
                while j < len(lines) and cls.GUTTER_LINE_PATTERN.match(lines[j].strip()):
                    seq_count += 1
                    j += 1
                if seq_count >= 3:
                    # Identified as gutter line numbers
                    for k in range(i, j):
                        artefacts.append(DetectedArtefact(
                            artefact_type="line_gutter",
                            raw_text=lines[k],
                            cleaned_action="Removed copied code editor line number",
                            confidence=0.90,
                            line_number=k + 1
                        ))
                    i = j
                    continue

            # 3. Check for Editor tab label (e.g., "index.html" directly preceding code)
            tab_match = cls.EDITOR_TAB_PATTERN.match(trimmed)
            if tab_match:
                # Check if next non-empty line starts a code block
                next_non_empty = ""
                next_idx = i + 1
                while next_idx < len(lines) and not lines[next_idx].strip():
                    next_idx += 1
                if next_idx < len(lines) and lines[next_idx].strip().startswith("```"):
                    filename = tab_match.group(1)
                    artefacts.append(DetectedArtefact(
                        artefact_type="editor_tab",
                        raw_text=line,
                        cleaned_action=f"Converted editor tab label '{filename}' into code block metadata",
                        confidence=0.95,
                        line_number=i + 1
                    ))
                    # Retain as formatted comment inside the code or clean metadata
                    cleaned_lines.append(f"<!-- Tab: {filename} -->")
                    i += 1
                    continue

            cleaned_lines.append(line)
            i += 1

        cleaned_text = "\n".join(cleaned_lines)
        inferred_title, suggested_subject = cls.infer_title_and_subject(cleaned_text)

        return CleanedContentResult(
            cleaned_content=cleaned_text,
            detected_artefacts=artefacts,
            inferred_title=inferred_title,
            suggested_subject=suggested_subject
        )

    @classmethod
    def infer_title_and_subject(cls, content: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Infers a meaningful document title and subject without generating generic "Topic 1" labels.
        """
        lines = [l.strip() for l in content.splitlines() if l.strip()]
        if not lines:
            return None, None

        # 1. Look for explicit H1 Markdown title
        for line in lines[:5]:
            if line.startswith("# "):
                title = line[2:].strip()
                return cls._clean_title(title), cls._infer_subject(title, content)

        # 2. Check for common lesson header conventions: "Lesson X: ...", "Step Y: ...", "Chapter Z: ..."
        for line in lines[:5]:
            m = re.match(r"^(?:Lesson|Step|Chapter|Module|Part)\s+\d+[:\-–\s]+(.+)$", line, re.IGNORECASE)
            if m:
                title = m.group(1).strip()
                return cls._clean_title(title), cls._infer_subject(title, content)

        # 3. Look for strong technical title in first 3 lines
        for line in lines[:3]:
            # If line is short, doesn't end with a period, and mentions technical keywords
            if len(line) < 75 and not line.endswith(".") and not line.startswith("```"):
                return cls._clean_title(line), cls._infer_subject(line, content)

        # 4. Fallback: extract the primary concept from content
        return "Technical Study Notes", cls._infer_subject("Study Notes", content)

    @classmethod
    def infer_section_title(cls, chunk: str, index: int) -> str:
        """
        Extracts meaningful section title from content chunk, avoiding generic 'Topic N'.
        """
        lines = [l.strip() for l in chunk.splitlines() if l.strip()]
        if not lines:
            return f"Section {index + 1}"

        first = lines[0]
        # Markdown heading
        if first.startswith("#"):
            return re.sub(r"^#+\s*", "", first).strip()

        # Check for HTML tag descriptions, e.g. "The <div> element" or "<div> and <section> Elements"
        html_tag_match = re.search(r"<([a-zA-Z0-9_\-]+)>", first)
        if html_tag_match and len(first) < 80:
            return first.strip()

        # Check for function/method definitions: "def function_name" or "function myFunction"
        code_def_match = re.search(r"\b(?:def|function|class|interface|struct)\s+([a-zA-Z0-9_]+)", chunk)
        if code_def_match:
            entity = code_def_match.group(1)
            return f"Understanding `{entity}`"

        # Check for colon lead-in: "CSS Grid vs Flexbox: When to use which"
        if ":" in first and len(first.split(":")[0]) < 50:
            return first.split(":")[0].strip()

        # If first line is a concise sentence / phrase
        if len(first) < 65 and not first.endswith("."):
            return first

        # Extract first 4-7 key words
        words = first.split()
        if len(words) >= 3:
            candidate = " ".join(words[:5])
            return re.sub(r"[,\.:;]$", "", candidate)

        return f"Core Concept {index + 1}"

    @classmethod
    def _clean_title(cls, raw: str) -> str:
        # Strip common prefixes like "freeCodeCamp - ", "Documentation - "
        cleaned = re.sub(r"^(?:freeCodeCamp\s*[-–|:]\s*|MDN\s*[-–|:]\s*)", "", raw, flags=re.IGNORECASE).strip()
        return cleaned or "Educational Study Notes"

    @classmethod
    def _infer_subject(cls, title: str, content: str) -> str:
        combined = f"{title} {content[:500]}".lower()
        if any(k in combined for k in ["html", "css", "dom", "webpage", "div", "flexbox", "grid"]):
            return "Web Development"
        if any(k in combined for k in ["python", "django", "flask", "def ", "pandas"]):
            return "Python Programming"
        if any(k in combined for k in ["javascript", "typescript", "react", "node", "async/await"]):
            return "JavaScript / TypeScript"
        if any(k in combined for k in ["sql", "database", "postgres", "table", "select *"]):
            return "Database & SQL"
        if any(k in combined for k in ["docker", "container", "kubernetes", "linux", "bash"]):
            return "DevOps & Cloud"
        if any(k in combined for k in ["c++", "pointers", "memory", "malloc"]):
            return "Systems Programming"
        return "Computer Science"
