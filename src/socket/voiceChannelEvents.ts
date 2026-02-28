// voiceChannelEvents.ts
// NOTE: voice_channel_updated is handled directly inside useVoiceChannel hook
// to avoid double-registration and stale closure issues.
// This file is intentionally a no-op but kept for import compatibility.
export const registerVoiceChannelEvents = (): (() => void) => {
  return () => {};
};
