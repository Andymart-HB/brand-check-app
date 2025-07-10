import fs from 'fs/promises';
import path from 'path';
import { marked } from 'marked';
import chokidar from 'chokidar';
import { DocumentSection, DocumentMetadata, ParsedDocument } from '../types';
import { logger } from '../utils/logger';
import { slugify } from '../utils/slugify';
import { extractSections } from '../utils/markdown';

export class DocumentService {
  private filePath: string;
  private document: ParsedDocument | null = null;
  private watcher: chokidar.FSWatcher | null = null;
  private changeCallbacks: Array<() => void> = [];
  private lastChangeTime: number = 0;

  constructor(filePath: string) {
    this.filePath = path.resolve(filePath);
  }

  async initialize(): Promise<void> {
    try {
      await this.loadDocument();
      this.startWatching();
      logger.info(`Document service initialized with file: ${this.filePath}`);
    } catch (error) {
      logger.error('Failed to initialize document service:', error);
      throw error;
    }
  }

  async loadDocument(): Promise<void> {
    try {
      const startTime = Date.now();
      const stats = await fs.stat(this.filePath);
      const content = await fs.readFile(this.filePath, 'utf-8');
      
      // Parse markdown to HTML
      const htmlContent = marked(content);
      
      // Extract sections
      const sections = extractSections(content);
      
      // Calculate metadata
      const metadata: DocumentMetadata = {
        title: this.extractTitle(content),
        lastModified: stats.mtime,
        size: stats.size,
        wordCount: this.countWords(content),
        sectionCount: sections.length,
      };

      this.document = {
        metadata,
        sections,
        rawContent: content,
        htmlContent,
      };

      const loadTime = Date.now() - startTime;
      logger.info(`Document loaded in ${loadTime}ms: ${sections.length} sections, ${metadata.wordCount} words`);
      
      // Notify change callbacks
      this.notifyChange();
      
    } catch (error) {
      logger.error('Failed to load document:', error);
      throw error;
    }
  }

  private startWatching(): void {
    if (this.watcher) {
      this.watcher.close();
    }

    this.watcher = chokidar.watch(this.filePath, {
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher.on('change', async () => {
      const now = Date.now();
      // Debounce changes (wait 100ms)
      if (now - this.lastChangeTime < 100) {
        return;
      }
      this.lastChangeTime = now;

      try {
        logger.info('File changed, reloading document...');
        await this.loadDocument();
        logger.info('Document reloaded successfully');
      } catch (error) {
        logger.error('Failed to reload document:', error);
      }
    });

    this.watcher.on('error', (error) => {
      logger.error('File watcher error:', error);
    });
  }

  private extractTitle(content: string): string {
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.startsWith('# ')) {
        return line.slice(2).trim();
      }
    }
    return path.basename(this.filePath, '.md');
  }

  private countWords(content: string): number {
    return content.split(/\s+/).filter(word => word.length > 0).length;
  }

  private notifyChange(): void {
    this.changeCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        logger.error('Error in change callback:', error);
      }
    });
  }

  onDocumentChange(callback: () => void): void {
    this.changeCallbacks.push(callback);
  }

  removeChangeCallback(callback: () => void): void {
    const index = this.changeCallbacks.indexOf(callback);
    if (index > -1) {
      this.changeCallbacks.splice(index, 1);
    }
  }

  getDocument(): ParsedDocument | null {
    return this.document;
  }

  getSections(): DocumentSection[] {
    return this.document?.sections || [];
  }

  getSection(slug: string): DocumentSection | null {
    return this.getSections().find(section => section.slug === slug) || null;
  }

  getMetadata(): DocumentMetadata | null {
    return this.document?.metadata || null;
  }

  async updateDocument(content: string, message?: string): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Backup original file
      const backupPath = `${this.filePath}.backup.${Date.now()}`;
      await fs.copyFile(this.filePath, backupPath);
      
      // Write new content
      await fs.writeFile(this.filePath, content, 'utf-8');
      
      // Reload document
      await this.loadDocument();
      
      const updateTime = Date.now() - startTime;
      logger.info(`Document updated in ${updateTime}ms${message ? `: ${message}` : ''}`);
      
    } catch (error) {
      logger.error('Failed to update document:', error);
      throw error;
    }
  }

  shutdown(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    this.changeCallbacks = [];
    logger.info('Document service shutdown complete');
  }
}