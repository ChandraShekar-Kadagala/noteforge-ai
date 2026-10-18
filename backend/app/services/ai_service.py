import re
import json
import httpx
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status

from app.config import settings
from app.schemas.ai import OrganizeResponse, ProposedSection
from app.schemas.section import StructuredBlock
from app.utils.logger import logger

class BaseAIService(ABC):
    @abstractmethod
    async def organize_content(
        self,
        raw_content: str,
        subject: Optional[str] = "General",
        preserve_source: bool = False
    ) -> OrganizeResponse:
        pass


class GeminiAIService(BaseAIService):
    def __init__(self, api_key: str, model: str = "gemini-1.5-flash"):
        self.api_key = api_key
        self.model = model
        self.api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"

    async def organize_content(
        self,
        raw_content: str,
        subject: Optional[str] = "General",
        preserve_source: bool = False
    ) -> OrganizeResponse:
        prompt = f"""
You are an expert educational note architect for NoteForge AI.
Analyze the following raw educational content and transform it into highly structured, comprehensive, and beautiful study notes.

Subject: {subject}
Source Preservation Mode: {"STRICT: preserve exact phrasing and original code verbatim" if preserve_source else "STANDARD: enhance readability while maintaining technical accuracy"}

Return a strictly valid JSON object matching this schema:
{{
  "title": "Document Title",
  "subject": "{subject}",
  "summary": "2-3 sentence overview of this material",
  "learning_objectives": ["Objective 1", "Objective 2"],
  "suggested_follow_ups": ["Next topic 1", "Next topic 2"],
  "sections": [
    {{
      "stable_key": "unique_slug_e_g_variables_declaration",
      "title": "Section Title",
      "section_type": "concept | procedure | code_example | callout | comparison_table | revision_qa | summary",
      "order_index": 0,
      "content_markdown": "Full Markdown explanation of the section",
      "structured_blocks": [
        {{
          "type": "callout | code | table | procedure | markdown",
          "data": {{
            "callout_type": "info | tip | important | warning",
            "title": "Callout Title",
            "body": "Callout message",
            "language": "python | javascript | html | css | bash | sql | etc",
            "code": "code snippet",
            "expected_output": "optional expected output",
            "headers": ["Col 1", "Col 2"],
            "rows": [["Cell 1", "Cell 2"]]
          }}
        }}
      ],
      "raw_source": "Original source fragment relating to this section",
      "ai_enriched": true,
      "placement_suggestion": "Suggested location or order description"
    }}
  ]
}}

Raw Content to Process:
\"\"\"{raw_content}\"\"\"
"""
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "response_mime_type": "application/json"
            }
        }

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                response = await client.post(self.api_url, json=payload)
                
                if response.status_code == 429:
                    logger.error("Gemini API rate limit or quota exceeded.")
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="AI provider quota or rate limit exceeded. Please wait a moment or switch to fallback mode."
                    )
                if response.status_code == 400:
                    logger.error(f"Gemini API Bad Request: {response.text}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Invalid request sent to AI provider. Please check input content."
                    )
                if response.status_code != 200:
                    logger.error(f"Gemini API returned error: {response.status_code} - {response.text}")
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail=f"AI provider communication error ({response.status_code})."
                    )

                data = response.json()
                text_content = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed_json = json.loads(text_content)

                sections = [ProposedSection(**sec) for sec in parsed_json.get("sections", [])]
                return OrganizeResponse(
                    title=parsed_json.get("title", "Organized Notes"),
                    subject=parsed_json.get("subject", subject or "General"),
                    summary=parsed_json.get("summary", ""),
                    sections=sections,
                    learning_objectives=parsed_json.get("learning_objectives", []),
                    suggested_follow_ups=parsed_json.get("suggested_follow_ups", []),
                    provider_used="gemini"
                )

        except httpx.TimeoutException:
            logger.error("Gemini API request timed out.")
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="AI provider request timed out. Please try again with smaller content chunks."
            )
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from AI response: {e}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI returned malformed structured data. Please retry."
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Unexpected error calling Gemini API: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"An error occurred while contacting the AI service: {str(e)}"
            )


