import React from 'react';
import { DocumentSection } from '../types';
import { Hash } from 'lucide-react';

interface NavigationProps {
  sections: DocumentSection[];
  onSectionClick: (slug: string) => void;
  currentHash?: string;
}

const Navigation: React.FC<NavigationProps> = ({ sections, onSectionClick, currentHash }) => {
  const buildNavigationTree = (sections: DocumentSection[]) => {
    const tree: Array<DocumentSection & { children: DocumentSection[] }> = [];
    const stack: Array<DocumentSection & { children: DocumentSection[] }> = [];

    for (const section of sections) {
      const item = { ...section, children: [] };

      // Remove items from stack that are at same or deeper level
      while (stack.length > 0 && stack[stack.length - 1].level >= section.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        // Top level item
        tree.push(item);
      } else {
        // Add as child of last item in stack
        stack[stack.length - 1].children.push(item);
      }

      stack.push(item);
    }

    return tree;
  };

  const renderNavigationItem = (
    item: DocumentSection & { children: DocumentSection[] },
    depth = 0
  ) => {
    const isActive = currentHash === item.slug;
    const hasChildren = item.children.length > 0;

    return (
      <li key={item.id} style={{ marginBottom: '4px' }}>
        <a
          href={`#${item.slug}`}
          onClick={(e) => {
            e.preventDefault();
            onSectionClick(item.slug);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            paddingLeft: `${12 + depth * 20}px`,
            borderRadius: '6px',
            textDecoration: 'none',
            color: isActive ? '#3b82f6' : '#374151',
            background: isActive ? '#eff6ff' : 'transparent',
            fontSize: item.level <= 2 ? '14px' : '13px',
            fontWeight: item.level <= 2 ? '500' : '400',
            transition: 'all 0.2s',
            borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
          }}
          onMouseEnter={(e) => {
            if (!isActive) {
              e.currentTarget.style.background = '#f8fafc';
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive) {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          <Hash 
            size={12} 
            style={{ 
              color: isActive ? '#3b82f6' : '#9ca3af',
              flexShrink: 0
            }} 
          />
          <span style={{ 
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {item.title}
          </span>
        </a>
        
        {hasChildren && (
          <ul style={{ 
            listStyle: 'none', 
            margin: '4px 0',
            padding: 0
          }}>
            {item.children.map(child => renderNavigationItem(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  const navigationTree = buildNavigationTree(sections);

  return (
    <nav style={{ padding: '20px' }}>
      <div style={{ 
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: '16px', 
          fontWeight: '600',
          color: '#1e293b'
        }}>
          Table of Contents
        </h3>
        <p style={{ 
          margin: '4px 0 0 0', 
          fontSize: '14px', 
          color: '#64748b' 
        }}>
          {sections.length} section{sections.length !== 1 ? 's' : ''}
        </p>
      </div>
      
      <ul style={{ 
        listStyle: 'none', 
        margin: 0, 
        padding: 0 
      }}>
        {navigationTree.map(item => renderNavigationItem(item))}
      </ul>
      
      <div style={{
        marginTop: '20px',
        paddingTop: '16px',
        borderTop: '1px solid #e5e7eb',
        fontSize: '12px',
        color: '#9ca3af'
      }}>
        <p style={{ margin: 0 }}>
          Click any section to jump to it. Use search (Cmd+K) to find specific content.
        </p>
      </div>
    </nav>
  );
};

export default Navigation;