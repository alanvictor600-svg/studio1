
'use client';

import React, { ReactNode, useMemo } from 'react';
import { initializeFirebase } from '@/firebase';
import { Providers } from '@/components/providers'; // Ensure Providers is imported if it wraps children

// This component's only job is to run the initializeFirebase function once.
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  // useMemo ensures this is only called once per component lifecycle.
  useMemo(() => {
    initializeFirebase();
  }, []);

  return <>{children}</>;
}
