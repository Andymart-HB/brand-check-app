import { Router, Request, Response } from 'express';
import { SearchService } from '../services/searchService';
import { ValidationError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/search?q=query&limit=10 - Search documents
router.get('/', async (req: Request, res: Response) => {
  try {
    const { q: query, limit } = req.query;
    
    if (!query || typeof query !== 'string') {
      throw new ValidationError('Query parameter "q" is required');
    }
    
    if (query.trim().length === 0) {
      throw new ValidationError('Query cannot be empty');
    }
    
    if (query.length > 500) {
      throw new ValidationError('Query too long (max 500 characters)');
    }
    
    const maxResults = limit ? parseInt(limit as string, 10) : undefined;
    
    if (maxResults !== undefined && (isNaN(maxResults) || maxResults < 1 || maxResults > 100)) {
      throw new ValidationError('Limit must be a number between 1 and 100');
    }
    
    const searchService: SearchService = req.app.locals.searchService;
    const results = await searchService.search(query.trim(), maxResults);
    
    logger.info('Search performed', {
      query: query.trim(),
      resultCount: results.totalResults,
      searchTime: results.searchTime,
    });
    
    res.json(results);
  } catch (error) {
    throw error;
  }
});

// GET /api/search/config - Get search configuration
router.get('/config', async (req: Request, res: Response) => {
  try {
    const searchService: SearchService = req.app.locals.searchService;
    const config = searchService.getConfig();
    
    res.json({ config });
  } catch (error) {
    throw error;
  }
});

// POST /api/search/suggestions - Get search suggestions
router.post('/suggestions', async (req: Request, res: Response) => {
  try {
    const { query, limit = 5 } = req.body;
    
    if (!query || typeof query !== 'string') {
      throw new ValidationError('Query is required');
    }
    
    const documentService = req.app.locals.documentService;
    const sections = documentService.getSections();
    
    // Simple suggestion algorithm based on section titles
    const suggestions = sections
      .filter(section => 
        section.title.toLowerCase().includes(query.toLowerCase()) ||
        section.content.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit)
      .map(section => ({
        text: section.title,
        slug: section.slug,
        type: 'section',
      }));
    
    // Add keyword suggestions
    const words = query.toLowerCase().split(/\s+/);
    const lastWord = words[words.length - 1];
    
    if (lastWord.length >= 2) {
      const keywordSuggestions = extractKeywords(sections)
        .filter(keyword => keyword.toLowerCase().startsWith(lastWord))
        .slice(0, 3)
        .map(keyword => ({
          text: words.slice(0, -1).concat([keyword]).join(' '),
          type: 'keyword',
        }));
      
      suggestions.push(...keywordSuggestions);
    }
    
    res.json({
      query,
      suggestions: suggestions.slice(0, limit),
    });
  } catch (error) {
    throw error;
  }
});

function extractKeywords(sections: any[]): string[] {
  const keywords = new Set<string>();
  
  for (const section of sections) {
    const text = `${section.title} ${section.content}`.toLowerCase();
    const words = text.match(/\b[a-z]{3,}\b/g) || [];
    
    for (const word of words) {
      if (!isStopWord(word)) {
        keywords.add(word);
      }
    }
  }
  
  return Array.from(keywords).sort();
}

function isStopWord(word: string): boolean {
  const stopWords = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have',
    'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you',
    'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they',
    'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my',
    'one', 'all', 'would', 'there', 'their', 'what', 'so',
    'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
    'can', 'could', 'should', 'would', 'may', 'might', 'must',
    'shall', 'will', 'does', 'did', 'has', 'had', 'was', 'were'
  ]);
  return stopWords.has(word);
}

export default router;