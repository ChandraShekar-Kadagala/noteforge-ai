import { DocumentSection, StructuredBlock } from '../types/document';
import { marked } from 'marked';

export function sectionToHtml(section: DocumentSection): string {
  let bodyHtml = '';
  const rawContent = section.content_markdown || '';

  // Check if content is already HTML
  if (/<[a-z][\s\S]*>/i.test(rawContent)) {
    bodyHtml = rawContent;
  } else {
    // Parse Markdown to HTML
    bodyHtml = marked.parse(rawContent, { gfm: true, breaks: true }) as string;
  }

  // Append any structured blocks if present
  let blocksHtml = '';
  if (section.structured_blocks && section.structured_blocks.length > 0) {
    section.structured_blocks.forEach((block: StructuredBlock) => {
      if (block.type === 'code' && block.data.code) {
        const lang = block.data.language || 'plaintext';
        blocksHtml += `<pre><code class="language-${lang}">${escapeHtml(block.data.code)}</code></pre>`;
      } else if (block.type === 'callout' && block.data.body) {
        const title = block.data.title || 'Note';
        const ctype = block.data.callout_type || 'important';
        blocksHtml += `<blockquote class="callout callout-${ctype}"><strong>${escapeHtml(title)}:</strong> ${escapeHtml(block.data.body)}</blockquote>`;
      } else if (block.type === 'image' && block.data.url) {
        const alt = block.data.caption || 'Illustration';
        blocksHtml += `<p><img src="${block.data.url}" alt="${escapeHtml(alt)}" /></p>`;
      } else if (block.type === 'table' && block.data.headers && block.data.rows) {
        let tbl = '<table><thead><tr>';
        block.data.headers.forEach(h => {
          tbl += `<th>${escapeHtml(h)}</th>`;
        });
        tbl += '</tr></thead><tbody>';
        block.data.rows.forEach(r => {
          tbl += '<tr>';
          r.forEach(c => {
            tbl += `<td>${escapeHtml(c)}</td>`;
          });
          tbl += '</tr>';
        });
        tbl += '</tbody></table>';
        blocksHtml += tbl;
      }
    });
  }

  return `<h2>${escapeHtml(section.title)}</h2>${bodyHtml}${blocksHtml}`;
}

export function sectionsToHtml(sections: DocumentSection[]): string {
  if (!sections || sections.length === 0) {
    return '<h2>Introduction</h2><p>Start typing your educational notes here...</p>';
  }
  return sections.map(s => sectionToHtml(s)).join('\n');
}

export function htmlToSections(html: string, fallbackTitle: string = 'General Notes'): DocumentSection[] {
  if (!html || !html.trim()) {
    return [{
      stable_key: `sec_${Date.now()}`,
      title: fallbackTitle,
      section_type: 'concept',
      order_index: 0,
      content_markdown: '<p></p>',
      structured_blocks: [],
      ai_enriched: false,
    }];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  const headings = Array.from(body.querySelectorAll('h1, h2'));
  if (headings.length === 0) {
    return [{
      stable_key: `sec_${Date.now()}`,
      title: fallbackTitle,
      section_type: 'concept',
      order_index: 0,
      content_markdown: html,
      structured_blocks: [],
      ai_enriched: false,
    }];
  }

  const sections: DocumentSection[] = [];
  let currentTitle = fallbackTitle;
  let currentKey = `sec_${Date.now()}_0`;
  let currentNodes: Node[] = [];
  let order = 0;

  Array.from(body.childNodes).forEach(node => {
    if (node.nodeType === Node.ELEMENT_NODE && (node.nodeName === 'H1' || node.nodeName === 'H2')) {
      if (currentNodes.length > 0 || order > 0) {
        const div = document.createElement('div');
        currentNodes.forEach(n => div.appendChild(n.cloneNode(true)));
        sections.push({
          stable_key: currentKey,
          title: currentTitle,
          section_type: 'concept',
          order_index: order++,
          content_markdown: div.innerHTML,
          structured_blocks: [],
          ai_enriched: false,
        });
        currentNodes = [];
      }
      currentTitle = (node as HTMLElement).textContent?.trim() || `Section ${order + 1}`;
      currentKey = `sec_${Date.now()}_${order}`;
    } else {
      currentNodes.push(node);
    }
  });

  if (currentNodes.length > 0 || sections.length === 0) {
    const div = document.createElement('div');
    currentNodes.forEach(n => div.appendChild(n.cloneNode(true)));
    sections.push({
      stable_key: currentKey,
      title: currentTitle,
      section_type: 'concept',
      order_index: order++,
      content_markdown: div.innerHTML,
      structured_blocks: [],
      ai_enriched: false,
    });
  }

  return sections;
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
