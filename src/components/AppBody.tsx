'use client';

import React, { useEffect } from 'react';
import { useLayout } from '@/contexts/LayoutContext';
import { Geist, Geist_Mono } from "next/font/google"; // Assuming these are needed for body className

// Re-declare or import font objects if they are not directly accessible
// For simplicity, if these are just for class names, we can pass them as props or define them here too.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

interface AppBodyProps {
  children: React.ReactNode;
}

const AppBody: React.FC<AppBodyProps> = ({ children }) => {
  const { customBackgroundImage } = useLayout();

  useEffect(() => {
    if (customBackgroundImage) {
      document.body.style.setProperty('--custom-background-image', `url("${customBackgroundImage}")`);
      document.body.classList.add('custom-background-enabled');
    } else {
      document.body.style.removeProperty('--custom-background-image');
      document.body.classList.remove('custom-background-enabled');
    }
    // Cleanup function to remove styles if component unmounts, though less critical for body
    return () => {
        document.body.style.removeProperty('--custom-background-image');
        document.body.classList.remove('custom-background-enabled');
    };
  }, [customBackgroundImage]);

  // Apply font classes here as they were on the body tag
  // Also keep min-h-screen and antialiased
  return (
    <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}>
      {children}
    </body>
  );
};

export default AppBody;
