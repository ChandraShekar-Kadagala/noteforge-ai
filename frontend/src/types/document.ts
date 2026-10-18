export interface StructuredBlock {
  id?: string;
  type: 'callout' | 'code' | 'table' | 'procedure' | 'markdown' | 'image';
  data: {
    callout_type?: 'important' | 'warning' | 'tip' | 'info';
    title?: string;
    body?: string;
    language?: string;
    code?: string;
    expected_output?: string | null;
    headers?: string[];
    rows?: string[][];
    steps?: string[];
    markdown?: string;
    url?: string;
    caption?: string;
    width?: string;
    align?: 'left' | 'center' | 'right';
  };
}

export interface DocumentSection {
  id?: string;
  document_id?: string;
  stable_key: string;
  title: string;
  section_type: 'concept' | 'procedure' | 'code_example' | 'callout' | 'comparison_table' | 'revision_qa' | 'summary';
  order_index: number;
  content_markdown: string;
  structured_blocks: StructuredBlock[];
  raw_source?: string | null;
  ai_enriched?: boolean;
}

export interface DocumentSummary {
  id: string;
  user_id: string;
  title: string;
  subject?: string;
  summary?: string;
  tags?: string[];
  current_version: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentDetail extends DocumentSummary {
  sections: DocumentSection[];
  versions_count: number;
}

export interface ProposedSection extends DocumentSection {
  placement_suggestion?: string;
  duplicate_status: 'new' | 'duplicate' | 'partial_update';
  duplicate_of_key?: string | null;
  similarity_score?: number;
  explanation?: string;
}

export interface DetectedArtefact {
  type: string;
  matched_text: string;
  reason: string;
  confidence: number;
}

export interface MergePreviewData {
  document_id: string;
  existing_sections: DocumentSection[];
  proposed_sections: ProposedSection[];
  potential_duplicates_count: number;
  detected_artefacts?: DetectedArtefact[];
  summary_of_changes: string;
  suggested_version_title: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  title: string;
  change_summary?: string;
  created_at: string;
}
