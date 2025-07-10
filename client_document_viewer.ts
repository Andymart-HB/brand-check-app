import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { ParsedDocument } from '../types';
import { Clock, FileText, Hash } from 'lucide-react';

interface DocumentViewerProps {
  document: ParsedDocument | null;
  onSectionClick: (slug: string) => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ document, onSectionClick }) => {
  if (!document) {
    return (
      <div className="card">
        <p>No document loaded</p>
      </div>
    );
  }

  const { metadata, sections, rawContent } = document;

  return (
    <div className="document-viewer">
      {/* Document Metadata */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} style={{ color: '#64748b' }} />
              <span style={{ fontSize: '14px', color: '#64748b' }}>
                {metadata.wordCount.toLocaleString()} words
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Hash size={16} style={{ color: '#64748b' }} />
              <span style={{ fontSize: '14px', color: '#64748b' }}>
                {metadata.sectionCount} sections
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} style={{ color: '#64748b' }} />
              <span style={{ fontSize: '14px', color: '#64748b' }}>
                Updated {new Date(metadata.lastModified).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="table-of-contents">
        <h3>Table of Contents</h3>
        <nav>
          <ul>
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onSectionClick(section.slug);
                  }}
                  className={`level-${section.level}`}
                  style={{
                    fontSize: section.level <= 2 ? '14px' : '13px',
                    fontWeight: section.level <= 2 ? '500' : '400',
                  }}
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Document Content */}
      <div className="card">
        <div className="markdown-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              // Add IDs to headings for deep linking
              h1: ({ children, ...props }) => {
                const text = children?.toString() || '';
                const slug = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
                return <h1 id={slug} {...props}>{children}</h1>;
              },
              h2: ({ children, ...props }) => {
                const text = children?.toString() || '';
                const slug = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
                return <h2 id={slug} {...props}>{children}</h2>;
              },
              h3: ({ children, ...props }) => {
                const text = children?.toString() || '';
                const slug = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
                return <h3 id={slug} {...props}>{children}</h3>;
              },
              h4: ({ children, ...props }) => {
                const text = children?.toString() || '';
                const slug = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
                return <h4 id={slug} {...props}>{children}</h4>;
              },
              h5: ({ children, ...props }) => {
                const text = children?.toString() || '';
                const slug = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
                return <h5 id={slug} {...props}>{children}</h5>;
              },
              h6: ({ children, ...props }) => {
                const text = children?.toString() || '';
                const slug = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
                return <h6 id={slug} {...props}>{children}</h6>;
              },
              // Custom link handling
              a: ({ href, children, ...props }) => {
                if (href?.startsWith('#')) {
                  return (
                    <a
                      href={href}
                      onClick={(e) => {
                        e.preventDefault();
                        onSectionClick(href.slice(1));
                      }}
                      {...props}
                    >
                      {children}
                    </a>
                  );
                }
                return (
                  <a
                    href={href}
                    target={href?.startsWith('http') ? '_blank' : undefined}
                    rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                    {...props}
                  >
                    {children}
                  </a>
                );
              },
              // Custom code block handling
              code: ({ inline, className, children, ...props }) => {
                if (inline) {
                  return <code className="inline-code" {...props}>{children}</code>;
                }
                return (
                  <div style={{ position: 'relative' }}>
                    <pre className={className} {...props}>
                      <code>{children}</code>
                    </pre>
                  </div>
                );
              },
              // Custom table handling
              table: ({ children, ...props }) => (
                <div style={{ overflowX: 'auto', margin: '1em 0' }}>
                  <table {...props}>{children}</table>
                </div>
              ),
            }}
          >
            {rawContent}
          </ReactMarkdown>
        </div>
      </div>

      {/* Section Navigation */}
      <div style={{ 
        marginTop: '40px', 
        padding: '20px 0', 
        borderTop: '1px solid #e5e7eb' 
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '14px',
          color: '#64748b'
        }}>
          <span>
            Reading time: ~{Math.ceil(metadata.wordCount / 200)} minutes
          </span>
          <span>
            {(metadata.size / 1024).toFixed(1)} KB
          </span>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;