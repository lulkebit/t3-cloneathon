'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { Copy, Check } from 'lucide-react';
import { useState, Children } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import MermaidDiagram from './MermaidDiagram'; // Import MermaidDiagram
import 'highlight.js/styles/github-dark.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isUserMessage?: boolean;
}

interface CodeBlockProps {
  children?: React.ReactNode;
  className?: string;
  inline?: boolean;
  [key: string]: any;
}

function CodeBlock({ children, className, inline, ...props }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const diagramText = String(children).replace(/\n$/, '');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(diagramText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline) {
    return (
      <code
        className="px-1.5 py-0.5 text-sm bg-gray-800/50 border border-gray-700/50 rounded text-blue-300 font-mono"
        {...props}
      >
        {children}
      </code>
    );
  }

  // Handle Mermaid diagrams
  if (language === 'mermaid' && !inline) {
    return <MermaidDiagram chart={diagramText} />;
  }

  // Default code block rendering
  return (
    <div className="w-full block">
      <div className="relative group my-4 border border-gray-700/50 rounded-lg overflow-hidden w-full">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800/80 border-b border-gray-700/50">
          <span className="text-xs text-gray-300 font-medium">
            {language || 'code'}
          </span>
          <button
            onClick={handleCopy}
            className="cursor-pointer flex items-center gap-1.5 px-2 py-1 text-xs text-gray-300 hover:text-white bg-gray-700/50 hover:bg-gray-600/50 rounded transition-colors"
          >
            {copied ? (
              <>
                <Check size={12} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={12} />
                Copy
              </>
            )}
          </button>
        </div>
        
        <pre className="bg-gray-900/90 overflow-x-auto m-0 p-4 w-full">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      </div>
    </div>
  );
}

export function MarkdownRenderer({ content, className = '', isUserMessage = false }: MarkdownRendererProps) {
  // Check if this is an error message
  const isErrorMessage = content.includes('❌ **Error**:');
  
  return (
    <div className={`markdown-content ${className} ${isUserMessage ? 'user-message' : 'assistant-message'} ${
      isErrorMessage ? 'error-message border border-red-500/30 bg-red-500/5 rounded-lg p-3' : ''
    }`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          code: CodeBlock,
          
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-white mb-4 mt-6 border-b border-gray-700/50 pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold text-white mb-3 mt-5">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-white mb-2 mt-4">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold text-white mb-2 mt-3">
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-sm font-semibold text-white mb-2 mt-3">
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-xs font-semibold text-white mb-2 mt-3">
              {children}
            </h6>
          ),
          
          p: ({ node, children }) => {
            const newChildren = Children.toArray(children).flatMap((child, childIndex) => {
              if (typeof child === 'string') {
                // Process block math first: $$...$$
                const blockProcessed: (string | JSX.Element)[] = [];
                let lastIndex = 0;
                const blockRegex = /\$\$([\s\S]*?)\$\$/g;
                let match;

                while ((match = blockRegex.exec(child)) !== null) {
                  if (match.index > lastIndex) {
                    blockProcessed.push(child.substring(lastIndex, match.index));
                  }
                  blockProcessed.push(<BlockMath key={`block-${childIndex}-${lastIndex}`} math={match[1]} />);
                  lastIndex = blockRegex.lastIndex;
                }
                if (lastIndex < child.length) {
                  blockProcessed.push(child.substring(lastIndex));
                }

                // Process inline math for remaining string parts: $...$
                const finalProcessed: (string | JSX.Element)[] = [];
                blockProcessed.forEach((part, partIndex) => {
                  if (typeof part === 'string') {
                    const inlineRegex = /(?<!\$)\$([^\$\n]+?)\$(?!\$)/g; // $...$ but not $$...$$
                    let inlineLastIndex = 0;
                    let inlineMatch;
                    while ((inlineMatch = inlineRegex.exec(part)) !== null) {
                      if (inlineMatch.index > inlineLastIndex) {
                        finalProcessed.push(part.substring(inlineLastIndex, inlineMatch.index));
                      }
                      // Basic check to prevent rendering things like $5 or $something_
                      if (!/^\d+(\.\d+)?$/.test(inlineMatch[1]) && !/\s/.test(inlineMatch[1].trim())) {
                        finalProcessed.push(<InlineMath key={`inline-${childIndex}-${partIndex}-${inlineLastIndex}`} math={inlineMatch[1]} />);
                      } else {
                        finalProcessed.push(inlineMatch[0]); // Revert to original text if it looks like money or has spaces
                      }
                      inlineLastIndex = inlineRegex.lastIndex;
                    }
                    if (inlineLastIndex < part.length) {
                      finalProcessed.push(part.substring(inlineLastIndex));
                    }
                  } else {
                    finalProcessed.push(part); // Already a JSX element (BlockMath)
                  }
                });
                return finalProcessed;
              }
              return child;
            });
            return <p className="text-white/90 leading-relaxed mb-3 last:mb-0">{newChildren}</p>;
          },
          
          ul: ({ children, ...props }) => {
            const depth = (props as any)?.depth || 0;
            return (
              <ul className={`text-white/90 mb-3 last:mb-0 ${
                depth === 0 
                  ? 'list-disc list-outside ml-5 space-y-1' 
                  : 'list-disc list-outside ml-4 space-y-0.5 mt-1'
              }`}>
                {children}
              </ul>
            );
          },
          ol: ({ children, ...props }) => {
            const depth = (props as any)?.depth || 0;
            return (
              <ol className={`text-white/90 mb-3 last:mb-0 ${
                depth === 0 
                  ? 'list-decimal list-outside ml-5 space-y-1' 
                  : 'list-decimal list-outside ml-4 space-y-0.5 mt-1'
              }`}>
                {children}
              </ol>
            );
          },
          li: ({ children, ...props }) => (
            <li className="text-white/90 leading-relaxed pl-1">
              <div className="inline-block w-full">
                {children}
              </div>
            </li>
          ),
          
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/50 hover:decoration-blue-300 transition-colors"
            >
              {children}
            </a>
          ),
          
          strong: ({ children }) => (
            <strong className="font-bold text-white">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-white/95">
              {children}
            </em>
          ),
          
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-400/50 bg-gray-800/30 pl-4 py-2 my-3 italic text-white/80">
              {children}
            </blockquote>
          ),
          
          br: () => <br className="leading-relaxed" />,
          
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="w-full border-collapse border border-gray-700/50 bg-gray-800/20">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-800/50">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody>
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-gray-700/30">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="border border-gray-700/50 px-3 py-2 text-left font-semibold text-white">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-700/50 px-3 py-2 text-white/90">
              {children}
            </td>
          ),
          
          hr: () => (
            <hr className="border-gray-700/50 my-6" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
} 