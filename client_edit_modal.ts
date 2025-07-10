import React, { useState, useEffect, useRef } from 'react';
import { X, Save, AlertCircle, Eye, Code } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ParsedDocument } from '../types';

interface EditModalProps {
  document: ParsedDocument | null;
  onClose: () => void;
  onSave: (content: string, message?: string) => Promise<boolean>;
}

const EditModal: React.FC<EditModalProps> = ({ document, onClose, onSave }) => {
  const [content, setContent] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [showAuth, setShowAuth] = useState(true);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (document) {
      setContent(document.rawContent);
    }
  }, [document]);

  useEffect(() => {
    if (document) {
      setHasChanges(content !== document.rawContent);
    }
  }, [content, document]);

  const handleSave = async () => {
    if (!authToken.trim()) {
      setError('Authentication token is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Set auth token in localStorage for API calls
      localStorage.setItem('auth_token', authToken);
      
      const success = await onSave(content, message.trim() || undefined);
      if (success) {
        setHasChanges(false);
        setMessage('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      const confirmed = confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmed) return;
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      if (!showAuth) {
        handleSave();
      }
    }
    
    if (e.key === 'Escape') {
      handleClose();
    }

    // Handle tab in textarea
    if (e.key === 'Tab' && e.target === textareaRef.current) {
      e.preventDefault();
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      
      setContent(prev => 
        prev.substring(0, start) + '  ' + prev.substring(end)
      );
      
      // Move cursor
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const handleAuth = () => {
    if (authToken.trim()) {
      setShowAuth(false);
      setError('');
    } else {
      setError('Please enter an authentication token');
    }
  };

  if (!document) {
    return null;
  }

  return (
    <div 
      className="edit-modal"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          height: '100%',
          maxWidth: '1200px',
          maxHeight: '800px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              Edit Document
            </h2>
            <p style={{ 
              margin: '4px 0 0 0', 
              fontSize: '14px', 
              color: '#64748b' 
            }}>
              {document.metadata.title}
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!showAuth && (
              <>
                <button
                  className="btn"
                  onClick={() => setShowPreview(!showPreview)}
                  title="Toggle preview"
                >
                  {showPreview ? <Code size={16} /> : <Eye size={16} />}
                  <span style={{ marginLeft: '6px' }}>
                    {showPreview ? 'Edit' : 'Preview'}
                  </span>
                </button>
                
                <button
                  className={`btn ${hasChanges ? 'btn-primary' : ''}`}
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  title="Save changes (Cmd+S)"
                >
                  {saving ? (
                    <div className="loading-spinner" style={{ width: '16px', height: '16px' }} />
                  ) : (
                    <Save size={16} />
                  )}
                  <span style={{ marginLeft: '6px' }}>
                    {saving ? 'Saving...' : 'Save'}
                  </span>
                </button>
              </>
            )}
            
            <button
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                color: '#64748b'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Authentication */}
        {showAuth && (
          <div style={{ 
            padding: '40px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div>
              <AlertCircle size={48} style={{ color: '#f59e0b', marginBottom: '16px' }} />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                Authentication Required
              </h3>
              <p style={{ 
                margin: '8px 0 0 0', 
                color: '#64748b',
                maxWidth: '400px'
              }}>
                Enter your authentication token to edit the document. This token will be used for all edit operations.
              </p>
            </div>
            
            <div style={{ width: '100%', maxWidth: '400px' }}>
              <input
                type="password"
                className="input"
                placeholder="Enter authentication token"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAuth();
                  }
                }}
                style={{ marginBottom: '16px' }}
              />
              
              <button
                className="btn btn-primary"
                onClick={handleAuth}
                style={{ width: '100%' }}
              >
                Authenticate
              </button>
              
              {error && (
                <div className="error-message" style={{ marginTop: '16px' }}>
                  {error}
                </div>
              )}
              
              <div style={{
                marginTop: '20px',
                fontSize: '14px',
                color: '#64748b',
                textAlign: 'left'
              }}>
                <p><strong>Development:</strong> Use "dev-edit-token"</p>
                <p><strong>Production:</strong> Contact your administrator for the edit token</p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {!showAuth && (
          <>
            {/* Commit Message */}
            <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
              <input
                type="text"
                className="input"
                placeholder="Describe your changes (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{ fontSize: '14px' }}
              />
            </div>

            {/* Editor/Preview */}
            <div style={{ 
              flex: 1,
              display: 'flex',
              overflow: 'hidden'
            }}>
              {!showPreview ? (
                <textarea
                  ref={textareaRef}
                  className="input textarea"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter markdown content..."
                  style={{
                    flex: 1,
                    border: 'none',
                    borderRadius: 0,
                    fontSize: '14px',
                    fontFamily: '"Fira Code", "Monaco", "Cascadia Code", monospace',
                    lineHeight: '1.6',
                    padding: '20px',
                    resize: 'none'
                  }}
                />
              ) : (
                <div style={{
                  flex: 1,
                  padding: '20px',
                  overflow: 'auto',
                  background: '#fafafa'
                }}>
                  <div className="markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {content}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid #e5e7eb',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '14px',
              color: '#64748b'
            }