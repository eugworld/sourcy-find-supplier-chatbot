'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownContentProps {
  content: string;
  compact?: boolean;
}

export function MarkdownContent({ content, compact = false }: MarkdownContentProps) {
  return (
    <div className="markdown-content text-sm leading-6 text-slate-800">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1
              className={`${compact ? 'text-lg' : 'text-xl'} mt-3 font-semibold text-slate-900 first:mt-0`}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              className={`${compact ? 'text-base' : 'text-lg'} mt-3 font-semibold text-slate-900 first:mt-0`}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-2 text-base font-semibold text-slate-900 first:mt-0">{children}</h3>
          ),
          p: ({ children }) => <p className="mt-2 first:mt-0">{children}</p>,
          ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-2 rounded-r-md border-l-4 border-slate-300 bg-slate-100/70 px-3 py-2 text-slate-700">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-slate-100">{children}</thead>,
          th: ({ children }) => (
            <th className="border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-slate-100 px-3 py-2 align-top text-sm text-slate-700">
              {children}
            </td>
          ),
          code: ({ className, children }) => {
            const isBlock = Boolean(className?.includes('language-'));

            if (isBlock) {
              return (
                <code className="block overflow-x-auto rounded-lg bg-slate-900 px-3 py-2 font-mono text-xs text-slate-100">
                  {children}
                </code>
              );
            }

            return (
              <code className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[12px] text-slate-800">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre className="my-2">{children}</pre>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-teal-700 underline decoration-teal-400 underline-offset-2 hover:text-teal-600"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
