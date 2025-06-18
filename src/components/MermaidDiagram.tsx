'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
  id?: string; // Optional explicit ID
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart, id }) => {
  const diagramRef = useRef<HTMLDivElement>(null);
  // Use a state for the unique ID to ensure it's stable across re-renders after mount
  const [diagramId, setDiagramId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Generate unique ID on client-side after mount
    setDiagramId(id || `mermaid-diagram-${Math.random().toString(36).substring(2, 15)}`);
  }, [id]);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark', // Or 'default', 'neutral', 'forest' - 'dark' often fits well
      securityLevel: 'loose', // 'strict', 'loose', 'antiscript'
      // Other configurations if needed
      // darkMode: true, // if using a theme that supports it or for explicit dark mode
      darkMode: document.documentElement.classList.contains('dark'), // Auto-detect based on html class
      themeVariables: {
        background: '#202020', // Example: Dark background for the diagram
        mainBkg: '#202020',
        primaryColor: '#2D3748', // Darker elements
        primaryTextColor: '#FFFFFF', // White text
        lineColor: '#A0AEC0', // Lighter lines for contrast
        secondaryColor: '#4A5568', // Slightly lighter elements
        tertiaryColor: '#2D3748',
        // Ensure these are set if your global CSS might interfere
        fontFamily: '"Inter", sans-serif', // Match your app's font
      }
    });
  }, []);

  useEffect(() => {
    if (diagramRef.current && chart && diagramId) {
      // Clear previous diagram before rendering a new one
      diagramRef.current.innerHTML = '';
      setError(null);
      try {
        // mermaid.render expects the ID of the element where it will render the SVG
        mermaid.render(diagramId, chart, (svgCode, bindFunctions) => {
          if (diagramRef.current) {
            diagramRef.current.innerHTML = svgCode;
            if (bindFunctions) {
              bindFunctions(diagramRef.current);
            }
          }
        });
      } catch (e: any) {
        console.error('Mermaid rendering error:', e);
        setError(e.message || 'Failed to render diagram. Check console for details.');
        if (diagramRef.current) {
            diagramRef.current.innerHTML = `<pre class="text-red-400 p-2 bg-neutral-800 rounded">Error: ${e.message}</pre>`;
        }
      }
    } else if (diagramRef.current && !chart) {
        diagramRef.current.innerHTML = ''; // Clear if chart is empty
        setError(null);
    }
  }, [chart, diagramId]); // Rerun when chart or diagramId changes

  if (error) {
    // This error display is inside the ref, but we can also render a fallback here
    // return <div ref={diagramRef} className="mermaid-container p-2 bg-neutral-800 rounded text-red-400">{`Error rendering: ${error}`}</div>;
  }

  // The div that mermaid.render targets must NOT be the same as diagramRef if you want to call mermaid.render directly.
  // mermaid.render creates a new SVG and gives you the code. You then put that code into your div.
  // So, diagramRef is the container for the SVG.
  return (
    <div className="mermaid-container flex justify-center items-center w-full my-4 p-4 bg-neutral-800/30 rounded-lg border border-neutral-700/50 overflow-x-auto">
       {/* This div will be populated with the SVG by the useEffect hook */}
      <div ref={diagramRef} id={diagramId || undefined} className="mermaid-diagram-content flex justify-center">
        {/* Content is set by innerHTML */}
      </div>
    </div>
  );
};

export default MermaidDiagram;
