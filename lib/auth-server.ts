import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import { verifyAuthToken } from "@/lib/auth-jwt";

const getCookieValue = (cookieHeader: string, name: string) => {
  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!match) {
    return "";
  }

  return decodeURIComponent(match.slice(name.length + 1));
};

export const getAuthFromRequest = (req: Request) => {
  const cookieHeader = req.headers.get("cookie") || "";
  const token = getCookieValue(cookieHeader, AUTH_COOKIE_NAME);
  if (!token) {
    return null;
  }

  return verifyAuthToken(token);
};
