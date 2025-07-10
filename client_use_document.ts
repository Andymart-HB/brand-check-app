import { useState, useEffect, useCallback } from 'react';
import { ParsedDocument } from '../types';
import { getDocument, updateDocument as apiUpdateDocument } from '../services/api';

export function useDocument() {
  const [document, setDocument] = useState<ParsedDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocument = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const doc = await getDocument();
      setDocument(doc);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document');
      console.error('Failed to load document:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDocument = useCallback(async (content: string, message?: string) => {
    try {
      setError(null);
      const response = await apiUpdateDocument(content, message);
      
      if (response.success) {
        // Reload the document to get the updated content
        await loadDocument();
        return true;
      } else {
        throw new Error(response.message || 'Update failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update document';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [loadDocument]);

  // Auto-reload document when file changes (polling fallback)
  useEffect(() => {
    loadDocument();
    
    // Set up polling for changes (fallback for when WebSocket isn't available)
    const interval = setInterval(async () => {
      try {
        const doc = await getDocument();
        if (document && doc.metadata.lastModified !== document.metadata.lastModified) {
          setDocument(doc);
        }
      } catch (err) {
        // Silently fail polling - main load will show errors
        console.debug('Polling failed:', err);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [loadDocument]);

  return {
    document,
    loading,
    error,
    updateDocument,
    reload: loadDocument
  };
}