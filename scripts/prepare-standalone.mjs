import { cp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const copyDirectory = async (source, destination) => {
  if (!existsSync(source)) {
    return;
  }

  await rm(destination, { force: true, recursive: true });
  await cp(source, destination, { recursive: true });
};

await copyDirectory(
  join(".next", "static"),
  join(".next", "standalone", ".next", "static"),
);

await copyDirectory("public", join(".next", "standalone", "public"));
