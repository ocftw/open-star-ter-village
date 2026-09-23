import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

type ParseMarkdownAndHtmlProps = {
  children?: string;
  markdown?: boolean;
};

export const ParseMarkdownAndHtml: React.FC<ParseMarkdownAndHtmlProps> = ({
  children,
  markdown,
}) => {
  if (!markdown)
    return <div dangerouslySetInnerHTML={{ __html: children ?? '' }} />;
  return <ReactMarkdown rehypePlugins={[rehypeRaw]}>{children}</ReactMarkdown>;
};
