/* A small Markdown subset for spreadsheet descriptions. Raw HTML stays text. */
(() => {
  const escapeHTML = text => text.replace(/[&<>"']/g, char => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]
  ));

  function inline(text, html = true) {
    let output = '';
    for (let index = 0; index < text.length;) {
      if (text[index] === '\\' && /[\\*_]/.test(text[index + 1] || '')) {
        output += html ? escapeHTML(text[index + 1]) : text[index + 1];
        index += 2;
        continue;
      }
      const marker = ['**', '__', '*', '_'].find(token => text.startsWith(token, index));
      // Do not interpret underscores within words, e.g. a route_file_name.
      const withinWord = marker?.includes('_') && /[\p{L}\p{N}]/u.test(text[index - 1] || '');
      if (marker && !withinWord && /\S/.test(text[index + marker.length] || '')) {
        let end = text.indexOf(marker, index + marker.length);
        while (end !== -1) {
          // In **bold *italic*** the outer closing marker is the last two stars.
          if (marker.length === 2 && text[end + 2] === marker[0]) end++;
          if (text[end - 1] !== '\\' && /\S/.test(text[end - 1])) break;
          end = text.indexOf(marker, end + marker.length);
        }
        if (end > index + marker.length) {
          const content = inline(text.slice(index + marker.length, end), html);
          const tag = marker.length === 2 ? 'strong' : 'em';
          output += html ? `<${tag}>${content}</${tag}>` : content;
          index = end + marker.length;
          continue;
        }
      }
      output += html ? escapeHTML(text[index]) : text[index];
      index++;
    }
    return output;
  }

  function render(value) {
    const blocks = [];
    let paragraph = [];
    let items = [];
    let listType = '';
    const flushParagraph = () => {
      if (paragraph.length) blocks.push(`<p>${paragraph.map(line => inline(line)).join('<br>')}</p>`);
      paragraph = [];
    };
    const flushList = () => {
      if (items.length) blocks.push(`<${listType}>${items.map(item => `<li>${inline(item)}</li>`).join('')}</${listType}>`);
      items = [];
      listType = '';
    };
    String(value ?? '').replace(/\r\n?/g, '\n').split('\n').forEach(line => {
      if (!line.trim()) { flushParagraph(); flushList(); return; }
      const bullet = line.match(/^\s*[-*+]\s+(.+)$/);
      const numbered = line.match(/^\s*\d+[.)]\s+(.+)$/);
      if (bullet || numbered) {
        flushParagraph();
        const type = bullet ? 'ul' : 'ol';
        if (listType && listType !== type) flushList();
        listType = type;
        items.push((bullet || numbered)[1]);
      } else {
        flushList();
        paragraph.push(line);
      }
    });
    flushParagraph();
    flushList();
    return blocks.join('');
  }

  window.EventDescription = {
    render,
    // Calendar exports keep their line breaks and bullets, without emphasis markers.
    toPlainText: value => String(value ?? '').replace(/\r\n?/g, '\n').split('\n').map(line => inline(line, false)).join('\n')
  };
})();
