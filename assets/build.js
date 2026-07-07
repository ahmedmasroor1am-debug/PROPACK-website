/* PRO PACK — Build Your Box configurator */
(function(){
  const state={ style:'mailer', L:30, W:22, H:8, material:'kraft', print:'none', qtyIdx:2,
    boardMode:'auto', customPly:3,
    customLayers:{3:['k150','sf110','k150'], 5:['k150','sf110','sf110','sf110','k150']},
    loadKg:15, stackCount:10 };
  const QTYS=[250,500,1000,5000,20000,50000];
  const STYLES={
    mailer:{L:30,W:22,H:8}, rsc:{L:30,W:30,H:24}, tall:{L:20,W:20,H:34}, cube:{L:24,W:24,H:24}
  };
  const MATS=[
    {k:'kraft', c:'#c99a63', n:'Natural Kraft'},
    {k:'white', c:'#f1ece0', n:'Bleached White'},
    {k:'clay',  c:'#b9714a', n:'Terracotta'},
    {k:'lime',  c:'#8bc53f', n:'Lime Print'},
    {k:'forest',c:'#1c6b30', n:'Forest Print'}
  ];

  // dims (cm) -> 3D units (normalize longest ~2.6)
  function dims3d(){ const m=Math.max(state.L,state.W,state.H); const s=2.6/m;
    return { w:state.L*s, h:state.H*s, d:state.W*s }; }

  let stage=null, autoSpin=false, open=false;
  function whenReady(fn){ if(window.ProPack3D&&window.THREE) fn(); else setTimeout(()=>whenReady(fn),60); }

  whenReady(()=>{
    const cv=document.getElementById('cfgCanvas');
    stage=ProPack3D.createStage(cv,{autoRotate:false, startY:-0.6, startX:0.22});
    applyAll();
  });

  function applyAll(){
    if(!stage) return;
    const d=dims3d();
    stage.carton.setMaterial(state.material);
    stage.carton.setPrint(state.print);
    stage.carton.setSize(d.w,d.h,d.d);
    stage.carton.setOpen(open?1:0.05);
    stage.setAutoRotate(autoSpin);
  }

  // ---- swatches ----
  const sw=document.getElementById('swatches');
  sw.innerHTML=MATS.map((m,i)=>`<div class="swatch ${m.k===state.material?'sel':''}" data-mat="${m.k}" style="background:${m.c}" title="${m.n}"></div>`).join('');
  sw.addEventListener('click',e=>{ const el=e.target.closest('.swatch'); if(!el)return;
    state.material=el.dataset.mat; sw.querySelectorAll('.swatch').forEach(s=>s.classList.toggle('sel',s===el));
    document.getElementById('matVal').textContent=MATS.find(m=>m.k===state.material).n;
    applyAll(); price();
  });

  // ---- style ----
  document.getElementById('styleOpts').addEventListener('click',e=>{ const b=e.target.closest('.opt'); if(!b)return;
    state.style=b.dataset.style; const p=STYLES[state.style]; Object.assign(state,p);
    document.querySelectorAll('#styleOpts .opt').forEach(o=>o.classList.toggle('sel',o===b));
    document.getElementById('rL').value=state.L; document.getElementById('rW').value=state.W; document.getElementById('rH').value=state.H;
    updDim(); applyAll(); price();
  });

  // ---- print ----
  document.getElementById('printOpts').addEventListener('click',e=>{ const b=e.target.closest('.opt'); if(!b)return;
    state.print=b.dataset.print; document.querySelectorAll('#printOpts .opt').forEach(o=>o.classList.toggle('sel',o===b));
    applyAll(); price();
  });

  // ---- dimensions ----
  function updDim(){ document.getElementById('dimVal').textContent=`${state.L} × ${state.W} × ${state.H} cm`; }
  ['rL','rW','rH'].forEach(id=>{ const el=document.getElementById(id); el.addEventListener('input',()=>{
    state[id[1]]=+el.value; updDim(); applyAll(); price();
    // dimension tweak => custom style
    document.querySelectorAll('#styleOpts .opt').forEach(o=>o.classList.remove('sel'));
  }); });

  // ---- quantity ----
  const rq=document.getElementById('rQty');
  rq.addEventListener('input',()=>{ state.qtyIdx=+rq.value; document.getElementById('qtyVal').textContent=QTYS[state.qtyIdx].toLocaleString()+' units'; price(); });

  // ---- board strength ----
  const LAYER_LABELS={3:['Outer liner','Flute','Inner liner'],
    5:['Outer liner','Flute','Middle','Flute','Inner liner']};
  const selStyle='width:100%;margin-top:6px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:transparent;font:inherit;font-size:.9rem;color:inherit';
  function renderCustomLayers(){
    const wrap=document.getElementById('layerSelects'); if(!wrap) return;
    const ply=state.customPly;
    wrap.innerHTML=state.customLayers[ply].map((sel,i)=>
      `<label style="font-size:.84rem;color:var(--muted)">${LAYER_LABELS[ply][i]}
        <select class="lsel" data-i="${i}" style="${selStyle}">${
          Object.entries(QUALITIES).filter(([k])=>k!=='wt160')
            .map(([k,q])=>`<option value="${k}" ${k===sel?'selected':''}>${q.n}</option>`).join('')
        }</select></label>`).join('');
  }
  document.getElementById('boardModeOpts').addEventListener('click',e=>{
    const b=e.target.closest('.opt'); if(!b)return;
    state.boardMode=b.dataset.bmode;
    document.querySelectorAll('#boardModeOpts .opt').forEach(o=>o.classList.toggle('sel',o===b));
    document.getElementById('guidedPane').style.display=state.boardMode==='guided'?'block':'none';
    document.getElementById('customPane').style.display=state.boardMode==='custom'?'block':'none';
    if(state.boardMode==='custom') renderCustomLayers();
    price();
  });
  document.getElementById('plyOpts').addEventListener('click',e=>{
    const b=e.target.closest('.opt'); if(!b)return;
    state.customPly=+b.dataset.cply;
    document.querySelectorAll('#plyOpts .opt').forEach(o=>o.classList.toggle('sel',o===b));
    renderCustomLayers(); price();
  });
  document.getElementById('layerSelects').addEventListener('change',e=>{
    const s=e.target.closest('.lsel'); if(!s)return;
    state.customLayers[state.customPly][+s.dataset.i]=s.value; price();
  });
  [['gWeight','loadKg'],['gStack','stackCount']].forEach(([id,key])=>{
    const el=document.getElementById(id);
    el.addEventListener('input',()=>{ state[key]=Math.max(1,+el.value||1); price(); });
  });

  // ---- toggles ----
  document.getElementById('toggleOpen').addEventListener('click',e=>{ open=!open; e.target.classList.toggle('sel',open); e.target.textContent=open?'Close lid':'Open lid'; if(stage)stage.carton.setOpen(open?1:0.05); });
  document.getElementById('toggleSpin').addEventListener('click',e=>{ autoSpin=!autoSpin; e.target.classList.toggle('sel',autoSpin); if(stage)stage.setAutoRotate(autoSpin); });

  // ---- price model ----
  // Mirrors the ERP quotation PricingCalculator (per-carton cost buildup, PKR).
  // Live rates are fetched from the ERP's public-pricing edge function on
  // load; the constants below are fallbacks when the feed is unreachable.
  const RATES_URL='https://gxgmaycjztrrlrmjmxjo.supabase.co/functions/v1/public-pricing';
  const RATES={
    plant_rate_3ply:0.012,   // PKR per sq inch
    plant_rate_5ply:0.0145,
    conversion_overhead:10,  // % of (paper + plant)
    flexo_rate_per_color:3,  // PKR per carton per colour
    sell_multiplier:1.10     // cost → sell price factor (standard terms)
  };
  // Paper qualities (PKR/kg fallbacks; live rates from the ERP feed override)
  const QUALITIES={
    k110:{n:'Kraft 110',  family:'kraft', gsm:110, rate:120},
    k150:{n:'Kraft 150',  family:'kraft', gsm:150, rate:140},
    k160:{n:'Kraft 160',  family:'kraft', gsm:160, rate:150},
    u120:{n:'Ultra 120',  family:'ultra', gsm:120, rate:165},
    u140:{n:'Ultra 140',  family:'ultra', gsm:140, rate:175},
    sf110:{n:'Semi fluting 110', family:'semi', gsm:110, rate:105},
    wt160:{n:'White top 160', family:'white', gsm:160, rate:195}
  };
  // Board specs, layers outer→inner; flutes are L2 (and L4 on 5-ply)
  const SPECS={
    three_std:  {ply:3, layers:['k150','sf110','k150'], label:'3-ply standard'},
    three_heavy:{ply:3, layers:['k160','u140','k160'],  label:'3-ply heavy duty'},
    five_std:   {ply:5, layers:['k150','sf110','sf110','sf110','k150'], label:'5-ply standard'},
    five_heavy: {ply:5, layers:['k160','u120','k110','u120','k160'],    label:'5-ply heavy duty'}
  };
  // Guided mode: required bearing capacity (kg, already ×2 safety) → spec
  const specForCapacity=cap=> cap<=60?'three_std':cap<=120?'three_heavy':cap<=150?'five_std':'five_heavy';
  // One-time tooling amortized across the order (plates/stereos, dies)
  const SETUP={none:0, logo:12000, full:45000};
  // Board strength by style: shipping formats get 5-ply, light formats 3-ply
  const PLY={mailer:3, rsc:5, tall:5, cube:3};

  // Box dims (cm) -> flat blank that gets cut, like reel × cutting size in the ERP
  function blankSizeCm(){
    const {L,W,H}=state;
    if(state.style==='mailer') return {bl:L+2*H+4, bw:W+2.6*H+2}; // die-cut mailer blank
    return {bl:2*(L+W)+4, bw:W+H}; // RSC-style: wrap + glue flap × (height + flaps)
  }

  const pkr=n=>'PKR '+Math.round(n).toLocaleString('en-PK');

  // Pull current rates from the ERP; silently keep fallbacks on any failure.
  fetch(RATES_URL).then(r=>r.ok?r.json():null).then(d=>{
    if(!d) return;
    const num=v=>typeof v==='number'&&isFinite(v)&&v>0;
    Object.keys(RATES).forEach(k=>{ if(d.rates&&num(d.rates[k])) RATES[k]=d.rates[k]; });
    if(Array.isArray(d.paper)){
      d.paper.forEach(p=>{ Object.values(QUALITIES).forEach(q=>{
        if(q.family===p.family && Number(q.gsm)===Number(p.gsm) && num(p.rate)) q.rate=p.rate; }); });
    }
    price();
  }).catch(()=>{});

  // Active board spec from the selected mode
  function activeSpec(){
    if(state.boardMode==='custom'){
      const ply=state.customPly;
      return {ply, layers:state.customLayers[ply].slice(), label:ply+'-ply custom', cap:null};
    }
    if(state.boardMode==='guided'){
      const bears=Math.max(1,state.loadKg)*Math.max(1,state.stackCount);
      const cap=bears*2; // spec for double the real load
      return {...SPECS[specForCapacity(cap)], cap, bears};
    }
    const ply=PLY[state.style]||3;
    return {...(ply===5?SPECS.five_std:SPECS.three_std), cap:null};
  }

  function price(){
    const spec=activeSpec();
    const ply=spec.ply;
    const {bl,bw}=blankSizeCm();
    const sqIn=(bl/2.54)*(bw/2.54);

    // Paper: area(sqin) × gsm / 1,550,000 = kg; flute layers take ×1.4 (ERP formula)
    const whiteFace=['white','lime','forest'].includes(state.material)&&state.boardMode!=='custom';
    let paper=0;
    spec.layers.forEach((key,i)=>{
      let q=QUALITIES[key];
      if(i===0&&whiteFace) q=QUALITIES.wt160; // white-faced board needs a white top liner
      const isFlute= ply===3? i===1 : (i===1||i===3);
      let c=sqIn*q.gsm/1550000*q.rate; if(isFlute)c*=1.4; paper+=c;
    });

    const sv=document.getElementById('specVal'); if(sv) sv.textContent=spec.label;
    const go=document.getElementById('guidedOut');
    if(go&&state.boardMode==='guided'){
      go.innerHTML=`Bottom box bears ~<strong>${spec.bears} kg</strong>; we spec for double (<strong>${spec.cap} kg</strong>) → <strong>${spec.label}</strong>: ${spec.layers.map(k=>QUALITIES[k].n).join(' / ')}`;
    }

    const plant=sqIn*(ply===5?RATES.plant_rate_5ply:RATES.plant_rate_3ply);
    const conversion=(paper+plant)*RATES.conversion_overhead/100;
    const printing=state.print==='logo'?RATES.flexo_rate_per_color
      : state.print==='full'?RATES.flexo_rate_per_color*4 : 0;

    const qty=QTYS[state.qtyIdx];
    const setup=(SETUP[state.print]||0)/qty;
    const totalCost=paper+plant+conversion+printing+setup;
    const unit=totalCost*RATES.sell_multiplier;
    const total=unit*qty;

    document.getElementById('unitPrice').textContent='PKR '+unit.toFixed(2);
    document.getElementById('totalPrice').textContent=pkr(total);
    document.getElementById('totalQty').textContent=qty.toLocaleString();
    const brk=document.getElementById('priceBreak');
    if(brk){
      const row=(k,v)=>`<div style="display:flex;justify-content:space-between"><span>${k}</span><span>${v}</span></div>`;
      brk.innerHTML=
        row(`Board (${spec.label}, blank ${Math.round(bl)}×${Math.round(bw)} cm)`, 'PKR '+paper.toFixed(2))+
        row('Manufacturing & conversion', 'PKR '+(plant+conversion).toFixed(2))+
        (printing+setup>0?row('Printing & tooling', 'PKR '+(printing+setup).toFixed(2)):'');
    }
    // stash spec for quote page
    try{ localStorage.setItem('propack_spec', JSON.stringify({...state, qty, ply, currency:'PKR',
      unit:unit.toFixed(2), total:Math.round(total),
      board:{label:spec.label, ply, layers:spec.layers.map(k=>QUALITIES[k].n),
        capacityKg:spec.cap||null, loadKg:state.boardMode==='guided'?state.loadKg:null,
        stackCount:state.boardMode==='guided'?state.stackCount:null},
      breakdown:{paper:+paper.toFixed(2), plant:+plant.toFixed(2), conversion:+conversion.toFixed(2),
        printing:+printing.toFixed(2), setup:+setup.toFixed(2)} })); }catch(e){}
  }

  updDim(); price();
})();
