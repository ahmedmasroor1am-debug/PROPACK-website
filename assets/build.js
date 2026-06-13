/* PRO PACK — Build Your Box configurator */
(function(){
  const state={ style:'mailer', L:30, W:22, H:8, material:'kraft', print:'none', qtyIdx:2 };
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

  // ---- toggles ----
  document.getElementById('toggleOpen').addEventListener('click',e=>{ open=!open; e.target.classList.toggle('sel',open); e.target.textContent=open?'Close lid':'Open lid'; if(stage)stage.carton.setOpen(open?1:0.05); });
  document.getElementById('toggleSpin').addEventListener('click',e=>{ autoSpin=!autoSpin; e.target.classList.toggle('sel',autoSpin); if(stage)stage.setAutoRotate(autoSpin); });

  // ---- price model ----
  function price(){
    const {L,W,H}=state;
    const area=2*(L*W + L*H + W*H); // cm2
    const board={kraft:1,white:1.16,clay:1.22,lime:1.2,forest:1.26}[state.material];
    const pr={none:1,logo:1.28,full:1.62}[state.print];
    let unit=area*0.00019*board*pr + 0.06;
    const qty=QTYS[state.qtyIdx];
    const disc=qty>=50000?0.62:qty>=20000?0.7:qty>=5000?0.8:qty>=1000?0.9:qty>=500?0.97:1;
    unit=unit*disc;
    const total=unit*qty;
    document.getElementById('unitPrice').textContent='$'+unit.toFixed(2);
    document.getElementById('totalPrice').textContent='$'+Math.round(total).toLocaleString();
    document.getElementById('totalQty').textContent=qty.toLocaleString();
    // stash spec for quote page
    try{ localStorage.setItem('propack_spec', JSON.stringify({...state, qty, unit:unit.toFixed(2), total:Math.round(total)})); }catch(e){}
  }

  updDim(); price();
})();
