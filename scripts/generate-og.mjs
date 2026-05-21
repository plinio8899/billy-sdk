import sharp from "sharp";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const width = 1200;
const height = 630;

const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="100%" style="stop-color:#1e293b"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#3b82f6"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect x="0" y="0" width="6" height="${height}" fill="url(#accent)"/>
  <text x="60" y="180" font-family="system-ui, sans-serif" font-size="64" font-weight="700" fill="#f1f5f9">billy-agent</text>
  <text x="60" y="260" font-family="system-ui, sans-serif" font-size="28" fill="#94a3b8">Simple AI for your projects</text>
  <text x="60" y="350" font-family="system-ui, sans-serif" font-size="20" fill="#64748b">Generate \u2022 Modify \u2022 Validate \u2022 Analyze \u2022 Extract \u2022 Execute</text>
  <text x="60" y="430" font-family="system-ui, sans-serif" font-size="18" fill="#475569">Groq \u2022 OpenAI \u2022 Anthropic</text>
  <rect x="60" y="500" width="200" height="50" rx="8" fill="url(#accent)"/>
  <text x="160" y="533" font-family="system-ui, sans-serif" font-size="20" font-weight="600" fill="#fff" text-anchor="middle">npm install billy-agent</text>
  <text x="1060" y="580" font-family="system-ui, sans-serif" font-size="14" fill="#475569" text-anchor="end">plinio8899.github.io/billy-agent/</text>
</svg>`;

const input = Buffer.from(svg);

sharp(input)
  .resize(width, height)
  .png()
  .toFile(join(__dirname, "..", "docs", "public", "og-image.png"))
  .then(() => console.log("OG image created: docs/public/og-image.png"))
  .catch((err) => console.error("Error:", err));
