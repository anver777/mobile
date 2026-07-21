import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-static";

/**
 * Root page for the platform preview.
 *
 * The real site is a fully self-contained static app in `public/`
 * (HTML + CSS + Vanilla JavaScript, zero dependencies). This page
 * simply loads that HTML on the server and hands it to the browser
 * with a small script that rewrites the document so relative asset
 * paths (`./styles.css`, `./app.js`) resolve to `/styles.css` and
 * `/app.js`, which Next.js already serves from `public/`.
 */
export default function Page() {
  const htmlPath = path.join(process.cwd(), "public", "index.html");
  const raw = fs.readFileSync(htmlPath, "utf8");
  // Extract <body> contents and rewrite relative asset URLs.
  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyHtml = (bodyMatch ? bodyMatch[1] : raw)
    .replace(/(src|href)="\.\/(styles\.css|app\.js)"/g, '$1="/$2"');

  return (
    <>
      <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
      />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700;800;900&family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&display=swap"
      />
      <link rel="stylesheet" href="/styles.css" />
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      <script src="/app.js" defer />
    </>
  );
}
