import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { newsletterSeo, applyNewsletterSeo } from '../newsletter/seo.mjs';

// Reuse Vite's built shell and hashed assets; do not prerender forms or private content.
const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
await mkdir(new URL('../dist/newsletter-seo/', import.meta.url), { recursive: true });
for (const seo of Object.values(newsletterSeo)) {
  const shell = applyNewsletterSeo(html, seo);
  if (!shell.includes(`href="${seo.canonical}"`) || !shell.includes(`content="${seo.robots}"`)) {
    throw new Error('Newsletter SEO shell is missing its canonical or robots tag');
  }
  await writeFile(new URL(`../dist/newsletter-seo/${seo.file}`, import.meta.url), shell);
}
console.log('Generated three newsletter HTML shells with route-specific canonical and robots tags.');
