import { DocumentSection, SearchResult, SearchResponse, SearchConfig } from '../types';
import { logger } from '../utils/logger';
import { EmbeddingService } from './embeddingService';

export class SearchService {
  private embeddingService: EmbeddingService;
  private sections: DocumentSection[] = [];
  private config: SearchConfig = {
    maxResults: 10,
    minScore: 0.1,
    enableSemanticSearch: true,
    enableKeywordSearch: true,
  };

  constructor() {
    this.embeddingService = new EmbeddingService();
  }

  async initialize(sections: DocumentSection[]): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Generate embeddings for all sections
      await this.embeddingService.initialize();
      
      // Process sections and generate embeddings
      this.sections = await Promise.all(
        sections.map(async (section) => {
          const embedding = await this.embeddingService.generateEmbedding(
            `${section.title} ${section.content}`
          );
          return { ...section, embedding };
        })
      );
      
      const initTime = Date.now() - startTime;
      logger.info(`Search service initialized in ${initTime}ms: ${this.sections.length} sections indexed`);
      
    } catch (error) {
      logger.error('Failed to initialize search service:', error);
      throw error;
    }
  }

  async search(query: string, maxResults?: number): Promise<SearchResponse> {
    const startTime = Date.now();
    const limit = maxResults || this.config.maxResults;
    
    try {
      let results: SearchResult[] = [];
      
      // Combine semantic and keyword search
      if (this.config.enableSemanticSearch) {
        const semanticResults = await this.semanticSearch(query, limit);
        results = semanticResults;
      }
      
      if (this.config.enableKeywordSearch) {
        const keywordResults = this.keywordSearch(query, limit);
        results = this.mergeResults(results, keywordResults, limit);
      }
      
      // Sort by score and limit results
      results.sort((a, b) => b.score - a.score);
      results = results.slice(0, limit);
      
      const searchTime = Date.now() - startTime;
      
      return {
        query,
        results,
        totalResults: results.length,
        searchTime,
      };
      
    } catch (error) {
      logger.error('Search failed:', error);
      throw error;
    }
  }

  private async semanticSearch(query: string, maxResults: number): Promise<SearchResult[]> {
    if (!this.embeddingService.isReady()) {
      logger.warn('Embedding service not ready, skipping semantic search');
      return [];
    }
    
    try {
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);
      const results: SearchResult[] = [];
      
      for (const section of this.sections) {
        if (!section.embedding) continue;
        
        const similarity = this.cosineSimilarity(queryEmbedding, section.embedding);
        
        if (similarity >= this.config.minScore) {
          results.push({
            section,
            score: similarity,
            matches: this.findMatches(query, section.content),
          });
        }
      }
      
      return results.sort((a, b) => b.score - a.score).slice(0, maxResults);
      
    } catch (error) {
      logger.error('Semantic search failed:', error);
      return [];
    }
  }

  private keywordSearch(query: string, maxResults: number): Promise<SearchResult[]> {
    const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
    const results: SearchResult[] = [];
    
    for (const section of this.sections) {
      const content = section.content.toLowerCase();
      const title = section.title.toLowerCase();
      
      let score = 0;
      let matches: string[] = [];
      
      for (const term of queryTerms) {
        // Title matches have higher weight
        const titleMatches = (title.match(new RegExp(term, 'g')) || []).length;
        const contentMatches = (content.match(new RegExp(term, 'g')) || []).length;
        
        score += titleMatches * 3 + contentMatches;
        
        if (titleMatches > 0 || contentMatches > 0) {
          matches.push(term);
        }
      }
      
      if (score > 0) {
        // Normalize score
        const normalizedScore = Math.min(score / (queryTerms.length * 5), 1);
        
        results.push({
          section,
          score: normalizedScore,
          matches: this.findMatches(query, section.content),
        });
      }
    }
    
    return Promise.resolve(results.sort((a, b) => b.score - a.score).slice(0, maxResults));
  }

  private mergeResults(semanticResults: SearchResult[], keywordResults: SearchResult[], maxResults: number): SearchResult[] {
    const merged = new Map<string, SearchResult>();
    
    // Add semantic results
    for (const result of semanticResults) {
      merged.set(result.section.id, result);
    }
    
    // Merge keyword results
    for (const result of keywordResults) {
      const existing = merged.get(result.section.id);
      if (existing) {
        // Combine scores (weighted average)
        existing.score = (existing.score * 0.6) + (result.score * 0.4);
        existing.matches = [...new Set([...existing.matches, ...result.matches])];
      } else {
        merged.set(result.section.id, result);
      }
    }
    
    return Array.from(merged.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vector dimensions must match');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  private findMatches(query: string, content: string): string[] {
    const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
    const matches: string[] = [];
    
    for (const term of queryTerms) {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const contentMatches = content.match(regex);
      if (contentMatches) {
        matches.push(...contentMatches);
      }
    }
    
    return [...new Set(matches)];
  }

  updateSections(sections: DocumentSection[]): void {
    // Re-initialize with new sections
    this.initialize(sections).catch(error => {
      logger.error('Failed to update search index:', error);
    });
  }

  getConfig(): SearchConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<SearchConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('Search configuration updated:', config);
  }
}