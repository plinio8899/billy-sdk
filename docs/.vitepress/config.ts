import { defineConfig } from "vitepress";

export default defineConfig({
  title: "billy-agent",
  description:
    "Simple AI for your projects - generate, modify, validate, analyze, extract, and execute with natural language prompts",
  base: "/billy-agent/",
  themeConfig: {
    nav: [
      { text: "Home", link: "/" },
      { text: "Guides", link: "/getting-started" },
      { text: "GitHub", link: "https://github.com/plinio8899/billy-agent" },
    ],
    sidebar: [
      {
        text: "Getting Started",
        items: [
          { text: "Installation", link: "/getting-started" },
          { text: "Configuration", link: "/configuration" },
          { text: "Providers", link: "/providers" },
        ],
      },
      {
        text: "API Reference",
        items: [
          { text: "Methods", link: "/methods" },
          { text: "Type Conversion", link: "/types" },
          { text: "Variables", link: "/variables" },
          { text: "Chaining", link: "/chaining" },
        ],
      },
      {
        text: "CLI",
        items: [{ text: "Commands", link: "/cli" }],
      },
      {
        text: "Use Cases",
        link: "/use-cases",
      },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/plinio8899/billy-agent" },
    ],
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright 2026 Plinio",
    },
  },
});
