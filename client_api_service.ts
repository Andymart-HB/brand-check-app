import { 
  ParsedDocument, 
  SearchResponse, 
  UpdateDocumentRequest, 
  UpdateDocumentResponse,
  ApiError 
} from '../types';

const API_BASE = '/api';

class ApiClient {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let error: ApiError;
      try {
        error = await response.json();
      } catch {
        error = {
          error: 'Network Error',
          message: 'Failed to communicate with server',
          statusCode: response.status,
          timestamp: new Date().toISOString()
        };
      }
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getDocument(): Promise<ParsedDocument> {
    const response = await fetch(`${API_BASE}/doc`);
    return this.handleResponse<ParsedDocument>(response);
  }

  async getSection(slug: string): Promise<{ section: any; metadata: any }> {
    const response = await fetch(`${API_BASE}/doc/section/${encodeURIComponent(slug)}`);
    return this.handleResponse(response);
  }

  async updateDocument(content: string, message?: string): Promise<UpdateDocumentResponse> {
    const body: UpdateDocumentRequest = { content, message };
    
    const response = await fetch(`${API_BASE}/doc`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body)
    });
    
    return this.handleResponse<UpdateDocumentResponse>(response);
  }

  async searchDocuments(query: string, limit?: number): Promise<SearchResponse> {
    const params = new URLSearchParams({ q: query });
    if (limit) {
      params.append('limit', limit.toString());
    }
    
    const response = await fetch(`${API_BASE}/search?${params}`);
    return this.handleResponse<SearchResponse>(response);
  }

  async validateDocument(content: string): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    stats: {
      characters: number;
      words: number;
      lines: number;
      paragraphs: number;
    };
  }> {
    const response = await fetch(`${API_BASE}/doc/validate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ content })
    });
    
    return this.handleResponse(response);
  }

  async getSearchSuggestions(query: string, limit = 5): Promise<{
    query: string;
    suggestions: Array<{
      text: string;
      slug?: string;
      type: 'section' | 'keyword';
    }>;
  }> {
    const response = await fetch(`${API_BASE}/search/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit })
    });
    
    return this.handleResponse(response);
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    uptime: number;
    memory: any;
  }> {
    const response = await fetch('/health');
    return this.handleResponse(response);
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// Export convenience functions
export const getDocument = () => apiClient.getDocument();
export const getSection = (slug: string) => apiClient.getSection(slug);
export const updateDocument = (content: string, message?: string) => 
  apiClient.updateDocument(content, message);
export const searchDocuments = (query: string, limit?: number) => 
  apiClient.searchDocuments(query, limit);
export const validateDocument = (content: string) => 
  apiClient.validateDocument(content);
export const getSearchSuggestions = (query: string, limit?: number) => 
  apiClient.getSearchSuggestions(query, limit);
export const healthCheck = () => apiClient.healthCheck();

export default apiClient;