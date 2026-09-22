import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

type ParseMarkdownAndHtmlProps = {
  children?: string;
  markdown?: boolean;
};

export function ParseMarkdownAndHtml({
  children,
  markdown,
}: ParseMarkdownAndHtmlProps) {
  if (!markdown)
    return <div dangerouslySetInnerHTML={{ __html: children ?? '' }} />;
  return <ReactMarkdown rehypePlugins={[rehypeRaw]}>{children}</ReactMarkdown>;
}
