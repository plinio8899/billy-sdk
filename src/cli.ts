#!/usr/bin/env node

import {
  getConfigPath,
  hasConfig,
  readApiKey,
  removeApiKey,
  saveApiKey,
} from "./config.js";

export function maskKey(key: string): string {
  if (key.length <= 8) return `${key.slice(0, 4)}****`;
  return `${key.slice(0, 4)}****${key.slice(-4)}`;
}

const args = process.argv.slice(2);
const command = args[0];

if (command === "config") {
  const subCommand = args[1];

  if (subCommand === "set") {
    const apiKey = args[2];
    if (!apiKey) {
      console.error("Usage: billy-sdk config set <api-key>");
      console.error("Get your free API key at: https://console.groq.com/");
      process.exit(1);
    }

    saveApiKey(apiKey);
    console.log(`✅ API key saved to ${getConfigPath()}`);
    console.log("⚠️  Stored in plain text. Use env vars for production.");
    console.log("   You can now use billy-sdk without setting GROQ_API_KEY");
  } else if (subCommand === "show") {
    const key = readApiKey();
    if (key) {
      console.log(`API Key: ${maskKey(key)}`);
    } else {
      console.log("No API key found.");
      console.log("Run: billy-sdk config set <api-key>");
    }
  } else if (subCommand === "remove") {
    if (hasConfig()) {
      removeApiKey();
      console.log(`✅ API key removed from ${getConfigPath()}`);
    } else {
      console.log("No API key found.");
    }
  } else {
    console.log("Commands:");
    console.log("  billy-sdk config set <api-key>  - Save API key");
    console.log("  billy-sdk config show           - Show masked key");
    console.log(
      "  billy-sdk config remove         - Remove API key from config",
    );
  }
} else if (command === "init") {
  console.log("Initialize billy-sdk in your project: npm install billy-sdk");
} else {
  console.log("billy-sdk - Simple AI for your projects");
  console.log("");
  console.log("Commands:");
  console.log("  billy-sdk init      - Show install instructions");
  console.log("  billy-sdk config   - Manage API key");
  console.log("");
  console.log("Get your free API key at: https://console.groq.com/");
}
