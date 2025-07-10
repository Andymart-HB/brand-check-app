import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import DocumentViewer from './components/DocumentViewer';
import SearchInterface from './components/SearchInterface';
import EditModal from './components/EditModal';
import Navigation from './components/Navigation';
import { useDocument } from './hooks/useDocument';
import { Search, Edit, FileText, Menu, X } from 'lucide-react';

function App() {
  const [showSearch, setShowSearch] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const { document, loading, error, updateDocument } = useDocument();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle hash navigation
  useEffect(() => {
    if (location.hash) {
      const element = document?.querySelector(location.hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location.hash, document]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'k') {
          e.preventDefault();
          setShowSearch(true);
        } else if (e.key === 'e') {
          e.preventDefault();
          setShowEdit(true);
        }
      }
      
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowEdit(false);
        setShowNav(false);
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  const handleSectionClick = (slug: string) => {
    navigate(`#${slug}`);
    setShowNav(false);
  };

  const handleSearchSelect = (slug: string) => {
    navigate(`#${slug}`);
    setShowSearch(false);
  };

  const handleEditSave = async (content: string, message?: string) => {
    try {
      await updateDocument(content, message);
      setShowEdit(false);
      return true;
    } catch (error) {
      console.error('Failed to save document:', error);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <span style={{ marginLeft: '10px' }}>Loading document...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <h3>Error loading document</h3>
        <p>{error}</p>
        <button 
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '12px 20px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            className="btn"
            onClick={() => setShowNav(!showNav)}
            title="Toggle navigation"
          >
            {showNav ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={24} style={{ color: '#3b82f6' }} />
            <h1 style={{ 
              margin: 0, 
              fontSize: '18px', 
              fontWeight: '600',
              color: '#1e293b'
            }}>
              {document?.metadata.title || 'Brand Check'}
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn"
            onClick={() => setShowSearch(true)}
            title="Search (Cmd+K)"
          >
            <Search size={16} />
            <span style={{ marginLeft: '6px' }}>Search</span>
          </button>
          
          <button
            className="btn"
            onClick={() => setShowEdit(true)}
            title="Edit document (Cmd+E)"
          >
            <Edit size={16} />
            <span style={{ marginLeft: '6px' }}>Edit</span>
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
        {/* Sidebar Navigation */}
        {showNav && (
          <div style={{
            width: '300px',
            borderRight: '1px solid #e5e7eb',
            background: 'white',
            height: 'calc(100vh - 60px)',
            position: 'sticky',
            top: '60px',
            overflow: 'auto'
          }}>
            <Navigation
              sections={document?.sections || []}
              onSectionClick={handleSectionClick}
              currentHash={location.hash.slice(1)}
            />
          </div>
        )}

        {/* Main Content */}
        <main style={{ 
          flex: 1, 
          overflow: 'auto',
          padding: '20px'
        }}>
          <div className="container">
            <Routes>
              <Route 
                path="/" 
                element={
                  <DocumentViewer 
                    document={document}
                    onSectionClick={handleSectionClick}
                  />
                } 
              />
            </Routes>
          </div>
        </main>
      </div>

      {/* Search Modal */}
      {showSearch && (
        <SearchInterface
          onClose={() => setShowSearch(false)}
          onSelectResult={handleSearchSelect}
        />
      )}

      {/* Edit Modal */}
      {showEdit && (
        <EditModal
          document={document}
          onClose={() => setShowEdit(false)}
          onSave={handleEditSave}
        />
      )}

      {/* Footer */}
      <footer style={{
        background: '#f8fafc',
        borderTop: '1px solid #e5e7eb',
        padding: '16px 20px',
        textAlign: 'center',
        color: '#64748b',
        fontSize: '14px'
      }}>
        <div className="container">
          <p style={{ margin: 0 }}>
            Brand Check Service - Document last updated: {' '}
            {document?.metadata.lastModified 
              ? new Date(document.metadata.lastModified).toLocaleString()
              : 'Unknown'
            }
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;