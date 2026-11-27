import type { APIRoute } from "astro";
import { PROJECTS } from "@/data/projects";

// Built from the page list, so new project pages are listed automatically.
const SITE = "https://diorhc.github.io/diorhc/";

export const GET: APIRoute = () => {
  const lastmod = new Date().toISOString().slice(0, 10);
  const paths = ["", ...PROJECTS.map((p) => `projects/${p.id}/`)];

  const urls = paths.flatMap((path) => {
    const ru = `${SITE}${path}`;
    const en = `${SITE}en/${path}`;
    const alternates = [
      `    <xhtml:link rel="alternate" hreflang="ru" href="${ru}"/>`,
      `    <xhtml:link rel="alternate" hreflang="en" href="${en}"/>`,
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${ru}"/>`,
    ].join("\n");
    const priority = path === "" ? "1.0" : "0.8";
    return [ru, en].map(
      (loc) =>
        `  <url>\n    <loc>${loc}</loc>\n${alternates}\n    <lastmod>${lastmod}</lastmod>\n    <priority>${priority}</priority>\n  </url>`
    );
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>
`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
