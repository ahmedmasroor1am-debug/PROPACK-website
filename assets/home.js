/* PRO PACK — homepage dynamic content + 3D */
(function(){
  // ---- icons ----
  const I={
    corrugated:'<path d="M3 8c1.5-1.5 3-1.5 4.5 0S10.5 9.5 12 8s3-1.5 4.5 0S19.5 9.5 21 8M3 8v8c1.5-1.5 3-1.5 4.5 0M21 8v8M7.5 8v8M12 8v8M16.5 8v8"/>',
    folding:'<path d="M12 3l8 4-8 4-8-4z"/><path d="M4 7v8l8 4 8-4V7"/><path d="M12 11v8"/>',
    printed:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h5"/><circle cx="16" cy="14" r="1.4"/>',
    retail:'<path d="M4 8h16l-1.5 11.5a1 1 0 01-1 .9H6.5a1 1 0 01-1-.9z"/><path d="M8.5 8V6a3.5 3.5 0 017 0v2"/>',
    food:'<path d="M6 3v7a3 3 0 006 0V3M9 3v18M16 3c-1.5 0-2 3-2 5s.5 4 2 4 2-2 2-4-.5-5-2-5zM16 16v5"/>',
    ecom:'<path d="M3 6h18l-2 9H5z"/><circle cx="8" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/><path d="M3 6L2 3"/>',
    industrial:'<rect x="3" y="9" width="18" height="11" rx="1"/><path d="M3 13l5-3v3l5-3v3l5-3v6"/>',
  };
  function svg(p){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;}

  const SOL=[
    {ic:'corrugated',t:'Corrugated Boxes',d:'Single, double and triple-wall strength for shipping, storage and export.'},
    {ic:'folding',t:'Folding Cartons',d:'Crisp printed paperboard for shelf-ready retail and premium goods.'},
    {ic:'printed',t:'Custom Printed Cartons',d:'Brand-grade litho and flexo print, edge to edge, in perfect registration.'},
    {ic:'retail',t:'Retail & Display',d:'Point-of-sale, shelf-ready and presentation packs that sell.'},
    {ic:'food',t:'Food-Grade Packaging',d:'Grease-resistant, compostable, food-safe boards and barrier coatings.'},
    {ic:'ecom',t:'E-commerce Mailers',d:'Right-sized, drop-tested and built for an unboxing moment.'},
  ];
  const grid=document.getElementById('solGrid');
  if(grid) grid.innerHTML=SOL.map((s,i)=>`<a href="products.html" class="card sol-card reveal" data-d="${i%3}">
    <div class="sol-ico">${svg(I[s.ic])}</div>
    <h3>${s.t}</h3><p class="muted" style="margin:0">${s.d}</p>
    <span class="link-arrow">Learn more <span class="arrow">→</span></span></a>`).join('');

  const IND=[
    ['Food & Beverage','food'],['Cosmetics & Beauty','printed'],['Electronics','industrial'],
    ['Retail','retail'],['E-commerce','ecom'],['Pharmaceuticals','food'],['Logistics','corrugated']
  ];
  const ig=document.getElementById('indGrid');
  if(ig) ig.innerHTML=IND.map(([n,ic])=>`<span class="ind">${svg(I[ic])}${n}</span>`).join('');

  // reveal newly injected content
  if(window.ProPackUI&&window.ProPackUI.reveal) window.ProPackUI.reveal();

  // ---- 3D scenes ----
  function whenReady(fn){ if(window.ProPack3D&&window.THREE) fn(); else setTimeout(()=>whenReady(fn),60); }
  whenReady(()=>{
    // hero
    const hc=document.getElementById('heroCanvas');
    if(hc){
      const s=ProPack3D.createStage(hc,{autoRotate:true, startY:-0.55, startX:0.16});
      s.carton.setMaterial('kraft'); s.carton.setPrint('logo'); s.carton.setOpen(0);
      // open after load
      let o=0; setTimeout(()=>{ const t0=performance.now(); (function a(t){ const p=Math.min(1,(t-t0)/1400); s.carton.setOpen(1-Math.pow(1-p,3)); if(p<1)requestAnimationFrame(a); })(performance.now()); },500);
    }
    // teaser
    const tc=document.getElementById('teaserCanvas');
    if(tc){ const s=ProPack3D.createStage(tc,{autoRotate:true, ground:false, startY:0.5, startX:0.2}); s.carton.setMaterial('lime'); s.carton.setPrint('full'); s.carton.setOpen(.18); }

    // fold scroll
    const fc=document.getElementById('foldCanvas');
    if(fc){
      const s=ProPack3D.createStage(fc,{autoRotate:false, interactive:false, startY:-0.5, startX:0.2});
      s.carton.setMaterial('kraft'); s.carton.setPrint('logo'); s.carton.setFold(0); s.carton.setOpen(1);
      const wrap=document.querySelector('.fold-wrap');
      const track=document.querySelector('.fold-track');
      const steps=[...document.querySelectorAll('.fold-step')];
      const mobile=()=>window.innerWidth<=860;
      function onScroll(){
        if(mobile()){ s.carton.setFold(1); s.carton.setOpen(1); steps.forEach(st=>st.classList.add('on')); return; }
        const r=track.getBoundingClientRect();
        const total=r.height-window.innerHeight;
        const p=Math.max(0,Math.min(1,(-r.top)/total));
        // phase 1 (0-.55): fold up ; phase 2 (.55-1): open->close->finished
        const fold=Math.min(1,p/0.5);
        s.carton.setFold(fold);
        let open=1;
        if(p>0.6){ open=1-Math.min(1,(p-0.6)/0.3); } // close near end
        s.carton.setOpen(p<0.55?1:open);
        s.setRotation(-0.5 - p*1.6, 0.2);
        const idx=p<0.4?0:(p<0.72?1:2);
        steps.forEach((st,i)=>st.classList.toggle('on',i===idx));
      }
      window.addEventListener('scroll',onScroll,{passive:true});
      window.addEventListener('resize',onScroll); onScroll();
    }
  });
})();
