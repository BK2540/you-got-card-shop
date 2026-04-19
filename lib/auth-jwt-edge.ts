import type { AuthTokenPayload } from "@/lib/auth-jwt";

const DEFAULT_SECRET = "dev-only-change-me";

const base64UrlToUint8Array = (value: string) => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
};

const base64UrlDecodeToString = (value: string) => {
  const bytes = base64UrlToUint8Array(value);
  return new TextDecoder().decode(bytes);
};

const timingSafeEqual = (a: Uint8Array, b: Uint8Array) => {
  if (a.length !== b.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
};

export const verifyAuthTokenEdge = async (token: string) => {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [header, payload, signature] = parts;
  const unsigned = `${header}.${payload}`;

  const secret = process.env.JWT_SECRET || DEFAULT_SECRET;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const expectedSignatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(unsigned),
  );

  const expectedBytes = new Uint8Array(expectedSignatureBuffer);
  const actualBytes = base64UrlToUint8Array(signature);

  if (!timingSafeEqual(expectedBytes, actualBytes)) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      base64UrlDecodeToString(payload),
    ) as AuthTokenPayload;
    if (!decoded.exp || decoded.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
};
