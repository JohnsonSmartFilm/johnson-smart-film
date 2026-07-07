/* ============================================================
JOHNSON SMART FILM — Product Catalog Configurator
Powers products.html only
============================================================ */
document.addEventListener('DOMContentLoaded', () => {

const WHATSAPP_NUMBER = '201114171416';

const CATALOG = {
products: [
{
id: 'ppf-gloss',
name: 'Johnson PPF — Gloss Finish',
sku: 'GLOSS FINISH',
ribbon: 'Made in USA',
tagline: 'Invisible armor, factory shine.',
desc: 'A crystal-clear TPU shield that guards every panel from rock chips, scratches, and chemical stains — without dulling the paint\u2019s original gloss.',
image: '/listing_main_2024_jetour_t2_UAE-2.webp',
specs: [
{ icon: 'fa-layer-group', label: 'Total Thickness', value: '7.5 mil (190\u03bc)' },
{ icon: 'fa-shield-halved', label: 'TPU Thickness', value: '6 mil' },
{ icon: 'fa-wand-magic-sparkles', label: 'Self-Healing Coat', value: '15 \u03bcm' },
{ icon: 'fa-certificate', label: 'Warranty', value: '10 Years' }
],
tags: ['SELF-HEALING', 'GLOSS FINISH', '10 YR WARRANTY']
},
{
id: 'ppf-matte',
name: 'Johnson PPF — Matte Finish',
sku: 'MATTE FINISH',
ribbon: 'Made in USA',
tagline: 'Stealth look, same steel-strong protection.',
desc: 'The same self-healing TPU core in a satin matte finish — for owners who want a modern, blacked-out look with zero compromise on protection.',
image: '/pexels-pho-tomass-883344227-32364025.webp',
specs: [
{ icon: 'fa-layer-group', label: 'Total Thickness', value: '7.5 mil (190\u03bc)' },
{ icon: 'fa-shield-halved', label: 'TPU Thickness', value: '6 mil' },
{ icon: 'fa-wand-magic-sparkles', label: 'Self-Healing Coat', value: '15 \u03bcm' },
{ icon: 'fa-certificate', label: 'Warranty', value: '10 Years' }
],
tags: ['SELF-HEALING', 'MATTE FINISH', '10 YR WARRANTY']
},
{
id: 'window-jsn70',
name: 'Johnson Window Film — JSN 70',
sku: 'JSN 70',
ribbon: 'Made in USA',
tagline: 'Maximum light, maximum heat rejection.',
desc: 'A near-invisible nano-ceramic film for owners who want daylight clarity and cabin comfort in one — with no metal layer to interfere with signals.',
image: '/Luxury-Car-PNG-Free-File-Download.webp',
specs: [
{ icon: 'fa-eye', label: 'VLT', value: '71%' },
{ icon: 'fa-sun', label: 'IR Rejection', value: '85%' },
{ icon: 'fa-umbrella-beach', label: 'UV Rejection', value: '100%' },
{ icon: 'fa-certificate', label: 'Warranty', value: '10 Years' }
],
tags: ['71% VLT', 'NON-METALLIZED', 'SIGNAL SAFE']
},
{
id: 'window-jsn45',
name: 'Johnson Window Film — JSN 45',
sku: 'JSN 45',
ribbon: 'Made in USA',
tagline: 'Balanced tone, serious heat control.',
desc: 'The everyday sweet spot: a medium tint that cuts glare and cabin heat while keeping visibility comfortable for daily driving.',
image: '/bmw-7739554_1280.webp',
specs: [
{ icon: 'fa-eye', label: 'VLT', value: '45%' },
{ icon: 'fa-sun', label: 'IR Rejection', value: '85%' },
{ icon: 'fa-umbrella-beach', label: 'UV Rejection', value: '100%' },
{ icon: 'fa-certificate', label: 'Warranty', value: '10 Years' }
],
tags: ['45% VLT', 'GLARE CONTROL', '10 YR WARRANTY']
},
{
id: 'window-jsn35',
name: 'Johnson Window Film — JSN 35',
sku: 'JSN 35',
ribbon: 'Made in USA',
tagline: 'Deep tone privacy without losing the road.',
desc: 'A darker, richer tone for maximum privacy and a striking exterior look, still backed by full UV and heat rejection.',
image: '/bmw_PNG99543.webp',
specs: [
{ icon: 'fa-eye', label: 'VLT', value: '35%' },
{ icon: 'fa-sun', label: 'IR Rejection', value: '85%' },
{ icon: 'fa-umbrella-beach', label: 'UV Rejection', value: '100%' },
{ icon: 'fa-certificate', label: 'Warranty', value: '10 Years' }
],
tags: ['35% VLT', 'HIGH PRIVACY', '10 YR WARRANTY']
},
{
id: 'safety-film',
name: 'Johnson Safety Film — 4 MIL',
sku: '4 MIL',
ribbon: 'Made in USA',
tagline: 'Glass that holds together, even when it shouldn\u2019t.',
desc: 'A clear structural film that binds shattered glass in place on impact — reducing injury risk and keeping the cabin secure.',
image: '/R.webp',
specs: [
{ icon: 'fa-layer-group', label: 'Thickness', value: '4 mil' },
{ icon: 'fa-umbrella-beach', label: 'UV Rejection', value: '95%' },
{ icon: 'fa-shield-halved', label: 'Impact', value: 'Shatter Resistant' },
{ icon: 'fa-certificate', label: 'Grade', value: 'Enhanced Safety' }
],
tags: ['SHATTER RESISTANT', '4 MIL', 'SAFETY GRADE']
}
],
services: [
{
id: 'svc-ppf',
name: 'Paint Protection Film',
sku: 'SERVICE 01',
icon: 'fa-car',
tagline: 'Full-body armor, professionally installed.',
desc: 'Self-healing transparent TPU films protect your car\u2019s paint from scratches, rock chips, and chemical contaminants while preserving its original shine.',
specs: [
{ icon: 'fa-wand-magic-sparkles', label: 'Feature', value: 'Self-Healing' },
{ icon: 'fa-certificate', label: 'Warranty', value: '10 Years' },
{ icon: 'fa-umbrella-beach', label: 'Protection', value: 'UV Proof' },
{ icon: 'fa-user-check', label: 'Install', value: 'By Certified Techs' }
],
tags: ['SELF-HEALING', '10 YR WARRANTY', 'UV PROOF']
},
{
id: 'svc-tint',
name: 'Nano Ceramic Tinting',
sku: 'SERVICE 02',
icon: 'fa-solar-panel',
tagline: 'Cooler cabin, clearer view.',
desc: 'Advanced thermal insulation that blocks 99% of UV rays with superior optical clarity and complete privacy at all times.',
specs: [
{ icon: 'fa-umbrella-beach', label: 'UV Block', value: '99%' },
{ icon: 'fa-atom', label: 'Technology', value: 'Nano Ceramic' },
{ icon: 'fa-temperature-low', label: 'Heat', value: 'Rejected' },
{ icon: 'fa-user-check', label: 'Install', value: 'By Certified Techs' }
],
tags: ['99% UV BLOCK', 'NANO CERAMIC', 'HEAT REJECT']
},
{
id: 'svc-ceramic',
name: 'Ceramic Coating',
sku: 'SERVICE 03',
icon: 'fa-gem',
tagline: 'Molecular shine that lasts years, not months.',
desc: 'A nano ceramic layer that bonds to the paint at a molecular level, providing 5-10 years of protection with an exceptional, unmatched shine.',
specs: [
{ icon: 'fa-atom', label: 'Base', value: 'Graphene' },
{ icon: 'fa-tint', label: 'Surface', value: 'Hydrophobic' },
{ icon: 'fa-hourglass-half', label: 'Lasts', value: '5–10 Years' },
{ icon: 'fa-user-check', label: 'Install', value: 'By Certified Techs' }
],
tags: ['GRAPHENE', 'HYDROPHOBIC', '5–10 YEARS']
},
{
id: 'svc-smart',
name: 'Smart Film',
sku: 'SERVICE 04',
icon: 'fa-bolt',
tagline: 'Clear or private, at the touch of a switch.',
desc: 'Interactive PDLC smart glass switches from clear to opaque at the touch of a button. Perfect for offices, villas, and storefronts.',
specs: [
{ icon: 'fa-toggle-on', label: 'Type', value: 'Smart PDLC' },
{ icon: 'fa-user-shield', label: 'Use Case', value: 'Privacy on Demand' },
{ icon: 'fa-leaf', label: 'Efficiency', value: 'Energy Saving' },
{ icon: 'fa-building', label: 'Best For', value: 'Offices & Villas' }
],
tags: ['SMART PDLC', 'PRIVACY', 'ENERGY SAVING']
},
{
id: 'svc-detailing',
name: 'Premium Detailing',
sku: 'SERVICE 05',
icon: 'fa-spray-can',
tagline: 'Showroom finish, inside and out.',
desc: 'Deep cleaning and polishing that restores your car\u2019s original shine, inside and out, using specialized German products.',
specs: [
{ icon: 'fa-couch', label: 'Coverage', value: 'Interior' },
{ icon: 'fa-car-side', label: 'Coverage', value: 'Exterior' },
{ icon: 'fa-gears', label: 'Coverage', value: 'Engine Bay' },
{ icon: 'fa-flask', label: 'Products', value: 'German-Made' }
],
tags: ['INTERIOR', 'EXTERIOR', 'ENGINE BAY']
},
{
id: 'svc-wrap',
name: 'Vinyl Wrap',
sku: 'SERVICE 06',
icon: 'fa-palette',
tagline: 'A new color, without touching the paint.',
desc: 'Change your car\u2019s color and look with premium vinyl films. Thousands of colors and finishes while preserving the original paint.',
specs: [
{ icon: 'fa-swatchbook', label: 'Options', value: 'Full Wrap' },
{ icon: 'fa-puzzle-piece', label: 'Options', value: 'Partial Wrap' },
{ icon: 'fa-rotate-left', label: 'Change', value: 'Reversible' },
{ icon: 'fa-palette', label: 'Colors', value: 'Thousands' }
],
tags: ['FULL WRAP', 'PARTIAL', 'REVERSIBLE']
}
]
};

const listEl = document.getElementById('configList');
const stageEl = document.getElementById('configStage');
const listCountEl = document.getElementById('listCount');
const tabs = document.querySelectorAll('.catalog-tab');
const indicator = document.querySelector('.catalog-tabs__indicator');

/* ── Single-item mode ──────────────────────────────────────
Opening /products/?id=ppf-gloss (e.g. from a QR code) shows ONLY that
one product/service spec sheet — no tabs, no sidebar list. */
function findItemAnywhere(id) {
for (const cat of ['products', 'services']) {
const found = CATALOG[cat].find(i => i.id === id);
if (found) return { cat, item: found };
}
return null;
}

const requestedId = new URLSearchParams(window.location.search).get('id');
const requestedMatch = requestedId ? findItemAnywhere(requestedId) : null;
const singleItemMode = !!requestedMatch;

let currentCat = requestedMatch ? requestedMatch.cat : 'products';
let currentId = requestedMatch ? requestedMatch.item.id : CATALOG.products[0].id;

function waLink(item) {
const text = encodeURIComponent(`Hi Johnson Smart Film, I'd like a quote for: ${item.name}`);
return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

function renderList() {
const items = CATALOG[currentCat];
listCountEl.textContent = items.length;
listEl.innerHTML = items.map((item, i) => `
<button class="config-item${item.id === currentId ? ' active' : ''}" data-id="${item.id}">
<div class="config-item__thumb">
${item.image ? `<img src="${item.image}" alt="${item.name}" loading="lazy" decoding="async">` : `<i class="fas ${item.icon}"></i>`}
</div>
<div class="config-item__body">
<div class="config-item__name">${item.name}</div>
<div class="config-item__meta">${item.sku}</div>
</div>
<i class="fas fa-chevron-right config-item__chevron"></i>
</button>
`).join('');

listEl.querySelectorAll('.config-item').forEach(btn => {
btn.addEventListener('click', () => selectItem(btn.dataset.id));
});
}

function findItem(id) {
return CATALOG[currentCat].find(i => i.id === id);
}

function renderStage(item, animate) {
const isProduct = !!item.image;

const mediaHTML = isProduct ? `
<div class="stage-media">
<img src="${item.image}" alt="${item.name}">
<div class="stage-media__overlay"></div>
<div class="stage-media__ribbon">${item.ribbon || 'Johnson Smart Film'}</div>
<div class="stage-media__num">${item.sku}</div>
<div class="stage-media__title">${item.name.split('\u2014')[0].trim()}</div>
<div class="stage-media__badge"><i class="fas fa-star"></i> ${item.sku}</div>
<div class="stage-media__sweep"></div>
</div>
` : `
<div class="stage-media stage-media--icon">
<div class="stage-media__ribbon">${item.sku}</div>
<div class="stage-media__icon-plate"><i class="fas ${item.icon}"></i></div>
<div class="stage-media__sweep"></div>
</div>
`;

const specsHTML = item.specs.map(s => `
<div class="spec-card">
<div class="spec-card__icon"><i class="fas ${s.icon}"></i></div>
<div>
<div class="spec-card__label">${s.label}</div>
<div class="spec-card__value">${s.value}</div>
</div>
</div>
`).join('');

const tagsHTML = item.tags.map(t => `<span class="stage-tag">${t}</span>`).join('');

const backLinkHTML = singleItemMode
? `<a href="/products/" class="stage-back-link"><i class="fas fa-arrow-left"></i> View Full Catalog</a>`
: '';

stageEl.innerHTML = `
${mediaHTML}
<div class="stage-info${animate ? ' swap-in' : ''}">
${backLinkHTML}
<div class="stage-info__eyebrow">${isProduct ? 'PRODUCT SPEC SHEET' : 'SERVICE OVERVIEW'}</div>
<h2 class="stage-info__title">${item.name}</h2>
<p class="stage-info__tagline">${item.tagline}</p>
<p class="stage-info__desc">${item.desc}</p>
<div class="spec-grid">${specsHTML}</div>
<div class="stage-tags">${tagsHTML}</div>
<div class="stage-actions">
<a href="${waLink(item)}" class="btn btn--primary btn--lg">
<i class="fab fa-whatsapp"></i> Request a Quote
</a>
<a href="tel:+201114171416" class="btn btn--outline btn--lg">
<i class="fas fa-phone"></i> Call Us
</a>
</div>
</div>
`;

const sweep = stageEl.querySelector('.stage-media__sweep');
if (sweep) requestAnimationFrame(() => sweep.classList.add('run'));

document.title = `${item.name} | My Products — Johnson Smart Film`;
}

function selectItem(id, animate = true) {
currentId = id;
const item = findItem(id);
if (!item) return;
renderStage(item, animate);
listEl.querySelectorAll('.config-item').forEach(btn => {
btn.classList.toggle('active', btn.dataset.id === id);
});
}

function moveIndicator(activeTab) {
if (!indicator || !activeTab) return;
indicator.style.width = activeTab.offsetWidth + 'px';
indicator.style.transform = `translateX(${activeTab.offsetLeft - 5}px)`;
}

// Init
if (singleItemMode) {
// Skip the tab/list machinery entirely — this is a single-product landing.
document.body.classList.add('single-item-mode');
selectItem(currentId, false);

const item = findItem(currentId);
const isProductItem = !!item.image;
const crumbSpan = document.querySelector('.catalog-hero__crumb span');
if (crumbSpan) crumbSpan.textContent = item.name;
const heroTitleEl = document.querySelector('.catalog-hero__title');
if (heroTitleEl) {
heroTitleEl.innerHTML = `<span>${isProductItem ? 'PRODUCT' : 'SERVICE'} SPEC —</span><span class="catalog-hero__title-accent">${item.sku}</span>`;
}
const heroDescEl = document.querySelector('.catalog-hero__desc');
if (heroDescEl) heroDescEl.textContent = item.tagline;
} else {
tabs.forEach(tab => {
tab.addEventListener('click', () => {
tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
tab.classList.add('active');
tab.setAttribute('aria-selected', 'true');
moveIndicator(tab);
currentCat = tab.dataset.cat;
currentId = CATALOG[currentCat][0].id;
renderList();
selectItem(currentId, true);
});
});

renderList();
selectItem(currentId, false);
window.addEventListener('load', () => moveIndicator(document.querySelector('.catalog-tab.active')));
window.addEventListener('resize', () => moveIndicator(document.querySelector('.catalog-tab.active')));
setTimeout(() => moveIndicator(document.querySelector('.catalog-tab.active')), 50);
}

});
