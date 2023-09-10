import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

export function ParseMarkdownAndHtml({ children, markdown }) {
  if (!markdown) return (
    <div dangerouslySetInnerHTML={{ __html: children }} />
  )
  return <ReactMarkdown rehypePlugins={[rehypeRaw]}>{children}</ReactMarkdown>;
}
