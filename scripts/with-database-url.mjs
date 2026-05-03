import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const [, , command, ...args] = process.argv;

if (!command) {
  console.error("Usage: node scripts/with-database-url.mjs <command> [...args]");
  process.exit(1);
}

const env = { ...process.env };

if (!env.DATABASE_URL?.trim() && env.MYSQL_URL?.trim()) {
  env.DATABASE_URL = env.MYSQL_URL;
}

if (!env.DATABASE_URL?.trim()) {
  console.error(
    "DATABASE_URL is empty. Set it in Railway to your MySQL connection string, for example ${{MySQL.MYSQL_URL}}.",
  );
  process.exit(1);
}

const resolveCommand = (name) => {
  const extension = process.platform === "win32" ? ".cmd" : "";
  const localBinary = join(process.cwd(), "node_modules", ".bin", `${name}${extension}`);

  return existsSync(localBinary) ? localBinary : name;
};

const child = spawn(resolveCommand(command), args, {
  env,
  shell: false,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
