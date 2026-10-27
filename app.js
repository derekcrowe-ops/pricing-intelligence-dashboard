const DATA_URL = new URL('./data.json', import.meta.url);
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const compact = n => Number(n).toLocaleString('en-US',{maximumFractionDigits:2});
const money = (n,c='USD') => n==null?'—':new Intl.NumberFormat('en-US',{style:'currency',currency:c,maximumFractionDigits:2}).format(n);
const profileClass = c => c.name==='TK Sports'?'analogue':(/premium/i.test(c.positioning)?'premium':(/affordable|budget|low-price/i.test(c.positioning)?'budget':(/mainstream|performance/i.test(c.positioning)?'mid':'budget')));
const typeKey = c => c.name==='TK Sports'?'analogue':'indirect';
const statusClass = s => s==='Verified'?'status-verified':s==='Partially Verified'?'status-partial':s==='Estimated'?'status-estimated':'status-unavailable';
const statusLabel = s => s==='Partially Verified'?'Partially verified':s;

const data = await fetch(DATA_URL).then(r=>{if(!r.ok)throw new Error(`Research data could not be loaded (${r.status})`);return r.json()});
const competitors = data.competitors;
const offers = data.pricing_offers;
const offerById = new Map(offers.map(o=>[o.offer_id,o]));
const compById = new Map(competitors.map(c=>[c.competitor_id,c]));
const comparable = data.price_comparison.included_offer_ids.map(id=>offerById.get(id)).filter(Boolean);
if(comparable.length!==data.price_comparison.n) throw new Error('Comparable offer IDs do not match the recorded comparison count.');
const prices = comparable.map(o=>o.price).sort((a,b)=>a-b);
const median = prices[Math.floor(prices.length/2)];
const mean = prices.reduce((a,b)=>a+b,0)/prices.length;
const selected = new Set();
let exploratoryPrice = 129;
let offerSort = {key:'competitor_name',dir:1};
let competitorSort = 'name';

function verifyData(){
  if(new Set(competitors.map(c=>c.competitor_id)).size!==competitors.length) throw new Error('Duplicate competitor IDs found.');
  if(new Set(offers.map(o=>o.offer_id)).size!==offers.length) throw new Error('Duplicate offer IDs found.');
  for(const o of offers) if(!compById.has(o.competitor_id)) throw new Error(`Offer ${o.offer_id} has no matching competitor.`);
  const round2=x=>Math.round(x*100)/100;
  if(round2(Math.min(...prices))!==data.price_comparison.minimum||round2(Math.max(...prices))!==data.price_comparison.maximum||round2(mean)!==data.price_comparison.average||round2(median)!==data.price_comparison.median) throw new Error('Recorded pricing summary differs from the offer calculations.');
}
verifyData();

function renderKpis(){
 const direct=competitors.filter(c=>c.classification.toLowerCase().startsWith('direct')).length;
 const indirect=competitors.length-direct-competitors.filter(c=>c.classification.toLowerCase().includes('adjacent sport')).length;
 const items=[
  ['Competitors',competitors.length,'0 direct · 4 indirect · 1 adjacent sport'],
  ['Researched offers',offers.length,'All recorded product prices'],
  ['Comparable gear bags',comparable.length,'USD · complete ice-hockey bags'],
  ['Lowest comparable',money(Math.min(...prices)),'BAUER · Premium Carry Bag'],
  ['Median comparable',money(median),'Three-offer benchmark'],
  ['Average comparable',money(mean),'Descriptive · not market-wide']
 ];
 $('#kpis').innerHTML=items.map(([label,value,note],i)=>`<article class="kpi-card ${i===3||i===4?'accent':''}"><span class="kpi-label">${safe(label)}</span><strong class="kpi-value">${safe(value)}</strong><span class="kpi-note">${safe(note)}</span></article>`).join('');
 $('#competitorCount').textContent=`${String(competitors.length).padStart(2,'0')} COMPETITORS`;
 $('#rangeLow').textContent=money(Math.min(...prices));$('#rangeMedian').textContent=money(median);$('#rangeHigh').textContent=money(Math.max(...prices));
 $('#oneTimeCount').textContent=offers.filter(o=>o.pricing_model==='One-time purchase').length;
}

