'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ChatStyle = 'bubbles' | 'classic';

interface LayoutContextType {
  chatStyle: ChatStyle;
  setChatStyle: (style: ChatStyle) => void;
  customBackgroundImage: string | null;
  setCustomBackgroundImage: (imageUrl: string | null) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider = ({ children }: { children: ReactNode }) => {
  const [chatStyle, setChatStyleState] = useState<ChatStyle>('bubbles');
  const [customBackgroundImage, setCustomBackgroundImageState] = useState<string | null>(null);

  useEffect(() => {
    const storedStyle = localStorage.getItem('app-chat-style') as ChatStyle | null;
    if (storedStyle) {
      setChatStyleState(storedStyle);
    }

    const storedBgImage = localStorage.getItem('app-custom-bg-image');
    if (storedBgImage) {
      setCustomBackgroundImageState(storedBgImage);
    }
  }, []);

  const setChatStyle = (newStyle: ChatStyle) => {
    setChatStyleState(newStyle);
    localStorage.setItem('app-chat-style', newStyle);
  };

  const setCustomBackgroundImage = (imageUrl: string | null) => {
    setCustomBackgroundImageState(imageUrl);
    if (imageUrl) {
      localStorage.setItem('app-custom-bg-image', imageUrl);
    } else {
      localStorage.removeItem('app-custom-bg-image');
    }
  };

  return (
    <LayoutContext.Provider value={{ chatStyle, setChatStyle, customBackgroundImage, setCustomBackgroundImage }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = (): LayoutContextType => {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};
