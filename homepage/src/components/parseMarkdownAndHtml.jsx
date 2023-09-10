import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

export function ParseMarkdownAndHtml({ children }) {
  return <ReactMarkdown rehypePlugins={rehypeRaw}>{children}</ReactMarkdown>;
}