function repOffer(c){return offerById.get(c.representative_offer_id)||offers.find(o=>o.competitor_id===c.competitor_id)}
function filtersAndSort(){
 const q=$('#competitorSearch').value.trim().toLowerCase(), tf=$('#typeFilter').value,pf=$('#positionFilter').value;
 let arr=competitors.filter(c=>{
  const o=repOffer(c);const text=[c.name,c.main_products,c.positioning,c.target_customers,c.differentiating_features,o?.product_name,o?.description,...(o?.features||[])].join(' ').toLowerCase();
  return(!q||text.includes(q))&&(tf==='all'||typeKey(c)===tf)&&(pf==='all'||profileClass(c)===pf);
 });
 arr.sort((a,b)=>{
  if(competitorSort==='price-asc'||competitorSort==='price-desc'){const x=repOffer(a),y=repOffer(b);if(x.currency!==y.currency)return x.currency==='USD'?-1:1;return(x.price-y.price)*(competitorSort==='price-asc'?1:-1)}
  return a.name.localeCompare(b.name);
 }); return arr;
}
function renderCompetitors(){
 const arr=filtersAndSort();$('#competitorEmpty').classList.toggle('hidden',arr.length!==0);
 $('#competitorGrid').innerHTML=arr.map(c=>{
  const o=repOffer(c),isSelected=selected.has(c.competitor_id),cls=profileClass(c);
  const price=o?.price==null?'Price unavailable':money(o.price,o.currency);
  const priceNote=o?.comparison_group?'complete ice-hockey bag':o?.currency==='EUR'?'field hockey · EUR':'separate stick bag';
  const chips=(o?.features||[]).slice(0,3).map(x=>`<span class="feature-tag">${safe(x.length>36?x.slice(0,33)+'…':x)}</span>`).join('');
  return `<article class="competitor-card ${isSelected?'selected':''}" data-id="${safe(c.competitor_id)}">
   <div class="card-top"><div class="company-monogram">${safe(c.name==='Pacific Rink'?'PR':c.name==='TK Sports'?'TK':c.name.slice(0,2).toUpperCase())}</div><div class="card-title-wrap"><div class="company-name">${safe(c.name)}</div><small class="company-meta">${safe(c.geographic_market.split(';')[0])}</small></div><input class="select-competitor" type="checkbox" aria-label="Select ${safe(c.name)} to compare" ${isSelected?'checked':''} ${!isSelected&&selected.size>=3?'disabled':''}></div>
   <span class="class-pill ${typeKey(c)==='analogue'?'analogue':''}">${safe(c.classification)}</span>
   <div class="card-price"><strong class="${o?.comparison_group?'':'no-comparable'}">${safe(price)}</strong><small>${safe(priceNote)}</small></div>
   <div class="position-chip">${safe(c.positioning)}</div><p class="card-description">${safe(c.reason_for_inclusion)}</p><div class="feature-tags">${chips}</div>
   <details class="card-detail"><summary>Profile & evidence</summary><div class="detail-body"><p><b>Audience:</b> ${safe(c.target_customers)}</p><p><b>Products:</b> ${safe(c.main_products)}</p><p><b>Differentiation:</b> ${safe(c.differentiating_features)}</p><p><b>Offer:</b> ${safe(o?.product_name)} · ${safe(o?.verification_status||'Unavailable')}</p><a href="${safe(c.official_website)}" target="_blank" rel="noopener noreferrer">Official website ↗</a>${o?` · <a href="${safe(o.source_url)}" target="_blank" rel="noopener noreferrer">Price source ↗</a>`:''}</div></details>
  </article>`;
 }).join('');
 $$('.select-competitor').forEach(el=>el.addEventListener('change',e=>{const id=e.currentTarget.closest('.competitor-card').dataset.id;if(e.currentTarget.checked){if(selected.size<3)selected.add(id);else e.currentTarget.checked=false}else selected.delete(id);renderCompetitors();renderSelection()}));
 $('#selectedCount').textContent=selected.size;
}
function renderSelection(){
 const box=$('#selectionCompare');if(!selected.size){box.classList.add('hidden');box.innerHTML='';return}box.classList.remove('hidden');
 box.innerHTML=[...selected].map(id=>{const c=compById.get(id),o=repOffer(c);return `<div class="selection-cell"><strong>${safe(c.name)} · ${safe(o?money(o.price,o.currency):'—')}</strong><small>${safe(o?.product_name||'No representative offer')} · ${safe(o?.verification_status||'')} · ${safe(c.positioning)}</small></div>`}).join('');
}
function renderRepresentativeChart(){
 const rows=comparable.map(o=>({o,c:compById.get(o.competitor_id)}));
 if($('#chartSort').value==='desc')rows.reverse();
 const max=300;
 $('#representativeChart').innerHTML=rows.map(({o,c})=>`<button class="bar-row chart-bar-button" type="button" data-offer="${safe(o.offer_id)}" title="${safe(c.name)} — ${safe(o.product_name)} — ${safe(money(o.price,o.currency))}"><span class="bar-name">${safe(c.name)} · ${safe(o.product_name.replace('BAUER ','').replace('The ',''))}</span><span class="bar-track"><span class="bar-fill ${c.name==='Pacific Rink'?'pacific':''}" style="width:${Math.max(3,o.price/max*100)}%"></span></span><span class="bar-price">${safe(money(o.price,o.currency))}</span></button>`).join('');
 $$('.chart-bar-button').forEach(b=>b.addEventListener('click',()=>{const o=offerById.get(b.dataset.offer);document.querySelector(`[data-offer-row="${o.offer_id}"]`)?.scrollIntoView({behavior:'smooth',block:'center'})}));
}
function renderRange(){
 const included=[...new Set(comparable.map(o=>o.competitor_id))].map(id=>({c:compById.get(id),os:comparable.filter(o=>o.competitor_id===id)}));
 const min=data.price_comparison.minimum,max=data.price_comparison.maximum,span=max-min;
 $('#rangeChart').innerHTML=`<div class="range-track"></div>${included.map(({c,os})=>{const lo=Math.min(...os.map(o=>o.price)),hi=Math.max(...os.map(o=>o.price)),left=(lo-min)/span*90+5,width=Math.max(2,(hi-lo)/span*90);return `<div class="range-band" style="left:${left}%;width:${width}%" title="${safe(c.name)} range: ${money(lo)}–${money(hi)}"></div>`}).join('')}${[min,median,max].map((x,i)=>`<div class="range-marker" style="left:${5+(x-min)/span*90}%" data-label="${i===0?'MIN':i===1?'MEDIAN':'MAX'}"></div><span class="range-tick" style="left:${5+(x-min)/span*90}%">${money(x)}</span>`).join('')}<div class="range-recommendation" style="left:${5+(119-min)/span*90}%;width:${(149-119)/span*90}%"></div><span class="range-rec-label" style="left:${5+(134-min)/span*90}%">MISSION 1 RANGE</span>`;
}
function renderOffers(){
 const cf=$('#currencyFilter').value,vf=$('#verificationFilter').value;
 const rows=offers.filter(o=>(cf==='all'||o.currency===cf)&&(vf==='all'||o.verification_status===vf)).sort((a,b)=>{let x=a[offerSort.key],y=b[offerSort.key];if(offerSort.key==='price'){if(a.currency!==b.currency)return a.currency==='USD'?-1:1;x=+x;y=+y}return (typeof x==='number'?x-y:String(x??'').localeCompare(String(y??'')))*offerSort.dir});
 $('#offersTable').innerHTML=rows.map(o=>{const c=compById.get(o.competitor_id);const eligible=o.comparison_group!==null;const promo=o.promotional_price!=null?`Promo ${money(o.promotional_price,o.currency)}`:'No promotion observed';return `<tr data-offer-row="${safe(o.offer_id)}"><td><span class="offer-name">${safe(o.competitor_name)}</span><span class="offer-sub">${safe(c.classification)}</span></td><td><span class="offer-name">${safe(o.product_name)}</span><span class="offer-sub">${safe(o.description)}</span></td><td class="price-cell">${safe(money(o.price,o.currency))}<span class="offer-sub">${safe(promo)} · regular historical price not established</span></td><td>${safe(o.pricing_model)}<span class="offer-sub">${safe(o.pricing_unit)}</span></td><td><span class="${eligible?'inclusion-pill':'exclusion-pill'}">${eligible?'BENCHMARK':'SEPARATE / ADJACENT'}</span></td><td><span class="status ${statusClass(o.verification_status)}">${safe(statusLabel(o.verification_status))}</span><span class="offer-sub">Availability not reported</span></td><td><a class="source-link" href="${safe(o.source_url)}" target="_blank" rel="noopener noreferrer">Open source ↗</a><span class="offer-sub">${safe(o.source_type)}</span></td></tr>`}).join('')||'<tr><td colspan="7">No offers match these filters.</td></tr>';
 $('#offerFoot').textContent=`SHOWING ${rows.length} OF ${offers.length} OFFERS`;
}
function renderLadder(){
 const usd=offers.filter(o=>o.currency==='USD');const max=Math.max(...usd.map(o=>o.price));
 $('#allOfferLadder').innerHTML=`<div class="ladder-list">${usd.toSorted((a,b)=>a.price-b.price).map(o=>`<div class="ladder-row"><span class="ladder-label" title="${safe(o.competitor_name+' — '+o.product_name)}">${safe(o.competitor_name)} · ${safe(o.product_name.replace('Hockey ','').replace('BAUER ','').replace('The ',''))}</span><span class="ladder-track"><span class="ladder-fill ${o.comparison_group?'':o.competitor_id==='C04'?'analogue':'stick'}" style="width:${o.price/max*100}%"></span></span><span class="ladder-value">${safe(money(o.price))}</span></div>`).join('')}</div><div class="ladder-key">BLUE/GREEN · COMPLETE GEAR BAG BENCHMARK &nbsp; GRAY · SEPARATE STICK BAG &nbsp; TK SPORTS EUR EXCLUDED</div>`;
}
function renderSources(){
 $('#sourceList').innerHTML=offers.map(o=>`<div class="source-item"><a href="${safe(o.source_url)}" target="_blank" rel="noopener noreferrer">${safe(o.competitor_name)} · ${safe(o.product_name)} ↗</a><span class="status ${statusClass(o.verification_status)}">${safe(statusLabel(o.verification_status))}</span><small>${safe(o.source_type)} · Checked ${safe(o.research_date)} · ${safe(o.currency)} ${compact(o.price)} / ${safe(o.pricing_unit)}</small></div>`).join('');
}
function classification(price){
 if(price<prices[0])return['Below observed range',`Below the lowest comparable bag (${money(prices[0])}).`];
 if(price>prices.at(-1))return['Above observed range',`Above the highest comparable bag (${money(prices.at(-1))}).`];
 if(Math.abs(price-median)<0.005)return['At the market middle',`At the observed representative median of ${money(median)}.`];
 if(price<median)return['Lower half of observed prices',`Between the lowest offer and the sample median (${money(median)}).`];
 return['Premium half of observed prices',`Above the sample median and within the observed range.`];
}
function renderExplorer(){
 exploratoryPrice=Math.max(50,Math.min(300,Number.isFinite(+exploratoryPrice)?+exploratoryPrice:129));
 $('#priceInput').value=compact(exploratoryPrice);$('#priceSlider').value=Math.round(exploratoryPrice);
 $('#priceSlider').style.background=`linear-gradient(90deg,#4bc5d0 0 ${(119-50)/250*100}%,#c9a55e ${(119-50)/250*100}% ${(149-50)/250*100}%,#32464d ${(149-50)/250*100}%)`;
 const [label,sub]=classification(exploratoryPrice);$('#positionLabel').textContent=label;$('#positionSub').textContent=sub;
 const delta=exploratoryPrice-median;$('#medianDelta').textContent=`${delta>0?'+':''}${money(delta)} ${delta>=0?'above':'below'}`;
 $$('.scenario-btn').forEach(b=>b.classList.toggle('active',Math.abs(+b.dataset.price-exploratoryPrice)<0.005));
 const scaleMin=50,scaleMax=300,pos=x=>(x-scaleMin)/(scaleMax-scaleMin)*100;
 const ticks=[50,100,150,200,250,300];
 $('#priceLadder').innerHTML=`<div class="ladder-axis-line" style="left:0%"></div><div class="ladder-axis-line" style="left:100%"></div><div class="ladder-median-line" style="left:${pos(median)}%"></div><span class="ladder-median-label" style="left:${pos(median)}%">MEDIAN ${money(median)}</span><span class="rec-band" style="left:${pos(119)}%;width:${pos(149)-pos(119)}%"></span>${ticks.map(x=>`<span class="ladder-axis" style="left:${pos(x)}%">$${x}</span>`).join('')}${comparable.map(o=>`<span class="competitor-point" style="left:${pos(o.price)}%" data-name="${safe(o.competitor_name)} ${money(o.price)}" title="${safe(o.competitor_name)} · ${safe(o.product_name)} · ${money(o.price)}"></span>`).join('')}<span class="proposed-marker" style="left:${pos(exploratoryPrice)}%" title="Your exploratory price ${money(exploratoryPrice)}"></span>`;
 const less=prices.filter(p=>p<exploratoryPrice).length,equal=prices.filter(p=>Math.abs(p-exploratoryPrice)<.005).length,more=prices.filter(p=>p>exploratoryPrice).length;
 $('#priceBreakdown').innerHTML=`<div class="breakdown-card"><span>LOWER THAN YOU</span><strong>${less} / ${prices.length}</strong><small>observed gear bags</small></div><div class="breakdown-card"><span>PRICE MATCH</span><strong>${equal} / ${prices.length}</strong><small>within $0.01</small></div><div class="breakdown-card"><span>HIGHER THAN YOU</span><strong>${more} / ${prices.length}</strong><small>observed gear bags</small></div>`;
 const cheaper=comparable.filter(o=>o.price<exploratoryPrice),dearer=comparable.filter(o=>o.price>exploratoryPrice),match=comparable.filter(o=>Math.abs(o.price-exploratoryPrice)<.005),inRec=exploratoryPrice>=119&&exploratoryPrice<=149;
 let text=match.length?`Your selected price matches ${match.map(o=>safe(o.competitor_name)).join(', ')}’s observed offer.`:`At ${money(exploratoryPrice)}, you would be priced below ${cheaper.length?cheaper.map(o=>safe(o.competitor_name)).join(', '):'none'} and above ${dearer.length?dearer.map(o=>safe(o.competitor_name)).join(', '):'none'} in the three-offer complete-bag benchmark.`;
 text+=` ${inRec?'This falls within':'This falls outside'} the Mission 1 preliminary range of $119–$149.`;
 if(exploratoryPrice>median)text+=' A premium-half position would need a clear, tested convenience and durability story.';
 else if(exploratoryPrice<median)text+=' The price sits in the lower half of this small observed set; no sales response can be inferred.';
 $('#dynamicInsight').innerHTML=`<i>✳</i><span><b>Positioning read.</b> ${text}</span>`;
}

