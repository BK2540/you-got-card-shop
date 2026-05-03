import crypto from "crypto";
import type { UserRole } from "@/lib/auth-jwt";
import { prisma } from "@/lib/prisma";

type StoredUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole | string;
  passwordHash: string;
};

const PBKDF2_PREFIX = "pbkdf2";
const PBKDF2_ITERATIONS = 210_000;
const PBKDF2_KEY_LENGTH = 32;
const PBKDF2_DIGEST = "sha256";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const hashLegacyPassword = (password: string) =>
  crypto.createHash("sha256").update(password).digest("hex");

const hashPassword = (password: string) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(
      password,
      salt,
      PBKDF2_ITERATIONS,
      PBKDF2_KEY_LENGTH,
      PBKDF2_DIGEST,
    )
    .toString("hex");

  return `${PBKDF2_PREFIX}$${PBKDF2_ITERATIONS}$${salt}$${hash}`;
};

const safeEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const verifyPassword = (password: string, storedHash: string) => {
  if (!storedHash.startsWith(`${PBKDF2_PREFIX}$`)) {
    const isValid = safeEqual(hashLegacyPassword(password), storedHash);
    return {
      isValid,
      upgradedHash: isValid ? hashPassword(password) : null,
    };
  }

  const [, iterationsRaw, salt, expectedHash] = storedHash.split("$");
  const iterations = Number(iterationsRaw);

  if (
    !Number.isFinite(iterations) ||
    iterations <= 0 ||
    !salt ||
    !expectedHash
  ) {
    return { isValid: false, upgradedHash: null };
  }

  const hash = crypto
    .pbkdf2Sync(password, salt, iterations, PBKDF2_KEY_LENGTH, PBKDF2_DIGEST)
    .toString("hex");

  return {
    isValid: safeEqual(hash, expectedHash),
    upgradedHash: null,
  };
};

const getAdminCredentials = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Admin";

  if (!email || !password) {
    if (isProduction) {
      throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in production.");
    }

    return {
      id: "admin-local",
      name,
      email: normalizeEmail("admin@gotcardshop.com"),
      role: "admin" as const,
      password: "admin123",
    };
  }

  return {
    id: "admin-local",
    name,
    email: normalizeEmail(email),
    role: "admin" as const,
    password,
  };
};

export const createCustomer = async (input: {
  name: string;
  email: string;
  password: string;
}) => {
  const email = normalizeEmail(input.email);

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return { ok: false as const, error: "Email is already registered." };
  }

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        name: input.name.trim(),
        email,
        role: "customer",
        passwordHash: hashPassword(input.password),
      },
    });

    await tx.customer.upsert({
      where: { email },
      update: { name: input.name.trim() },
      create: { email, name: input.name.trim() },
    });

    return createdUser;
  });

  return { ok: true as const, user };
};

export const validateCredentials = async (input: {
  email: string;
  password: string;
}) => {
  const email = normalizeEmail(input.email);
  const admin = getAdminCredentials();

  if (email === admin.email && safeEqual(input.password, admin.password)) {
    return {
      ok: true as const,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        passwordHash: "",
      },
    };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { ok: false as const, error: "Invalid email or password." };
  }

  const { isValid, upgradedHash } = verifyPassword(input.password, user.passwordHash);
  if (!isValid) {
    return { ok: false as const, error: "Invalid email or password." };
  }

  if (upgradedHash) {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: upgradedHash },
    });
  }

  return {
    ok: true as const,
    user: {
      ...user,
      role: user.role as UserRole,
    },
  };
};

export const toPublicUser = (user: StoredUser) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role === "admin" ? "admin" : "customer" as UserRole,
});
