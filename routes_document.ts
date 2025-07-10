import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { DocumentService } from '../services/documentService';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { UpdateDocumentRequest, UpdateDocumentResponse } from '../types';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/doc - Get full document
router.get('/', async (req: Request, res: Response) => {
  try {
    const documentService: DocumentService = req.app.locals.documentService;
    const document = documentService.getDocument();
    
    if (!document) {
      throw new NotFoundError('Document not found');
    }

    const { section } = req.query;
    
    if (section) {
      // Return specific section
      const sectionData = documentService.getSection(section as string);
      if (!sectionData) {
        throw new NotFoundError(`Section '${section}' not found`);
      }
      
      res.json({
        metadata: document.metadata,
        section: sectionData,
        totalSections: document.sections.length,
      });
    } else {
      // Return full document
      res.json({
        metadata: document.metadata,
        sections: document.sections,
        htmlContent: document.htmlContent,
        rawContent: document.rawContent,
      });
    }
  } catch (error) {
    throw error;
  }
});

// GET /api/doc/sections - Get all sections (table of contents)
router.get('/sections', async (req: Request, res: Response) => {
  try {
    const documentService: DocumentService = req.app.locals.documentService;
    const sections = documentService.getSections();
    
    const toc = sections.map(section => ({
      id: section.id,
      slug: section.slug,
      title: section.title,
      level: section.level,
      wordCount: section.content.split(/\s+/).length,
    }));
    
    res.json({
      sections: toc,
      totalSections: sections.length,
    });
  } catch (error) {
    throw error;
  }
});

// GET /api/doc/section/:slug - Get specific section
router.get('/section/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const documentService: DocumentService = req.app.locals.documentService;
    const section = documentService.getSection(slug);
    
    if (!section) {
      throw new NotFoundError(`Section '${slug}' not found`);
    }
    
    res.json({
      section,
      metadata: documentService.getMetadata(),
    });
  } catch (error) {
    throw error;
  }
});

// GET /api/doc/metadata - Get document metadata
router.get('/metadata', async (req: Request, res: Response) => {
  try {
    const documentService: DocumentService = req.app.locals.documentService;
    const metadata = documentService.getMetadata();
    
    if (!metadata) {
      throw new NotFoundError('Document metadata not found');
    }
    
    res.json({ metadata });
  } catch (error) {
    throw error;
  }
});

// PUT /api/doc - Update document (requires authentication)
router.put('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { content, message }: UpdateDocumentRequest = req.body;
    
    if (!content || typeof content !== 'string') {
      throw new ValidationError('Content is required and must be a string');
    }
    
    if (content.trim().length === 0) {
      throw new ValidationError('Content cannot be empty');
    }
    
    const documentService: DocumentService = req.app.locals.documentService;
    const searchService = req.app.locals.searchService;
    
    // Update document
    await documentService.updateDocument(content, message);
    
    // Update search index
    const newSections = documentService.getSections();
    searchService.updateSections(newSections);
    
    const metadata = documentService.getMetadata();
    
    const response: UpdateDocumentResponse = {
      success: true,
      message: message || 'Document updated successfully',
      metadata: metadata!,
    };
    
    logger.info('Document updated successfully', {
      wordCount: metadata?.wordCount,
      sectionCount: metadata?.sectionCount,
      message,
    });
    
    res.json(response);
  } catch (error) {
    throw error;
  }
});

// POST /api/doc/validate - Validate document content (requires authentication)
router.post('/validate', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    
    if (!content || typeof content !== 'string') {
      throw new ValidationError('Content is required and must be a string');
    }
    
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Basic validation rules
    if (content.trim().length === 0) {
      errors.push('Content cannot be empty');
    }
    
    if (content.length > 1000000) { // 1MB limit
      errors.push('Content exceeds maximum size limit (1MB)');
    }
    
    if (!content.includes('# ')) {
      warnings.push('Document should have at least one heading');
    }
    
    const lineCount = content.split('\n').length;
    if (lineCount > 10000) {
      warnings.push('Document is very long and may impact performance');
    }
    
    res.json({
      valid: errors.length === 0,
      errors,
      warnings,
      stats: {
        characters: content.length,
        words: content.split(/\s+/).filter(w => w.length > 0).length,
        lines: lineCount,
        paragraphs: content.split(/\n\s*\n/).length,
      },
    });
  } catch (error) {
    throw error;
  }
});

export default router;