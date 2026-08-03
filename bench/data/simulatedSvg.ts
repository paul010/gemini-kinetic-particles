interface PelicanPalette {
  sky: string;
  ground: string;
  bird: string;
  bill: string;
  bike: string;
  accent: string;
}

interface ButterflyPalette {
  background: string;
  upper: string;
  middle: string;
  lower: string;
  ink: string;
  spot: string;
}

interface SolarPalette {
  background: string;
  orbit: string;
  sunA: string;
  sunB: string;
  planets: string[];
}

const spokes = (cx: number, cy: number, r: number, color: string) =>
  Array.from({ length: 12 }, (_, index) => {
    const angle = (index / 12) * Math.PI * 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${color}" stroke-width="3" opacity=".55"/>`;
  }).join('');

export const makePelicanSvg = (id: string, palette: PelicanPalette, variant: number) => `<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="${id}-title ${id}-desc">
  <title id="${id}-title">Pelican riding a bicycle</title>
  <desc id="${id}-desc">A complete pelican pedals a mechanically connected bicycle.</desc>
  <defs>
    <linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${palette.sky}"/><stop offset="1" stop-color="#fff" stop-opacity=".72"/></linearGradient>
    <filter id="${id}-shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="12" stdDeviation="9" flood-color="#172033" flood-opacity=".18"/></filter>
  </defs>
  <rect width="800" height="600" rx="34" fill="url(#${id}-sky)"/>
  <path d="M0 493 C160 470 285 510 420 486 C575 458 666 486 800 470 V600 H0Z" fill="${palette.ground}" opacity=".72"/>
  <g fill="none" stroke-linecap="round" stroke-linejoin="round" filter="url(#${id}-shadow)">
    <g stroke="#26344d">
      <circle cx="235" cy="438" r="106" fill="#fff" fill-opacity=".28" stroke-width="14"/>
      <circle cx="565" cy="438" r="106" fill="#fff" fill-opacity=".28" stroke-width="14"/>
      ${spokes(235, 438, 96, '#26344d')}${spokes(565, 438, 96, '#26344d')}
    </g>
    <g stroke="${palette.bike}" stroke-width="15">
      <path d="M235 438 L335 318 L430 438 Z M335 318 L491 330 L565 438 L430 438 L335 318"/>
      <path d="M491 330 L522 278 L563 270 M320 305 L376 305"/>
      <path d="M430 438 L466 382"/>
    </g>
    <circle cx="430" cy="438" r="23" fill="${palette.accent}" stroke="#26344d" stroke-width="7"/>
    <path d="M430 438 L390 468 M430 438 L474 410" stroke="#26344d" stroke-width="8"/>
    <path d="M390 468 h-35 M474 410 h35" stroke="${palette.accent}" stroke-width="10"/>
  </g>
  <g stroke="#26344d" stroke-linecap="round" stroke-linejoin="round" filter="url(#${id}-shadow)">
    <ellipse cx="387" cy="260" rx="112" ry="91" fill="${palette.bird}" stroke-width="8" transform="rotate(${variant % 2 ? -5 : 4} 387 260)"/>
    <path d="M329 239 C290 190 300 115 363 96 C420 80 464 121 453 170 C443 210 406 229 376 230" fill="${palette.bird}" stroke-width="8"/>
    <path d="M343 128 C286 123 230 151 197 181 C236 205 296 207 358 174 C370 157 365 140 343 128Z" fill="${palette.bill}" stroke-width="8"/>
    <path d="M205 181 C249 230 317 224 353 177" fill="${palette.bill}" fill-opacity=".62" stroke-width="7"/>
    <circle cx="374" cy="123" r="12" fill="#fff" stroke-width="6"/><circle cx="378" cy="124" r="5" fill="#26344d" stroke="none"/>
    <path d="M352 247 C401 218 448 240 466 284 C418 309 371 299 340 271Z" fill="${palette.accent}" stroke-width="7"/>
    <path d="M323 285 C299 325 303 350 335 374" fill="none" stroke-width="16"/>
    <path d="M335 374 L376 305" fill="none" stroke-width="12"/>
    <path d="M450 286 C483 302 506 295 535 272" fill="none" stroke-width="15"/>
    <path d="M535 272 L563 270" fill="none" stroke-width="11"/>
    <path d="M383 332 L390 468 M429 328 L474 410" fill="none" stroke="${palette.bill}" stroke-width="13"/>
    <path d="M370 469 h-17 M493 410 h17" fill="none" stroke="${palette.bill}" stroke-width="9"/>
  </g>
  <g stroke="${palette.accent}" stroke-width="8" stroke-linecap="round" opacity=".7"><path d="M76 250 h92"/><path d="M54 284 h72"/><path d="M625 172 h84"/></g>
</svg>`;

