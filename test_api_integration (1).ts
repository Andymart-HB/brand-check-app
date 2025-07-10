import request from 'supertest';
import app from '../../src/app';
import { DocumentService } from '../../src/services/documentService';
import { SearchService } from '../../src/services/searchService';
import fs from 'fs/promises';
import path from 'path';

describe('API Integration Tests', () => {
  let documentService: DocumentService;
  let searchService: SearchService;
  const testFilePath = path.join(__dirname, '../fixtures/test-doc.md');

  beforeAll(async () => {
    // Create test markdown file
    const testContent = `# Test Document

## Introduction
This is a test document for API testing.

## Features
The document has multiple sections for testing search functionality.

### Sub-feature
More detailed content here.`;

    await fs.mkdir(path.dirname(testFilePath), { recursive: true });
    await fs.writeFile(testFilePath, testContent);

    // Initialize services
    documentService = new DocumentService