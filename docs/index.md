---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "billy-agent"
  text: "Simple AI for your projects"
  tagline: Generate, modify, validate, analyze, extract, and execute with natural language prompts
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/plinio8899/billy-agent

features:
  - title: Multi-Provider
    details: Supports Groq (default), OpenAI, and Anthropic. No vendor lock-in.
    link: /providers
  - title: Type Conversion
    details: Automatic parsing of responses to numbers, arrays, objects, booleans, or JSON.
    link: /types
  - title: CLI Ready
    details: Manage your API key with simple CLI commands — no environment variable hassle.
    link: /cli
  - title: Variable Injection
    details: Use {{placeholders}} in prompts with dynamic data from your code.
    link: /variables
  - title: Method Chaining
    details: Fluent API style — IA.asNumber().short().create("prompt").
    link: /chaining
  - title: Retry & Timeout
    details: Built-in retry logic and configurable timeout for production reliability.
    link: /configuration
---
