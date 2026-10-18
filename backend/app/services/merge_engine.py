import re
from typing import List, Tuple, Dict, Any, Optional
from app.models.section import DocumentSection
from app.schemas.ai import ProposedSection, MergePreviewResponse
from app.schemas.section import SectionOut

def tokenize_text(text: str) -> set:
    words = re.findall(r"\w+", (text or "").lower())
    # Exclude common stopwords for better semantic focus
    stopwords = {"the", "a", "an", "is", "and", "or", "to", "in", "of", "for", "with", "on", "at", "by", "from", "this", "that"}
    return {w for w in words if w not in stopwords and len(w) > 2}

def compute_jaccard_similarity(text1: str, text2: str) -> float:
    tokens1 = tokenize_text(text1)
    tokens2 = tokenize_text(text2)
    if not tokens1 or not tokens2:
        return 0.0
    intersection = tokens1.intersection(tokens2)
    union = tokens1.union(tokens2)
    return len(intersection) / len(union)

def compute_title_similarity(t1: str, t2: str) -> float:
    slug1 = re.sub(r"[^a-zA-Z0-9]+", "", t1.lower())
    slug2 = re.sub(r"[^a-zA-Z0-9]+", "", t2.lower())
    if slug1 == slug2:
        return 1.0
    return compute_jaccard_similarity(t1, t2)

def analyze_merge_candidates(
    existing_sections: List[DocumentSection],
    proposed_sections: List[ProposedSection]
) -> Tuple[List[ProposedSection], int]:
    """
    Analyzes proposed sections against existing document sections.
    Identifies potential duplicates, determines optimal section placement,
    and assigns duplicate warnings without destructive overwrites.
    """
    potential_duplicates_count = 0
    max_existing_order = max([s.order_index for s in existing_sections], default=-1)

    for p_idx, proposed in enumerate(proposed_sections):
        best_match_key = None
        best_score = 0.0
        best_match_title = ""
        best_match_order = -1

        for existing in existing_sections:
            title_sim = compute_title_similarity(proposed.title, existing.title)
            body_sim = compute_jaccard_similarity(proposed.content_markdown, existing.content_markdown)
            # Weighted similarity score
            overall_sim = (title_sim * 0.5) + (body_sim * 0.5)

            if overall_sim > best_score:
                best_score = overall_sim
                best_match_key = existing.stable_key
                best_match_title = existing.title
                best_match_order = existing.order_index

        proposed.similarity_score = round(best_score, 2)

        if best_score >= 0.70:
            proposed.duplicate_status = "duplicate"
            proposed.duplicate_of_key = best_match_key
            proposed.explanation = f"Likely duplicate of existing section '{best_match_title}' ({int(best_score * 100)}% match). Review proposed changes before accepting."
            proposed.placement_suggestion = f"Update or replace existing section '{best_match_title}'"
            potential_duplicates_count += 1
        elif best_score >= 0.35:
            proposed.duplicate_status = "partial_update"
            proposed.duplicate_of_key = best_match_key
            proposed.explanation = f"Shares topical overlap with '{best_match_title}' ({int(best_score * 100)}% match). Can enrich existing section or be added as a related subtopic."
            proposed.placement_suggestion = f"Place immediately after '{best_match_title}' (position {best_match_order + 1})"
        else:
            proposed.duplicate_status = "new"
            proposed.explanation = "Novel content with no direct counterpart in the existing document."
            proposed.placement_suggestion = f"Append to end of document (position {max_existing_order + 1 + p_idx})"

    return proposed_sections, potential_duplicates_count

def generate_merge_preview(
    document_id: str,
    existing_sections: List[DocumentSection],
    incoming_sections: List[ProposedSection],
    incoming_title: str,
    detected_artefacts: Optional[List[Dict[str, Any]]] = None
) -> MergePreviewResponse:
    analyzed_sections, dup_count = analyze_merge_candidates(existing_sections, incoming_sections)

    serialized_existing = [SectionOut.model_validate(s) for s in existing_sections]
    summary = f"Proposed {len(incoming_sections)} new section(s) with {dup_count} duplicate warning(s). All existing {len(existing_sections)} sections preserved."

    return MergePreviewResponse(
        document_id=document_id,
        existing_sections=serialized_existing,
        proposed_sections=analyzed_sections,
        potential_duplicates_count=dup_count,
        detected_artefacts=detected_artefacts or [],
        summary_of_changes=summary,
        suggested_version_title=f"Merged: {incoming_title}"
    )
