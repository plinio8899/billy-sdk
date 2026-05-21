#!/usr/bin/env node

import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const command = args[0];

if (command === "config") {
  const subCommand = args[1];

  if (subCommand === "set") {
    const apiKey = args[2];
    if (!apiKey) {
      console.error("Usage: billy-agent config set <api-key>");
      console.error("Get your free API key at: https://console.groq.com/");
      process.exit(1);
    }

    const configPath = join(process.cwd(), "billy-agent.config.json");
    writeFileSync(configPath, JSON.stringify({ apiKey }, null, 2));
    console.log("✅ API key saved to billy-agent.config.json");
    console.log("   You can now use billy-agent without setting GROQ_API_KEY");
  } else if (subCommand === "show") {
    const configPath = join(process.cwd(), "billy-agent.config.json");
    if (existsSync(configPath)) {
      const config = JSON.parse(readFileSync(configPath, "utf-8"));
      if (config.apiKey) {
        console.log(`API Key: ${config.apiKey.substring(0, 10)}...`);
      }
    } else {
      console.log("No config found. Run: billy-agent config set <api-key>");
    }
  } else if (subCommand === "remove") {
    const configPath = join(process.cwd(), "billy-agent.config.json");
    if (existsSync(configPath)) {
      const config = JSON.parse(readFileSync(configPath, "utf-8"));
      delete config.apiKey;
      if (Object.keys(config).length === 0) {
        unlinkSync(configPath);
        console.log("✅ Config file removed");
      } else {
        writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log("✅ API key removed from config");
      }
    } else {
      console.log("No config found");
    }
  } else {
    console.log("Commands:");
    console.log("  billy-agent config set <api-key>  - Set your API key");
    console.log("  billy-agent config show           - Show current API key");
    console.log(
      "  billy-agent config remove         - Remove API key from config",
    );
  }
} else if (command === "init") {
  console.log(
    "Initialize billy-agent in your project: npm install billy-agent",
  );
} else {
  console.log("billy-agent - Simple AI for your projects");
  console.log("");
  console.log("Commands:");
  console.log("  billy-agent init      - Show install instructions");
  console.log("  billy-agent config   - Manage API key");
  console.log("");
  console.log("Get your free API key at: https://console.groq.com/");
}
