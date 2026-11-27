import { defineConfig, fontProviders } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

// Fonts are downloaded at build time and served from the site itself:
// no render-blocking request to Google, only the weights and subsets in use.
const google = fontProviders.google();

export default defineConfig({
  site: "https://diorhc.github.io",
  base: "/diorhc",
  output: "static",
  integrations: [react()],
  fonts: [
    {
      name: "Inter",
      cssVariable: "--font-inter",
      provider: google,
      weights: [400, 500, 600, 700],
      styles: ["normal"],
      subsets: ["latin", "cyrillic"],
      fallbacks: ["Segoe UI", "system-ui", "sans-serif"],
    },
    {
      name: "Space Grotesk",
      cssVariable: "--font-space-grotesk",
      provider: google,
      weights: [500, 600, 700],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["Inter", "system-ui", "sans-serif"],
    },
    {
      name: "JetBrains Mono",
      cssVariable: "--font-jetbrains-mono",
      provider: google,
      weights: [400, 500, 600, 700],
      styles: ["normal"],
      subsets: ["latin", "cyrillic"],
      fallbacks: ["ui-monospace", "monospace"],
    },
    {
      name: "Doto",
      cssVariable: "--font-doto",
      provider: google,
      weights: [600, 700],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["ui-monospace", "monospace"],
    },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
