// Native markdown to HTML parser
export const parseMarkdownToHTML = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  let html = text;
  
  // Escape HTML to prevent XSS attacks (safety first)
  html = html.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
  
  // Headers (h1, h2, h3)
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
  
  // Bold text
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  
  // Italic text
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  
  // Inline code
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  
  // Links [text](url)
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Unordered lists (- item or * item)
  const listRegex = /^[\-\*] (.*?)$/gm;
  const listItems = [];
  let listMatch;
  let lastIndex = 0;
  
  // Process lists by finding and replacing them
  const lines = html.split('\n');
  let inList = false;
  let processedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isListItem = /^[\-\*] /.test(line);
    
    if (isListItem && !inList) {
      // Start a new list
      inList = true;
      processedLines.push('<ul>');
      processedLines.push(`<li>${line.replace(/^[\-\*] /, '')}</li>`);
    } else if (isListItem && inList) {
      // Continue current list
      processedLines.push(`<li>${line.replace(/^[\-\*] /, '')}</li>`);
    } else if (!isListItem && inList) {
      // End the list
      inList = false;
      processedLines.push('</ul>');
      processedLines.push(line);
    } else {
      processedLines.push(line);
    }
  }
  
  if (inList) {
    processedLines.push('</ul>');
  }
  
  html = processedLines.join('\n');
  
  // Ordered lists (1. item)
  const orderedLines = html.split('\n');
  let inOrderedList = false;
  let orderedProcessed = [];
  
  for (let i = 0; i < orderedLines.length; i++) {
    const line = orderedLines[i];
    const isOrderedItem = /^\d+\. /.test(line);
    
    if (isOrderedItem && !inOrderedList) {
      inOrderedList = true;
      orderedProcessed.push('<ol>');
      orderedProcessed.push(`<li>${line.replace(/^\d+\. /, '')}</li>`);
    } else if (isOrderedItem && inOrderedList) {
      orderedProcessed.push(`<li>${line.replace(/^\d+\. /, '')}</li>`);
    } else if (!isOrderedItem && inOrderedList) {
      inOrderedList = false;
      orderedProcessed.push('</ol>');
      orderedProcessed.push(line);
    } else {
      orderedProcessed.push(line);
    }
  }
  
  if (inOrderedList) {
    orderedProcessed.push('</ol>');
  }
  
  html = orderedProcessed.join('\n');
  
  // Blockquotes (> text)
  const quoteLines = html.split('\n');
  let inQuote = false;
  let quoteProcessed = [];
  
  for (let i = 0; i < quoteLines.length; i++) {
    const line = quoteLines[i];
    const isQuote = /^> /.test(line);
    
    if (isQuote && !inQuote) {
      inQuote = true;
      quoteProcessed.push('<blockquote>');
      quoteProcessed.push(line.replace(/^> /, ''));
    } else if (isQuote && inQuote) {
      quoteProcessed.push(line.replace(/^> /, ''));
    } else if (!isQuote && inQuote) {
      inQuote = false;
      quoteProcessed.push('</blockquote>');
      quoteProcessed.push(line);
    } else {
      quoteProcessed.push(line);
    }
  }
  
  if (inQuote) {
    quoteProcessed.push('</blockquote>');
  }
  
  html = quoteProcessed.join('\n');
  
  // Line breaks (double newline becomes paragraph, single becomes <br>)
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br/>');
  
  // Wrap in paragraph if not already wrapped
  if (!html.startsWith('<h') && !html.startsWith('<ul') && !html.startsWith('<ol') && !html.startsWith('<blockquote')) {
    html = `<p>${html}</p>`;
  }
  
  return html;
};