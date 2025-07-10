import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, Hash } from 'lucide-react';
import { searchDocuments } from '../services/api';
import { SearchResult } from '../types';

interface SearchInterfaceProps {
  onClose: () => void;
  onSelectResult: (slug: string) => void;
}

const SearchInterface: React.FC<SearchInterfaceProps> = ({ onClose, onSelectResult }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTime, setSearchTime] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelectResult(results[selectedIndex]);
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [results, selectedIndex, onClose]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Scroll selected result into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setError('');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await searchDocuments(searchQuery);
      setResults(response.results);
      setSearchTime(response.searchTime);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    onSelectResult(result.section.slug);
  };

  const highlightMatches = (text: string, matches: string[]) => {
    if (!matches.length) return text;
    
    let highlightedText = text;
    matches.forEach(match => {
      const regex = new RegExp(`(${match})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="highlight">$1</mark>');
    });
    
    return highlightedText;
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <div 
      className="search-modal"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
        zIndex: 50
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'hidden',
          margin: '0 20px'
        }}
      >
        {/* Search Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Search size={20} style={{ color: '#64748b' }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search documents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '16px',
              color: '#1e293b'
            }}
          />
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: '#64748b'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Results */}
        <div 
          ref={resultsRef}
          style={{
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '8px'
          }}
        >
          {loading && (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#64748b'
            }}>
              <div className="loading-spinner" style={{ marginBottom: '12px' }}></div>
              <p>Searching...</p>
            </div>
          )}

          {error && (
            <div className="error-message" style={{ margin: '20px' }}>
              {error}
            </div>
          )}

          {!loading && !error && query && results.length === 0 && (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#64748b'
            }}>
              <p>No results found for "{query}"</p>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>
                Try different keywords or check spelling
              </p>
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <>
              <div style={{
                padding: '12px 16px',
                fontSize: '14px',
                color: '#64748b',
                borderBottom: '1px solid #f1f5f9'
              }}>
                {results.length} result{results.length !== 1 ? 's' : ''} in {searchTime}ms
              </div>

              {results.map((result, index) => (
                <div
                  key={result.section.id}
                  className={`search-result ${index === selectedIndex ? 'selected' : ''}`}
                  style={{
                    padding: '16px',
                    margin: '4px 8px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: index === selectedIndex ? '#f0f9ff' : 'white',
                    borderColor: index === selectedIndex ? '#3b82f6' : '#e5e7eb'
                  }}
                  onClick={() => handleSelectResult(result)}
                >
                  <div className="search-result-title" style={{
                    fontWeight: '600',
                    color: '#1e293b',
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    {result.section.title}
                  </div>
                  
                  <div 
                    className="search-result-snippet"
                    style={{
                      color: '#64748b',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      marginBottom: '8px'
                    }}
                    dangerouslySetInnerHTML={{
                      __html: highlightMatches(
                        result.section.content.slice(0, 200) + 
                        (result.section.content.length > 200 ? '...' : ''),
                        result.matches
                      )
                    }}
                  />
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: '#9ca3af'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Hash size={12} />
                        Level {result.section.level}
                      </span>
                      
                      {result.matches.length > 0 && (
                        <span>
                          {result.matches.length} match{result.matches.length !== 1 ? 'es' : ''}
                        </span>
                      )}
                    </div>
                    
                    <span>
                      Score: {(result.score * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}

          {!query && (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#64748b'
            }}>
              <Search size={48} style={{ color: '#d1d5db', marginBottom: '16px' }} />
              <p style={{ marginBottom: '8px' }}>Search the document</p>
              <p style={{ fontSize: '14px' }}>
                Use keywords or phrases to find specific content
              </p>
              
              <div style={{
                marginTop: '24px',
                fontSize: '12px',
                color: '#9ca3af'
              }}>
                <p>Tips:</p>
                <ul style={{ 
                  textAlign: 'left', 
                  display: 'inline-block',
                  paddingLeft: '20px'
                }}>
                  <li>Use ↑↓ to navigate results</li>
                  <li>Press Enter to select</li>
                  <li>Press Escape to close</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchInterface;