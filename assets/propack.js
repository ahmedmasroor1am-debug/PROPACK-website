/* PRO PACK — shared chrome + interactions */
(function(){
  const NAV=[
    {label:'Solutions', href:'products.html'},
    {label:'Build Your Box', href:'build.html'},
    {label:'Sustainability', href:'sustainability.html'},
    {label:'Company', href:'about.html'}
  ];
  const active=document.body.dataset.page||'';

  function header(){
    const links=NAV.map(n=>`<a href="${n.href}" class="${active===n.href?'active':''}">${n.label}</a>`).join('');
    return `<header class="site-header"><div class="wrap"><nav class="nav">
      <a class="brand" href="index.html"><img src="assets/logo/propack-monogram.svg" alt="Pro Pack"><span><span class="pro">Pro</span> <span class="pack">Pack</span></span></a>
      <div class="nav-links">${links}</div>
      <div class="nav-cta">
        <a class="btn btn-lime" href="quote.html">Request a Quote</a>
        <button class="nav-toggle" aria-label="Menu"><span></span><span></span><span></span></button>
      </div>
    </nav></div>
    <div class="mobile-menu">${NAV.map(n=>`<a href="${n.href}">${n.label}</a>`).join('')}<a class="btn btn-lime" href="quote.html">Request a Quote</a></div>
    </header>`;
  }

  function footer(){
    return `<footer class="site-footer bg-grain">
      <div class="wrap">
        <div class="footer-grid">
          <div>
            <div class="footer-brand"><img src="assets/logo/propack-monogram-white.svg" alt="Pro Pack">Pro Pack</div>
            <p style="max-width:330px;color:#bcd2ad;line-height:1.6">Sustainable carton &amp; corrugated packaging, engineered for brands that care how their products arrive — and what they leave behind.</p>
            <div style="display:flex;gap:10px;margin-top:18px">
              ${['in','x','ig','be'].map(s=>`<a href="#" aria-label="${s}" style="width:40px;height:40px;border:1px solid rgba(255,255,255,.18);border-radius:50%;display:grid;place-items:center;color:#cfe0c2;font-family:var(--font-mono);font-size:.72rem;text-transform:uppercase">${s}</a>`).join('')}
            </div>
          </div>
          <div>
            <h4>Solutions</h4>
            <a href="products.html">Corrugated Boxes</a>
            <a href="products.html">Folding Cartons</a>
            <a href="products.html">Custom Printed</a>
            <a href="products.html">Retail &amp; Display</a>
            <a href="products.html">Food-Grade</a>
            <a href="products.html">E-commerce Mailers</a>
          </div>
          <div>
            <h4>Company</h4>
            <a href="about.html">About Pro Pack</a>
            <a href="about.html">Manufacturing</a>
            <a href="sustainability.html">Sustainability</a>
            <a href="build.html">Build Your Box</a>
            <a href="quote.html">Request a Quote</a>
          </div>
          <div>
            <h4>Get in touch</h4>
            <a href="mailto:Info@propackconverters.com">Info@propackconverters.com</a>
            <a href="tel:+923051822961">+92 305 1822961</a>
            <p style="color:#9fb893;font-size:.9rem;margin-top:10px;line-height:1.6">Propack Converters (Pvt) Ltd<br>D-516, Ahsanabad, Scheme 33, Karachi<br>Mon–Sat · 9am–6pm</p>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} Propack Converters (Pvt) Ltd. All rights reserved.</span>
          <span style="display:flex;gap:18px;flex-wrap:wrap"><a href="#" style="display:inline">Privacy</a><a href="#" style="display:inline">Terms</a></span>
        </div>
      </div>
    </footer>`;
  }

  // mount
  const h=document.querySelector('[data-mount="header"]'); if(h) h.outerHTML=header();
  const f=document.querySelector('[data-mount="footer"]'); if(f) f.outerHTML=footer();

  // sticky header bg
  const hdr=document.querySelector('.site-header');
  const onScroll=()=>{ if(hdr) hdr.classList.toggle('scrolled', window.scrollY>20); };
  onScroll(); window.addEventListener('scroll', onScroll, {passive:true});

  // mobile menu
  const toggle=document.querySelector('.nav-toggle');
  const menu=document.querySelector('.mobile-menu');
  if(toggle&&menu){ toggle.addEventListener('click',()=>{ menu.classList.toggle('open'); }); 
    menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>menu.classList.remove('open'))); }

  // reveal on scroll + counters (rect-based — robust everywhere)
  const counted=new WeakSet();
  function check(){
    const vh=window.innerHeight||document.documentElement.clientHeight;
    document.querySelectorAll('.reveal:not(.in)').forEach(el=>{
      const r=el.getBoundingClientRect();
      if(r.top < vh*0.94 && r.bottom > -40) el.classList.add('in');
    });
    document.querySelectorAll('[data-count]').forEach(el=>{
      if(counted.has(el))return; const r=el.getBoundingClientRect();
      if(r.top < vh*0.9 && r.bottom>0){ counted.add(el); count(el); }
    });
  }
  function count(el){
    const target=parseFloat(el.dataset.count); const dec=(el.dataset.dec|0); const suf=el.dataset.suf||''; const pre=el.dataset.pre||'';
    const dur=1500, t0=performance.now();
    function step(t){ const p=Math.min(1,(t-t0)/dur); const e=1-Math.pow(1-p,3); const v=target*e;
      el.textContent=pre+(dec? v.toFixed(dec): Math.round(v).toLocaleString())+suf;
      if(p<1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  window.addEventListener('scroll', check, {passive:true});
  window.addEventListener('resize', check);
  check(); setTimeout(check,200); setTimeout(check,800);

  window.ProPackUI={ reveal:check };
})();
