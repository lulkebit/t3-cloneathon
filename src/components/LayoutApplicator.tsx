'use client';

import React, { useEffect, ReactNode } from 'react';
import { useLayout } from '@/contexts/LayoutContext';

interface LayoutApplicatorProps {
  children: ReactNode;
}

const LayoutApplicator: React.FC<LayoutApplicatorProps> = ({ children }) => {
  const { customBackgroundImage } = useLayout();

  useEffect(() => {
    if (customBackgroundImage) {
      document.body.style.setProperty('--custom-background-image', `url("${customBackgroundImage}")`);
      document.body.classList.add('custom-background-enabled');
    } else {
      // Ensure the variable is set to 'none' if no image, so it overrides previous image
      document.body.style.setProperty('--custom-background-image', 'none');
      document.body.classList.remove('custom-background-enabled');
    }
    // No cleanup needed for document.body style if it's managed this way,
    // as it should reflect the current state.
  }, [customBackgroundImage]);

  return <>{children}</>;
};

export default LayoutApplicator;
