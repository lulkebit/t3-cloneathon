'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { Copy, Check, Play, Loader2 as Loader } from 'lucide-react'; // Added Play, Loader
import { useState, Children, useEffect } from 'react'; // Added useEffect
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import MermaidDiagram from './MermaidDiagram';
import pyodideService from '@/lib/pyodideService'; // Import Pyodide Service
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
  const language = match ? match[1]?.toLowerCase() : '';
  const codeContent = String(children).replace(/\n$/, '');

  // Pyodide specific state
  const [isPyodideReady, setIsPyodideReady] = useState(!!pyodideService.instance);
  const [isPyodideLoading, setIsPyodideLoading] = useState(pyodideService.isLoading);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionOutput, setExecutionOutput] = useState<string[]>([]);
  const [executionError, setExecutionError] = useState<string[]>([]);

  const isPython = ['python', 'python3', 'py'].includes(language);

  // Effect to update local state based on the global pyodideService
  useEffect(() => {
    const updateStatus = () => {
      setIsPyodideReady(!!pyodideService.instance);
      setIsPyodideLoading(pyodideService.isLoading);
    };
    updateStatus(); // Initial check
    const intervalId = setInterval(updateStatus, 500); // Periodic check
    return () => clearInterval(intervalId);
  }, []);


  const handleRunPythonCodeInternal = async () => {
    setIsExecuting(true);
    setExecutionOutput([]);
    setExecutionError([]);

    const outputCollector: string[] = [];
    const errorCollector: string[] = [];

    const handleOutput = (msg: string) => {
      outputCollector.push(msg);
      setExecutionOutput(prev => [...prev, msg]); // More direct update
    };
    const handleError = (msg: string) => {
      errorCollector.push(msg);
      setExecutionError(prev => [...prev, msg]); // More direct update
    };

    try {
      if (!pyodideService.instance) {
        setIsPyodideLoading(true); // Indicate local loading state
        await pyodideService.initPyodide(handleOutput, handleError);
        setIsPyodideReady(true);
        setIsPyodideLoading(false);
      } else {
        // Ensure callbacks are fresh if instance already exists
        pyodideService.instance.setStdout({ batched: handleOutput });
        pyodideService.instance.setStderr({ batched: handleError });
      }

      await pyodideService.runPython(codeContent);
    } catch (e: any) {
      console.error("Python execution failed:", e);
      handleError(e.message || String(e));
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeContent);
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
    <div className="w-full block code-block-wrapper my-4">
      <div className="relative group border border-[var(--border-default)] rounded-lg overflow-hidden w-full bg-[var(--bg-element)]">
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-subtle)]">
          <span className="text-xs text-[var(--text-subtle)] font-medium">
            {language || 'code'}
          </span>
          <div className="flex items-center gap-2">
            {isPython && !inline && (
              <button
                onClick={handleRunPythonCodeInternal} // Use the internal handler
                disabled={isPyodideLoading || isExecuting}
                className="cursor-pointer flex items-center gap-1.5 px-2 py-1 text-xs text-[var(--text-subtle)] hover:text-[var(--text-default)] bg-[var(--glass-bg)] hover:bg-[var(--glass-hover-bg)] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPyodideLoading ? (
                  <Loader size={12} className="animate-spin" />
                ) : isExecuting ? (
                  <Loader size={12} className="animate-spin" />
                ) : (
                  <Play size={12} />
                )}
                {isPyodideLoading ? 'Loading Pyodide...' : isExecuting ? 'Running...' : 'Run Code'}
              </button>
            )}
            <button
              onClick={handleCopy}
              className="cursor-pointer flex items-center gap-1.5 px-2 py-1 text-xs text-[var(--text-subtle)] hover:text-[var(--text-default)] bg-[var(--glass-bg)] hover:bg-[var(--glass-hover-bg)] rounded transition-colors"
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
        </div>
        
        <pre className="overflow-x-auto m-0 p-4 w-full bg-[var(--hljs-bg)] text-[var(--hljs-text)]">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      </div>
      {(executionOutput.length > 0 || executionError.length > 0) && (
        <div className="mt-2 p-3 border border-[var(--border-default)] rounded-md bg-[var(--bg-subtle)] text-xs">
          {executionOutput.length > 0 && (
            <div className="output-section mb-2">
              <strong className="text-[var(--text-default)]">Output:</strong>
              <pre className="whitespace-pre-wrap text-[var(--text-subtle)] max-h-48 overflow-y-auto">{executionOutput.join('\n')}</pre>
            </div>
          )}
          {executionError.length > 0 && (
            <div className="error-section">
              <strong className="text-red-500">Error:</strong>
              <pre className="whitespace-pre-wrap text-red-400 max-h-48 overflow-y-auto">{executionError.join('\n')}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


export function MarkdownRenderer({ content, className = '', isUserMessage = false }: MarkdownRendererProps) {
  // Check if this is an error message
  const isErrorMessage = content.includes('❌ **Error**:');
  
  return (
    <div className={`markdown-content ${className} ${isUserMessage ? 'user-message' : 'assistant-message'} ${
      isErrorMessage ? 'error-message border-[var(--error-default)] bg-red-500/10 rounded-lg p-3' : '' // Themed error message
    }`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          code: function CodeBlockWrapper(props) {
            // Need to lift state or pass setters to the external handleRunPythonCode
            // Or, more React-idiomatically, define handleRunPythonCode inside CodeBlock
            // For now, let's assume CodeBlock itself contains the logic.
            // This wrapper is just to show where it plugs in.
            // The actual logic is now being moved into the CodeBlock component directly.
            // @ts-ignore
            return <CodeBlock {...props} />;
          },
          
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-[var(--text-default)] mb-4 mt-6 border-b border-[var(--border-subtle)] pb-2">
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