function setup(){
 renderKpis();renderCompetitors();renderSelection();renderRepresentativeChart();renderRange();renderOffers();renderLadder();renderSources();renderExplorer();
 $('#competitorSearch').addEventListener('input',renderCompetitors);
 $('#typeFilter').addEventListener('change',renderCompetitors);$('#positionFilter').addEventListener('change',renderCompetitors);
 $('#sortCompetitors').addEventListener('change',e=>{competitorSort=e.target.value;renderCompetitors()});
 $('#clearSelection').addEventListener('click',()=>{selected.clear();renderCompetitors();renderSelection()});
 $('#chartSort').addEventListener('change',renderRepresentativeChart);
 $('#currencyFilter').addEventListener('change',renderOffers);$('#verificationFilter').addEventListener('change',renderOffers);
 $$('th button[data-sort]').forEach(b=>b.addEventListener('click',()=>{const key=b.dataset.sort;if(offerSort.key===key)offerSort.dir*=-1;else offerSort={key,dir:1};renderOffers()}));
 $('#priceSlider').addEventListener('input',e=>{exploratoryPrice=+e.target.value;renderExplorer()});
 $('#priceInput').addEventListener('input',e=>{if(e.target.value!==''){exploratoryPrice=+e.target.value;renderExplorer()}});
 $$('.scenario-btn').forEach(b=>b.addEventListener('click',()=>{exploratoryPrice=+b.dataset.price;renderExplorer()}));
 $('#sourcesShortcut').addEventListener('click',()=>document.querySelector('#sources').scrollIntoView({behavior:'smooth'}));
 $('#mobileMenu').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
 $$('.nav-link').forEach(link=>link.addEventListener('click',()=>{$$('.nav-link').forEach(a=>a.classList.remove('active'));link.classList.add('active');$('#sidebar').classList.remove('open')}));
 const sections=$$('.section-anchor,#landscape,#pricing,#explorer,#opportunities,#sources');
 if('IntersectionObserver'in window){const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){$$('.nav-link').forEach(a=>a.classList.toggle('active',a.getAttribute('href')===`#${e.target.id}`))}}),{rootMargin:'-20% 0px -70% 0px'});sections.forEach(s=>io.observe(s))}
}
setup();
