// Tiny markdown renderer for the fake Home Assistant markdown card.
// Supports the subset used by the demo dashboard: headings, bold, italic,
// inline code, links, and unordered/ordered lists.

const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const inline = (text: string): string =>
  text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')

export const renderMarkdown = (source: string): string => {
  const lines = escapeHtml(source || '').split('\n')
  const html: string[] = []
  let list: 'ul' | 'ol' | null = null
  let paragraph: string[] = []

  const closeList = () => {
    if (list) {
      html.push(`</${list}>`)
      list = null
    }
  }
  const closeParagraph = () => {
    if (paragraph.length) {
      html.push(`<p>${paragraph.map(inline).join('<br>')}</p>`)
      paragraph = []
    }
  }

  for (const line of lines) {
    const heading = line.match(/^(#{1,6})\s+(.*)$/)
    const bullet = line.match(/^\s*[-*]\s+(.*)$/)
    const ordered = line.match(/^\s*\d+\.\s+(.*)$/)

    if (heading) {
      closeParagraph()
      closeList()
      const level = heading[1].length
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`)
    } else if (bullet || ordered) {
      closeParagraph()
      const kind = bullet ? 'ul' : 'ol'
      if (list !== kind) {
        closeList()
        html.push(`<${kind}>`)
        list = kind
      }
      html.push(`<li>${inline((bullet || ordered)![1])}</li>`)
    } else if (line.trim() === '') {
      closeParagraph()
      closeList()
    } else {
      closeList()
      paragraph.push(line)
    }
  }
  closeParagraph()
  closeList()
  return html.join('\n')
}
