const textEncoder = new TextEncoder();

export async function hashPassword(password: string, salt?: Uint8Array) {
  const actualSalt = salt || crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: actualSalt,
      iterations: 120000,
    },
    key,
    256
  );
  return {
    hash: bufferToBase64(new Uint8Array(bits)),
    salt: bufferToBase64(actualSalt),
  };
}

export async function verifyPassword(password: string, stored: string) {
  const [saltB64, hashB64] = stored.split(':');
  if (!saltB64 || !hashB64) return false;
  const salt = base64ToBuffer(saltB64);
  const { hash } = await hashPassword(password, salt);
  return hash === hashB64;
}

export function packPasswordHash(saltB64: string, hashB64: string) {
  return `${saltB64}:${hashB64}`;
}

function bufferToBase64(buffer: Uint8Array) {
  let binary = '';
  buffer.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function base64ToBuffer(base64: string) {
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer;
}
