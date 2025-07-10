import { createServer } from 'http';
import app from './app';
import { logger } from './utils/logger';
import { DocumentService } from './services/documentService';
import { SearchService } from './services/searchService';

const PORT = process.env.PORT || 3000;
const MARKDOWN_FILE = process.env.MARKDOWN_FILE || 'data/brand-check-app-overview.md';

async function startServer() {
  try {
    // Initialize services
    const documentService = new DocumentService(MARKDOWN_FILE);
    const searchService = new SearchService();
    
    // Make services available to app
    app.locals.documentService = documentService;
    app.locals.searchService = searchService;
    
    // Initialize document and search index
    await documentService.initialize();
    await searchService.initialize(documentService.getSections());
    
    // Start HTTP server
    const server = createServer(app);
    
    server.listen(PORT, () => {
      logger.info(`Brand Check Service running on port ${PORT}`);
      logger.info(`Markdown file: ${MARKDOWN_FILE}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        documentService.shutdown();
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        documentService.shutdown();
        process.exit(0);
      });
    });
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();