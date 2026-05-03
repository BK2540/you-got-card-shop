import crypto from "crypto";

export type UserRole = "admin" | "customer";

export type AuthTokenPayload = {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  exp: number;
};

const DEFAULT_SECRET = "dev-only-change-me";
const ONE_DAY_SECONDS = 60 * 60 * 24;

const base64UrlEncode = (value: string) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const base64UrlDecode = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
};

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production.");
  }

  return DEFAULT_SECRET;
};

const toBuffer = (value: string) => Buffer.from(value, "utf8");

const safeEqual = (left: string, right: string) => {
  const leftBuffer = toBuffer(left);
  const rightBuffer = toBuffer(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

export const signAuthToken = (
  payload: Omit<AuthTokenPayload, "exp">,
  expiresInSeconds = ONE_DAY_SECONDS,
) => {
  const header = { alg: "HS256", typ: "JWT" };
  const body: AuthTokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedBody = base64UrlEncode(JSON.stringify(body));
  const unsigned = `${encodedHeader}.${encodedBody}`;

  const signature = crypto
    .createHmac("sha256", getJwtSecret())
    .update(unsigned)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${unsigned}.${signature}`;
};

export const verifyAuthToken = (token: string): AuthTokenPayload | null => {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [header, payload, signature] = parts;
  const unsigned = `${header}.${payload}`;

  const expectedSignature = crypto
    .createHmac("sha256", getJwtSecret())
    .update(unsigned)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  if (!safeEqual(expectedSignature, signature)) {
    return null;
  }

  try {
    const decoded = JSON.parse(base64UrlDecode(payload)) as AuthTokenPayload;
    if (!decoded.exp || decoded.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
};
