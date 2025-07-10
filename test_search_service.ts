import { SearchService } from '../../src/services/searchService';
import { DocumentSection } from '../../src/types';

describe('SearchService', () => {
  let searchService: SearchService;
  let testSections: DocumentSection[];

  beforeEach(async () => {
    searchService = new SearchService();
    
    testSections = [
      {
        id: 'section-1',
        slug: 'introduction',
        title: 'Introduction',
        content: 'This is an introduction to the brand guidelines document. It covers basic concepts.',
        level: 1,
        startLine: 1,
        endLine: 5,
      },
      {
        id: 'section-2',
        slug: 'brand-colors',
        title: 'Brand Colors',
        content: 'Our brand uses specific colors including blue #3b82f6 and red #ef4444 for consistency.',
        level: 2,
        startLine: 6,
        endLine: 10,
      },
      {
        id: 'section-3',
        slug: 'typography',
        title: 'Typography',
        content: 'We use modern fonts like Inter and Roboto for all brand communications and marketing.',
        level: 2,
        startLine: 11,
        endLine: 15,
      },
    ];

    await searchService.initialize(testSections);
  });

  describe('search', () => {
    it('should perform basic keyword search', async () => {
      const results = await searchService.search('brand');
      
      expect(results.results).toHaveLength(2);
      expect(results.query).toBe('brand');
      expect(results.totalResults).toBe(2);
      expect(results.searchTime).toBeGreaterThan(0);
    });

    it('should return results sorted by relevance', async () => {
      const results = await searchService.search('brand colors');
      
      expect(results.results.length).toBeGreaterThan(0);
      expect(results.results[0].section.slug).toBe('brand-colors');
      expect(results.results[0].score).toBeGreaterThan(0);
    });

    it('should handle case-insensitive search', async () => {
      const lowerResults = await searchService.search('brand');
      const upperResults = await searchService.search('BRAND');
      
      expect(lowerResults.results).toHaveLength(upperResults.results.length);
    });

    it('should return empty results for no matches', async () => {
      const results = await searchService.search('nonexistent');
      
      expect(results.results).toHaveLength(0);
      expect(results.totalResults).toBe(0);
    });

    it('should limit results when specified', async () => {
      const results = await searchService.search('the', 1);
      
      expect(results.results.length).toBeLessThanOrEqual(1);
    });

    it('should include match information', async () => {
      const results = await searchService.search('blue');
      
      expect(results.results.length).toBeGreaterThan(0);
      const firstResult = results.results[0];
      expect(firstResult.matches).toContain('blue');
    });
  });

  describe('semantic search capabilities', () => {
    it('should handle multi-word queries', async () => {
      const results = await searchService.search('font typography');
      
      expect(results.results.length).toBeGreaterThan(0);
      expect(results.results[0].section.slug).toBe('typography');
    });

    it('should find related concepts', async () => {
      const results = await searchService.search('fonts');
      
      expect(results.results.length).toBeGreaterThan(0);
      expect(results.results.some(r => r.section.slug === 'typography')).toBe(true);
    });
  });

  describe('updateSections', () => {
    it('should update search index with new sections', async () => {
      const newSections = [
        ...testSections,
        {
          id: 'section-4',
          slug: 'logos',
          title: 'Logos',
          content: 'Logo guidelines and usage examples for consistent branding.',
          level: 2,
          startLine: 16,
          endLine: 20,
        },
      ];

      searchService.updateSections(newSections);
      
      // Give time for async update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const results = await searchService.search('logo');
      expect(results.results.length).toBeGreaterThan(0);
    });
  });

  describe('configuration', () => {
    it('should return current configuration', () => {
      const config = searchService.getConfig();
      
      expect(config).toHaveProperty('maxResults');
      expect(config).toHaveProperty('minScore');
      expect(config).toHaveProperty('enableSemanticSearch');
      expect(config).toHaveProperty('enableKeywordSearch');
    });

    it('should update configuration', () => {
      const newConfig = { maxResults: 5 };
      searchService.updateConfig(newConfig);
      
      const config = searchService.getConfig();
      expect(config.maxResults).toBe(5);
    });
  });

  describe('search performance', () => {
    it('should complete search within reasonable time', async () => {
      const startTime = Date.now();
      await searchService.search('brand');
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // Less than 1 second
    });

    it('should handle empty queries gracefully', async () => {
      const results = await searchService.search('');
      expect(results.results).toHaveLength(0);
    });

    it('should handle very long queries', async () => {
      const longQuery = 'this is a very long query that contains many words and should still work properly';
      const results = await searchService.search(longQuery);
      
      expect(results).toBeDefined();
      expect(results.query).toBe(longQuery);
    });
  });
});