export const makeButterflySvg = (id: string, palette: ButterflyPalette, variant: number) => `<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="${id}-title ${id}-desc">
  <title id="${id}-title">Mirrored gradient butterfly</title>
  <desc id="${id}-desc">A symmetric butterfly built from one reusable wing group.</desc>
  <defs>
    <linearGradient id="${id}-wing-gradient" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${palette.upper}"/><stop offset=".52" stop-color="${palette.middle}"/><stop offset="1" stop-color="${palette.lower}"/></linearGradient>
    <radialGradient id="${id}-spot"><stop stop-color="#fff"/><stop offset=".32" stop-color="${palette.spot}"/><stop offset="1" stop-color="${palette.ink}"/></radialGradient>
    <clipPath id="${id}-clip"><path d="M286 300 C248 ${122 + variant * 8} 149 67 72 118 C22 151 51 245 128 286 C168 307 224 314 286 300Z"/><path d="M286 314 C219 315 132 351 117 425 C106 483 170 507 220 466 C263 431 281 368 286 314Z"/></clipPath>
    <g id="${id}-left-wing">
      <path d="M286 300 C248 ${122 + variant * 8} 149 67 72 118 C22 151 51 245 128 286 C168 307 224 314 286 300Z" fill="url(#${id}-wing-gradient)" stroke="${palette.ink}" stroke-width="8"/>
      <path d="M286 314 C219 315 132 351 117 425 C106 483 170 507 220 466 C263 431 281 368 286 314Z" fill="url(#${id}-wing-gradient)" stroke="${palette.ink}" stroke-width="8"/>
      <g clip-path="url(#${id}-clip)" stroke-linecap="round">
        <path d="M275 285 C218 239 166 205 99 178 M270 316 C210 342 170 382 137 431" fill="none" stroke="#fff" stroke-opacity=".65" stroke-width="8"/>
        <circle cx="124" cy="218" r="37" fill="url(#${id}-spot)" stroke="#fff" stroke-width="5"/>
        <circle cx="190" cy="387" r="${18 + variant * 3}" fill="${palette.spot}" stroke="#fff" stroke-width="5"/>
        <path d="M89 270 C138 246 184 251 227 277" fill="none" stroke="${palette.spot}" stroke-width="12" stroke-dasharray="4 17"/>
      </g>
    </g>
  </defs>
  <rect width="600" height="600" rx="38" fill="${palette.background}"/>
  <use href="#${id}-left-wing"/><use href="#${id}-left-wing" transform="translate(600 0) scale(-1 1)"/>
  <g stroke="${palette.ink}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M292 182 C259 130 226 111 194 99 M308 182 C341 130 374 111 406 99" fill="none" stroke-width="8"/>
    <circle cx="191" cy="97" r="9" fill="${palette.spot}" stroke-width="5"/><circle cx="409" cy="97" r="9" fill="${palette.spot}" stroke-width="5"/>
    <circle cx="300" cy="211" r="34" fill="${palette.ink}" stroke-width="5"/>
    <path d="M300 240 C273 270 276 407 300 462 C324 407 327 270 300 240Z" fill="${palette.ink}" stroke-width="7"/>
    <path d="M282 290 H318 M280 337 H320 M286 384 H314 M291 425 H309" stroke="${palette.spot}" stroke-width="6"/>
  </g>
</svg>`;