class MockAIService(BaseAIService):
    """
    High-fidelity offline AI parsing engine.
    Parses raw educational material into structured sections, code blocks,
    callouts, tables, and takeaways without external dependencies.
    """
    async def organize_content(
        self,
        raw_content: str,
        subject: Optional[str] = "General",
        preserve_source: bool = False
    ) -> OrganizeResponse:
        lines = [line.strip() for line in raw_content.splitlines()]
        non_empty = [l for l in lines if l]
        
        # Determine title
        title = "Organized Study Notes"
        if non_empty:
            first_line = non_empty[0]
            if first_line.startswith("# "):
                title = first_line.replace("# ", "").strip()
            elif len(first_line) < 80 and not first_line.endswith("."):
                title = first_line

        # Extract code blocks
        code_regex = re.compile(r"```([a-zA-Z0-9_\-\+]*)\n([\s\S]*?)```")
        code_matches = code_regex.findall(raw_content)

        # Break content into logical chunks
        chunks = re.split(r"\n(?=#{1,3}\s|\b(?:Lesson|Chapter|Section|Step|Part)\s+\d+)", raw_content)
        if len(chunks) <= 1:
            # Split by double newline if no markdown headings
            paragraphs = [p.strip() for p in raw_content.split("\n\n") if p.strip()]
            chunks = paragraphs if len(paragraphs) > 1 else [raw_content]

        sections: List[ProposedSection] = []
        for idx, chunk in enumerate(chunks):
            chunk_clean = chunk.strip()
            if not chunk_clean:
                continue

            sec_title = f"Topic {idx + 1}"
            first_chunk_line = chunk_clean.splitlines()[0].strip()
            if first_chunk_line.startswith("#"):
                sec_title = re.sub(r"^#+\s*", "", first_chunk_line)
            elif len(first_chunk_line) < 70 and not first_chunk_line.endswith("."):
                sec_title = first_chunk_line

            slug = re.sub(r"[^a-zA-Z0-9_]+", "_", sec_title.lower()).strip("_")
            stable_key = f"{slug}_{idx+1}"

            # Detect code inside this chunk
            blocks: List[StructuredBlock] = []
            chunk_codes = code_regex.findall(chunk_clean)
            for c_lang, c_code in chunk_codes:
                blocks.append(StructuredBlock(
                    type="code",
                    data={
                        "language": c_lang.lower() or "javascript",
                        "code": c_code.strip(),
                        "expected_output": "Execution completed successfully." if "print" in c_code or "console.log" in c_code else None
                    }
                ))

            # Add callout block if important or warning keywords appear
            if any(k in chunk_clean.lower() for k in ["warning", "caution", "mistake", "pitfall", "beware"]):
                blocks.append(StructuredBlock(
                    type="callout",
                    data={
                        "callout_type": "warning",
                        "title": "Common Pitfall",
                        "body": "Avoid common syntax and conceptual errors when implementing this pattern."
                    }
                ))
            elif any(k in chunk_clean.lower() for k in ["note", "important", "remember", "tip"]):
                blocks.append(StructuredBlock(
                    type="callout",
                    data={
                        "callout_type": "important",
                        "title": "Key Concept",
                        "body": "Keep this foundational concept in mind when building complex workflows."
                    }
                ))

            sec_type = "code_example" if chunk_codes else ("procedure" if "1." in chunk_clean else "concept")

            sections.append(ProposedSection(
                stable_key=stable_key,
                title=sec_title,
                section_type=sec_type,
                order_index=idx,
                content_markdown=chunk_clean,
                structured_blocks=blocks,
                raw_source=chunk_clean if preserve_source else None,
                ai_enriched=True,
                placement_suggestion=f"Section {idx+1} in document progression"
            ))

        # Add a summary & key takeaways section if not present
        sections.append(ProposedSection(
            stable_key="key_takeaways_summary",
            title="Key Takeaways & Revision",
            section_type="summary",
            order_index=len(sections),
            content_markdown="### Key Takeaways\n- Review the core concepts thoroughly.\n- Practice coding examples in an isolated test sandbox.\n- Test edge cases and inspect outputs carefully.",
            structured_blocks=[
                StructuredBlock(
                    type="callout",
                    data={
                        "callout_type": "tip",
                        "title": "Practice Challenge",
                        "body": "Implement a mini-project applying all principles covered in these notes."
                    }
                )
            ],
            raw_source=None,
            ai_enriched=True,
            placement_suggestion="Conclusion of the document"
        ))

        return OrganizeResponse(
            title=title,
            subject=subject or "General",
            summary=f"Curated reference notes covering {title} with code samples and key takeaways.",
            sections=sections,
            learning_objectives=[f"Understand the mechanics of {title}", "Apply standard coding patterns in practice"],
            suggested_follow_ups=["Advanced design patterns", "Edge-case error handling and testing"],
            provider_used="mock"
        )


def get_ai_service() -> BaseAIService:
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
        logger.info(f"Using Gemini AI Service (model: {settings.GEMINI_MODEL})")
        return GeminiAIService(api_key=settings.GEMINI_API_KEY, model=settings.GEMINI_MODEL)
    
    if settings.AI_MOCK_FALLBACK:
        logger.info("Using Offline High-Fidelity Mock AI Service (Fallback mode)")
        return MockAIService()

    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="AI service is not configured. Please set GEMINI_API_KEY in your .env file or enable AI_MOCK_FALLBACK=True."
    )
