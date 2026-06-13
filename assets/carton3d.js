/* ===================================================================
   PRO PACK — 3D carton engine (Three.js r128)
   buildCarton(): a hinged box that can fold flat -> assembled,
   open/close its top flaps, take material + print, and be dragged.
   window.ProPack3D.createStage(canvas, opts)
   =================================================================== */
(function(){
  const THREE = window.THREE;
  if(!THREE){ console.warn('Three.js not loaded'); return; }

  const MATERIALS = {
    kraft:{ color:0xc99a63, name:'Natural Kraft' },
    white:{ color:0xf1ece0, name:'Bleached White' },
    lime:{  color:0x8bc53f, name:'Lime Print' },
    forest:{color:0x1c6b30, name:'Forest Print' },
    clay:{  color:0xb9714a, name:'Terracotta' }
  };

  // ---- print texture (canvas) ----
  function makePrint(base, mode){
    const c=document.createElement('canvas'); c.width=c.height=600;
    const x=c.getContext('2d');
    x.fillStyle=base; x.fillRect(0,0,600,600);
    if(mode==='none'){ return new THREE.CanvasTexture(c); }
    // subtle fibre noise
    for(let i=0;i<2600;i++){ x.fillStyle='rgba(0,0,0,'+(Math.random()*0.04)+')'; x.fillRect(Math.random()*600,Math.random()*600,2,1); }
    const dark = mode==='full';
    if(mode==='logo' || mode==='full'){
      if(dark){ x.fillStyle='#16652b'; x.fillRect(0,0,600,600);
        for(let i=0;i<2600;i++){ x.fillStyle='rgba(255,255,255,'+(Math.random()*0.03)+')'; x.fillRect(Math.random()*600,Math.random()*600,2,1);} }
      // mark: pin + stacked carton, simplified
      const cx=300, cy=208, fg = dark? '#a6d44a' : '#16652b', fg2 = dark? '#dcecb6':'#2f9e3a';
      x.save();
      x.fillStyle=fg2;
      // upper slab
      x.beginPath(); x.roundRect(cx-58,cy-52,116,46,9); x.fill();
      x.fillStyle=fg;
      x.beginPath(); x.roundRect(cx-58,cy+2,116,46,9); x.fill();
      x.restore();
      // wordmark, centered with a gap
      x.font='700 62px "Bricolage Grotesque","Hanken Grotesk",sans-serif';
      x.textBaseline='alphabetic';
      x.textAlign='right'; x.fillStyle=dark? '#ffffff':'#16652b'; x.fillText('Pro', cx-8, cy+150);
      x.textAlign='left';  x.fillStyle=fg; x.fillText('Pack', cx+10, cy+150);
    }
    const t=new THREE.CanvasTexture(c); t.anisotropy=8; return t;
  }

  function buildCarton(){
    const group=new THREE.Group();
    const matCfg={ w:2, h:1.7, d:1.45, material:'kraft', print:'logo' };

    let outerMat, innerMat;
    function makeMats(){
      const base = '#'+new THREE.Color(MATERIALS[matCfg.material].color).getHexString();
      const tex = makePrint(base, matCfg.print);
      outerMat = new THREE.MeshStandardMaterial({ map:tex, roughness:.92, metalness:0, side:THREE.DoubleSide });
      const innerC = new THREE.Color(MATERIALS[matCfg.material].color).multiplyScalar(0.86);
      innerMat = new THREE.MeshStandardMaterial({ color:innerC, roughness:.97, metalness:0, side:THREE.DoubleSide });
      outerMat.map.needsUpdate=true;
    }
    makeMats();

    const walls=[];
    let baseMesh;

    function geometry(){
      // clear
      while(group.children.length){ const o=group.children.pop(); o.traverse&&o.traverse(c=>{c.geometry&&c.geometry.dispose&&c.geometry.dispose();}); }
      walls.length=0;
      const {w,h,d}=matCfg;

      // base
      const bg=new THREE.PlaneGeometry(w,d); bg.rotateX(-Math.PI/2);
      baseMesh=new THREE.Mesh(bg, innerMat); baseMesh.position.y=-h/2; baseMesh.castShadow=true; baseMesh.receiveShadow=true;
      group.add(baseMesh);

      const defs=[
        { name:'front', hinge:[0,-h/2, d/2], axis:'x', sign:+1, yRot:0,        ww:w, flapLen:d/2, fAxis:'x', fSign:-1 },
        { name:'back',  hinge:[0,-h/2,-d/2], axis:'x', sign:-1, yRot:0,        ww:w, flapLen:d/2, fAxis:'x', fSign:+1 },
        { name:'left',  hinge:[-w/2,-h/2,0], axis:'z', sign:+1, yRot:Math.PI/2, ww:d, flapLen:w/2, fAxis:'z', fSign:-1 },
        { name:'right', hinge:[ w/2,-h/2,0], axis:'z', sign:-1, yRot:Math.PI/2, ww:d, flapLen:w/2, fAxis:'z', fSign:+1 }
      ];
      defs.forEach(def=>{
        const pivot=new THREE.Group(); pivot.position.set(def.hinge[0],def.hinge[1],def.hinge[2]);
        // wall mesh extends +Y from pivot
        const wg=new THREE.PlaneGeometry(def.ww, h); wg.translate(0,h/2,0);
        const wall=new THREE.Mesh(wg, outerMat); wall.rotation.y=def.yRot; wall.castShadow=true; wall.receiveShadow=true;
        pivot.add(wall);
        // flap pivot at top of wall (local 0,h,0)
        const fp=new THREE.Group(); fp.position.set(0,h,0);
        const fg2=new THREE.PlaneGeometry(def.ww, def.flapLen); fg2.translate(0,def.flapLen/2,0);
        const flap=new THREE.Mesh(fg2, outerMat); flap.rotation.y=def.yRot; flap.castShadow=true; flap.receiveShadow=true;
        fp.add(flap); pivot.add(fp);
        group.add(pivot);
        walls.push({def,pivot,fp});
      });
      applyFold(); applyOpen();
    }

    let foldT=1, openT=1; // 1 = assembled / open
    function applyFold(){
      walls.forEach(({def,pivot})=>{
        const ang=(1-foldT)*def.sign*Math.PI/2;
        pivot.rotation.x = def.axis==='x'? ang:0;
        pivot.rotation.z = def.axis==='z'? ang:0;
      });
    }
    function applyOpen(){
      walls.forEach(({def,fp})=>{
        const closed=def.fSign*Math.PI/2;
        const open=def.fSign*-0.34;
        const a=closed+(open-closed)*openT;
        fp.rotation.x = def.fAxis==='x'? a:0;
        fp.rotation.z = def.fAxis==='z'? a:0;
      });
    }

    geometry();

    return {
      group,
      setFold(t){ foldT=Math.max(0,Math.min(1,t)); applyFold(); },
      setOpen(t){ openT=Math.max(0,Math.min(1,t)); applyOpen(); },
      setSize(w,h,d){ matCfg.w=w; matCfg.h=h; matCfg.d=d; geometry(); },
      setMaterial(m){ if(MATERIALS[m]){ matCfg.material=m; makeMats(); geometry(); } },
      setPrint(p){ matCfg.print=p; makeMats(); geometry(); },
      cfg:matCfg, MATERIALS
    };
  }

  function createStage(canvas, opts){
    opts=opts||{};
    const renderer=new THREE.WebGLRenderer({canvas, alpha:true, antialias:true, preserveDrawingBuffer:true});
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio||1));
    renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.outputEncoding=THREE.sRGBEncoding;

    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(33, 1, .1, 100);
    camera.position.set(2.7, 2.15, 6.6);
    camera.lookAt(0,0.02,0);

    // lights
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8c826b, 0.7));
    const key=new THREE.DirectionalLight(0xfff3df, 1.15);
    key.position.set(4,7.5,5.5); key.castShadow=true;
    key.shadow.mapSize.set(1024,1024); key.shadow.camera.near=1; key.shadow.camera.far=30;
    key.shadow.camera.left=-6; key.shadow.camera.right=6; key.shadow.camera.top=6; key.shadow.camera.bottom=-6;
    key.shadow.bias=-0.0005; key.shadow.radius=4;
    scene.add(key);
    const fill=new THREE.DirectionalLight(0xc9e6b8, 0.4); fill.position.set(-6,3,-4); scene.add(fill);
    scene.add(new THREE.AmbientLight(0xffffff, 0.22));

    const carton=buildCarton();
    const pivot=new THREE.Group(); pivot.add(carton.group); scene.add(pivot);

    // shadow catcher
    let ground=null;
    if(opts.ground!==false){
      const g=new THREE.Mesh(new THREE.PlaneGeometry(20,20), new THREE.ShadowMaterial({opacity:.16}));
      g.rotation.x=-Math.PI/2; g.position.y=-1.0; g.receiveShadow=true; scene.add(g); ground=g;
    }

    // interaction (drag rotate)
    let dragging=false, px=0, py=0, targetY=opts.startY||-0.5, targetX=opts.startX||0.18, curY=targetY, curX=targetX;
    let auto=opts.autoRotate!==false, lastInteract=0;
    function down(e){ dragging=true; const p=e.touches?e.touches[0]:e; px=p.clientX; py=p.clientY; lastInteract=performance.now(); canvas.style.cursor='grabbing'; }
    function move(e){ if(!dragging)return; const p=e.touches?e.touches[0]:e; targetY+=(p.clientX-px)*0.008; targetX+=(p.clientY-py)*0.006; targetX=Math.max(-0.7,Math.min(0.9,targetX)); px=p.clientX; py=p.clientY; lastInteract=performance.now(); if(e.cancelable&&e.touches)e.preventDefault(); }
    function up(){ dragging=false; canvas.style.cursor='grab'; }
    if(opts.interactive!==false){
      canvas.style.cursor='grab';
      canvas.addEventListener('mousedown',down); window.addEventListener('mousemove',move); window.addEventListener('mouseup',up);
      canvas.addEventListener('touchstart',down,{passive:true}); canvas.addEventListener('touchmove',move,{passive:false}); window.addEventListener('touchend',up);
    }

    function resize(){
      const r=canvas.getBoundingClientRect();
      const w=r.width||canvas.clientWidth, h=r.height||canvas.clientHeight;
      if(w===0||h===0) return;
      renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
    }
    const ro=new ResizeObserver(resize); ro.observe(canvas); resize();

    let raf, running=true;
    function tick(){
      if(!running)return;
      raf=requestAnimationFrame(tick);
      if(auto && !dragging && performance.now()-lastInteract>2500){ targetY+=0.0032; }
      curY+=(targetY-curY)*0.08; curX+=(targetX-curX)*0.08;
      pivot.rotation.y=curY; pivot.rotation.x=curX;
      renderer.render(scene,camera);
    }
    tick();

    return {
      carton, scene, camera, pivot,
      setRotation(y,x){ targetY=y; if(x!=null)targetX=x; },
      setAutoRotate(b){ auto=b; },
      resize,
      stop(){ running=false; cancelAnimationFrame(raf); },
      start(){ if(!running){ running=true; tick(); } },
      dispose(){ running=false; cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); }
    };
  }

  window.ProPack3D={ createStage, buildCarton, MATERIALS };
})();
