#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");

const gitRepoCheck = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], {
  cwd: repoRoot,
  stdio: "ignore",
});

if (gitRepoCheck.status !== 0) {
  console.warn("[hooks] Skipping hook setup: not inside a Git working tree.");
  process.exit(0);
}

const configureHooks = spawnSync("git", ["config", "core.hooksPath", ".githooks"], {
  cwd: repoRoot,
  stdio: "inherit",
});

if (configureHooks.status !== 0) {
  process.exit(configureHooks.status ?? 1);
}

console.log("[hooks] Configured core.hooksPath to .githooks");
