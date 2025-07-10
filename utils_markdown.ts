import { DocumentSection } from '../types';
import { slugify } from './slugify';

export function extractSections(content: string): DocumentSection[] {
  const lines = content.split('\n');
  const sections: DocumentSection[] = [];
  let currentSection: Partial<DocumentSection> | null = null;
  let sectionContent: string[] = [];
  let sectionIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      // Save previous section if it exists
      if (currentSection) {
        sections.push({
          ...currentSection,
          content: sectionContent.join('\n').trim(),
          endLine: i - 1,
        } as DocumentSection);
      }

      // Start new section
      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();
      const slug = slugify(title);
      
      currentSection = {
        id: `section-${sectionIndex++}`,
        slug,
        title,
        level,
        startLine: i,
      };
      
      sectionContent = [];
    } else if (currentSection) {
      sectionContent.push(line);
    }
  }

  // Add the last section
  if (currentSection) {
    sections.push({
      ...currentSection,
      content: sectionContent.join('\n').trim(),
      endLine: lines.length - 1,
    } as DocumentSection);
  }

  return sections;
}

export function extractTableOfContents(sections: DocumentSection[]): Array<{
  id: string;
  slug: string;
  title: string;
  level: number;
  children?: Array<{
    id: string;
    slug: string;
    title: string;
    level: number;
  }>;
}> {
  const toc: any[] = [];
  const stack: any[] = [];

  for (const section of sections) {
    const item = {
      id: section.id,
      slug: section.slug,
      title: section.title,
      level: section.level,
      children: [],
    };

    // Remove items from stack that are at same or deeper level
    while (stack.length > 0 && stack[stack.length - 1].level >= section.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      // Top level item
      toc.push(item);
    } else {
      // Add as child of last item in stack
      const parent = stack[stack.length - 1];
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(item);
    }

    stack.push(item);
  }

  return toc;
}

export function generateMarkdownFromSections(sections: DocumentSection[]): string {
  return sections
    .map(section => {
      const heading = '#'.repeat(section.level) + ' ' + section.title;
      return heading + '\n\n' + section.content;
    })
    .join('\n\n');
}

export function findSectionByLineNumber(sections: DocumentSection[], lineNumber: number): DocumentSection | null {
  return sections.find(section => 
    lineNumber >= section.startLine && lineNumber <= section.endLine
  ) || null;
}

export function extractMetaTags(content: string): Record<string, string> {
  const meta: Record<string, string> = {};
  const lines = content.split('\n');
  
  // Look for YAML frontmatter
  if (lines[0] === '---') {
    let i = 1;
    while (i < lines.length && lines[i] !== '---') {
      const line = lines[i].trim();
      if (line && line.includes(':')) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
        meta[key.trim()] = value;
      }
      i++;
    }
  }
  
  return meta;
}

export function escapeMarkdown(text: string): string {
  return text.replace(/[\\`*_{}[\]()#+\-.!]/g, '\\$&');
}

export function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/`(.*?)`/g, '$1') // Remove inline code
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
    .replace(/^\s*[-*+]\s+/gm, '') // Remove list markers
    .replace(/^\s*\d+\.\s+/gm, '') // Remove ordered list markers
    .replace(/^\s*>\s+/gm, '') // Remove blockquotes
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/---+/g, '') // Remove horizontal rules
    .trim();
}