export const makeSolarSvg = (id: string, palette: SolarPalette, speed: number) => {
  const radii = [92, 132, 176, 221, 282, 342, 401, 456];
  const sizes = [8, 12, 13, 10, 28, 24, 18, 17];
  const planets = radii.map((radius, index) => `<g class="${id}-planet ${id}-p${index}" style="--duration:${(speed + index * 4.7).toFixed(1)}s;--delay:-${(index * 2.3).toFixed(1)}s"><circle cx="${500 + radius}" cy="500" r="${sizes[index]}" fill="${palette.planets[index]}" stroke="#fff" stroke-opacity=".32" stroke-width="2"/>${index === 2 ? `<circle cx="${500 + radius + 21}" cy="500" r="4" fill="#dbeafe"/>` : ''}${index === 5 ? `<ellipse cx="${500 + radius}" cy="500" rx="36" ry="10" fill="none" stroke="#fde68a" stroke-width="5" transform="rotate(-18 ${500 + radius} 500)"/>` : ''}</g>`).join('');
  return `<svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="${id}-title ${id}-desc">
  <title id="${id}-title">Animated solar system</title><desc id="${id}-desc">Eight planets orbit a glowing central sun at different speeds.</desc>
  <defs><radialGradient id="${id}-sun"><stop stop-color="${palette.sunA}"/><stop offset=".66" stop-color="${palette.sunB}"/><stop offset="1" stop-color="${palette.sunB}" stop-opacity="0"/></radialGradient><pattern id="${id}-stars" width="76" height="63" patternUnits="userSpaceOnUse"><circle cx="9" cy="12" r="1.5" fill="#fff" opacity=".7"/><circle cx="51" cy="36" r="1" fill="#fff" opacity=".5"/></pattern></defs>
  <style>.${id}-planet{transform-box:view-box;transform-origin:500px 500px;animation:${id}-orbit var(--duration) linear infinite;animation-delay:var(--delay)}@keyframes ${id}-orbit{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.${id}-planet{animation-play-state:paused}}</style>
  <rect width="1000" height="1000" rx="42" fill="${palette.background}"/><rect width="1000" height="1000" fill="url(#${id}-stars)"/>
  <g fill="none" stroke="${palette.orbit}" stroke-opacity=".38" stroke-width="2">${radii.map((r) => `<ellipse cx="500" cy="500" rx="${r}" ry="${Math.round(r * .78)}"/>`).join('')}</g>
  <circle cx="500" cy="500" r="94" fill="url(#${id}-sun)"/><circle cx="500" cy="500" r="47" fill="${palette.sunA}"/>
  ${planets}
  <g transform="translate(714 726)"><rect width="236" height="216" rx="22" fill="#020617" fill-opacity=".72" stroke="#fff" stroke-opacity=".14"/>${palette.planets.map((color, i) => `<circle cx="24" cy="${27 + i * 23}" r="6" fill="${color}"/><path d="M40 ${27 + i * 23} h${78 + (i % 3) * 24}" stroke="#fff" stroke-opacity=".56" stroke-width="5" stroke-linecap="round"/>`).join('')}</g>
</svg>`;
};

export const SIMULATED_SVGS = {
  pelicanClaude: makePelicanSvg('pelican-claude', { sky: '#f5e6d2', ground: '#adc49a', bird: '#fff8e8', bill: '#e97654', bike: '#315b6d', accent: '#d86f52' }, 0),
  pelicanGpt: makePelicanSvg('pelican-gpt', { sky: '#dcecff', ground: '#b7d7ef', bird: '#f8fbff', bill: '#f5b84c', bike: '#155eef', accent: '#f97316' }, 1),
  pelicanGemini: makePelicanSvg('pelican-gemini', { sky: '#e7dcff', ground: '#b9e5d0', bird: '#fff7f2', bill: '#fb7185', bike: '#7c3aed', accent: '#0d9488' }, 2),
  pelicanGrok: makePelicanSvg('pelican-grok', { sky: '#d9d9d6', ground: '#b6b6b0', bird: '#f3f3ee', bill: '#d62f2f', bike: '#171717', accent: '#d62f2f' }, 3),
  butterflyClaude: makeButterflySvg('butterfly-claude', { background: '#f7ead8', upper: '#8a3f52', middle: '#d97757', lower: '#e9b872', ink: '#38292d', spot: '#f4d58d' }, 0),
  butterflyGpt: makeButterflySvg('butterfly-gpt', { background: '#e7f0ff', upper: '#1d4ed8', middle: '#06b6d4', lower: '#60a5fa', ink: '#172554', spot: '#fbbf24' }, 1),
  butterflyGemini: makeButterflySvg('butterfly-gemini', { background: '#f0e9ff', upper: '#6d28d9', middle: '#ec4899', lower: '#14b8a6', ink: '#2e1065', spot: '#fef08a' }, 2),
  solarClaude: makeSolarSvg('solar-claude', { background: '#111827', orbit: '#c4a46b', sunA: '#fde68a', sunB: '#f97316', planets: ['#9ca3af','#e5b77c','#60a5fa','#ef6f61','#d6a36e','#f3d19c','#67e8f9','#818cf8'] }, 10),
  solarGemini: makeSolarSvg('solar-gemini', { background: '#071a33', orbit: '#67e8f9', sunA: '#fff7b2', sunB: '#f59e0b', planets: ['#94a3b8','#fcd34d','#22d3ee','#fb7185','#f59e0b','#fde68a','#5eead4','#a78bfa'] }, 8),
  solarQwen: makeSolarSvg('solar-qwen', { background: '#15102b', orbit: '#d8b4fe', sunA: '#fef3c7', sunB: '#fb7185', planets: ['#cbd5e1','#f5d0a9','#38bdf8','#f87171','#fb923c','#facc15','#2dd4bf','#c084fc'] }, 12),
};
