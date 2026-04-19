import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import type { UserRole } from "@/lib/auth-jwt";

type StoredUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash: string;
};

const USERS_FILE_PATH = path.join(process.cwd(), ".data", "users.json");

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const hashPassword = (password: string) =>
  crypto.createHash("sha256").update(password).digest("hex");

const ensureUsersFile = async () => {
  const directory = path.dirname(USERS_FILE_PATH);
  await fs.mkdir(directory, { recursive: true });

  try {
    await fs.access(USERS_FILE_PATH);
  } catch {
    await fs.writeFile(USERS_FILE_PATH, "[]", "utf8");
  }
};

const readUsers = async (): Promise<StoredUser[]> => {
  await ensureUsersFile();
  const content = await fs.readFile(USERS_FILE_PATH, "utf8");

  try {
    const parsed = JSON.parse(content) as StoredUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeUsers = async (users: StoredUser[]) => {
  await ensureUsersFile();
  await fs.writeFile(USERS_FILE_PATH, JSON.stringify(users, null, 2), "utf8");
};

const defaultAdmin = {
  id: "admin-local",
  name: process.env.ADMIN_NAME || "Admin",
  email: normalizeEmail(process.env.ADMIN_EMAIL || "admin@gotcardshop.com"),
  role: "admin" as const,
  passwordHash: hashPassword(process.env.ADMIN_PASSWORD || "admin123"),
};

export const createCustomer = async (input: {
  name: string;
  email: string;
  password: string;
}) => {
  const users = await readUsers();
  const email = normalizeEmail(input.email);

  if (users.some((user) => normalizeEmail(user.email) === email)) {
    return { ok: false as const, error: "Email is already registered." };
  }

  const user: StoredUser = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email,
    role: "customer",
    passwordHash: hashPassword(input.password),
  };

  users.push(user);
  await writeUsers(users);

  return { ok: true as const, user };
};

export const validateCredentials = async (input: {
  email: string;
  password: string;
}) => {
  const email = normalizeEmail(input.email);
  const passwordHash = hashPassword(input.password);

  if (
    email === defaultAdmin.email &&
    defaultAdmin.passwordHash === passwordHash
  ) {
    return { ok: true as const, user: defaultAdmin };
  }

  const users = await readUsers();
  const user = users.find(
    (entry) => normalizeEmail(entry.email) === email && entry.passwordHash === passwordHash,
  );

  if (!user) {
    return { ok: false as const, error: "Invalid email or password." };
  }

  return { ok: true as const, user };
};

export const toPublicUser = (user: StoredUser) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});
