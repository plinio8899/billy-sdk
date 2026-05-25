import { defineConfig } from "vitepress";

export default defineConfig({
  title: "billy-sdk",
  description:
    "Simple AI SDK for Node.js — generate, modify, validate, analyze, extract, and execute with natural language prompts",
  base: "/billy-sdk/",
  head: [
    ["meta", { property: "og:title", content: "billy-sdk" }],
    [
      "meta",
      {
        property: "og:description",
        content:
          "Simple AI SDK for Node.js — generate, modify, validate, analyze, extract, and execute with natural language prompts",
      },
    ],
    [
      "meta",
      { property: "og:image", content: "/billy-sdk/og-image.png" },
    ],
    ["meta", { property: "og:url", content: "https://plinio8899.github.io/billy-sdk/" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "twitter:title", content: "billy-sdk" }],
    [
      "meta",
      {
        name: "twitter:description",
        content:
          "Simple AI SDK for Node.js — generate, modify, validate, analyze, extract, and execute with natural language prompts",
      },
    ],
    [
      "meta",
      { name: "twitter:image", content: "/billy-sdk/og-image.png" },
    ],
  ],
  themeConfig: {
    nav: [
      { text: "Home", link: "/" },
      { text: "Guides", link: "/getting-started" },
      { text: "GitHub", link: "https://github.com/plinio8899/billy-sdk" },
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
          { text: "File & Image Handling", link: "/files" },
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
      { icon: "github", link: "https://github.com/plinio8899/billy-sdk" },
    ],
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright 2026 Plinio",
    },
  },
});
