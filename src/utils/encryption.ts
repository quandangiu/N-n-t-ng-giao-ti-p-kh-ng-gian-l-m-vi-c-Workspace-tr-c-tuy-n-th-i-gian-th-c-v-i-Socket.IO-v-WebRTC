import CryptoJS from 'crypto-js';

// Cache key trong memory (session only, không lưu localStorage)
const keyCache = new Map<string, string>();

export const cacheChannelKey = (channelId: string, key: string): void => {
  keyCache.set(channelId, key);
};

export const getChannelKey = (channelId: string): string | undefined => {
  return keyCache.get(channelId);
};

export const clearChannelKey = (channelId: string): void => {
  keyCache.delete(channelId);
};

export const encryptMsg = (text: string, key: string): string => {
  return CryptoJS.AES.encrypt(text, key).toString();
};

export const decryptMsg = (cipher: string, key: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, key);
    const result = bytes.toString(CryptoJS.enc.Utf8);
    return result || '[Không thể giải mã]';
  } catch {
    return '[Không thể giải mã]';
  }
};
