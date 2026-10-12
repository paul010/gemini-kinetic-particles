/** Only the released signup page is indexable; previews retain their restrictions. */
export const newsletterSeo = {
  '/newsletter': { canonical: 'https://dailycosmos.net/newsletter', robots: 'index, follow', file: 'newsletter.html' },
  '/newsletter/demo': { canonical: 'https://dailycosmos.net/newsletter/demo', robots: 'noindex, nofollow', file: 'newsletter-demo.html' },
  '/newsletter/first-ai-card': { canonical: 'https://dailycosmos.net/newsletter/first-ai-card', robots: 'noindex, nofollow', file: 'newsletter-card.html' },
};

export function applyNewsletterSeo(html, seo) {
  return html
    .replace(/(<link\s+rel="canonical"\s+href=")[^"]*("\s*\/?>)/, `$1${seo.canonical}$2`)
    .replace(/(<meta\s+name="robots"\s+content=")[^"]*("\s*\/?>)/, `$1${seo.robots}$2`)
    .replace(/(<meta\s+property="og:url"\s+content=")[^"]*("\s*\/?>)/, `$1${seo.canonical}$2`);
}
