import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

function getKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('NEXTAUTH_SECRET is not set');
  // NEXTAUTH_SECRET から 256bit キーを導出
  return scryptSync(secret, 'hotelscope-apikey-salt', 32) as Buffer;
}

export function encryptApiKey(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12); // GCM: 96bit IV
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // iv(12) + tag(16) + ciphertext を base64 で結合
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptApiKey(encoded: string): string {
  const key = getKey();
  const buf = Buffer.from(encoded, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
