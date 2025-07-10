export interface DocumentSection {
  id: string;
  slug: string;
  title: string;
  content: string;
  level: number;
  startLine: number;
  endLine: number;
  embedding?: number[];
}

export interface DocumentMetadata {
  title: string;
  lastModified: Date;
  size: number;
  wordCount: number;
  sectionCount: number;
}

export interface ParsedDocument {
  metadata: DocumentMetadata;
  sections: DocumentSection[];
  rawContent: string;
  htmlContent: string;
}

export interface SearchResult {
  section: DocumentSection;
  score: number;
  matches: string[];
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  totalResults: number;
  searchTime: number;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

export interface UpdateDocumentRequest {
  content: string;
  message?: string;
}

export interface UpdateDocumentResponse {
  success: boolean;
  message: string;
  metadata: DocumentMetadata;
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  memory: NodeJS.MemoryUsage;
}

export interface EmbeddingConfig {
  model: string;
  dimension: number;
  maxTokens: number;
}

export interface SearchConfig {
  maxResults: number;
  minScore: number;
  enableSemanticSearch: boolean;
  enableKeywordSearch: boolean;
}