import React, { createContext, useContext } from 'react';
import { useVoiceChannel } from '../hooks/useVoiceChannel';

type VoiceContextValue = ReturnType<typeof useVoiceChannel>;

const VoiceContext = createContext<VoiceContextValue | null>(null);

/**
 * Mount once at AppLayout level — exposes voice controls to the entire app
 */
export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useVoiceChannel();
  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
};

export const useVoice = (): VoiceContextValue => {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error('useVoice must be used inside <VoiceProvider>');
  return ctx;
};
