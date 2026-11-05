// Ancestral Peaks — the live field behind a session. A canvas over his footage that moves with the voice.
// Five kinds, one per bed: water (rings on the creek), wind (lines over the dunes), embers (rising from
// the hearth), stars (the star road over the sea), dawn (light coming up over the meadow).
// All drawn by hand, no images. PeaksField(canvas, kind) -> {frame(levels, dt), resize(), ripple(x,y), destroy(), setKind(kind)}
(function(){
  const TAU=Math.PI*2;
  const rnd=(a,b)=>a+Math.random()*(b-a);
  const clamp=(x,a,b)=>x<a?a:x>b?b:x;

  window.PeaksField=function(canvas,kind,opts){
    opts=opts||{};
    const ctx=canvas.getContext('2d',{alpha:true});
    let W=1,H=1,dpr=1,T=0;
    let state=null;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches && !opts.ignoreReduced;

    function resize(){
      dpr=Math.min(window.devicePixelRatio||1, opts.maxDpr||1.5);
      const r=canvas.getBoundingClientRect();
      const w=Math.max(1,Math.round(r.width*dpr)), h=Math.max(1,Math.round(r.height*dpr));
      if(w!==canvas.width||h!==canvas.height){ canvas.width=w; canvas.height=h; }
      W=w; H=h; init();
    }
    function setKind(k){ kind=k; init(); }

    // ---------- init per kind ----------
    function init(){
      const s=state={rings:[],emit:[],lines:[],grains:[],parts:[],stars:[],road:[],mist:[],birds:[],sun:0};
      if(kind==='water'){
        const n=4;
        for(let i=0;i<n;i++) s.emit.push({x:W*(0.18+0.64*i/(n-1))+rnd(-W*.06,W*.06), y:H*rnd(.42,.78), ph:rnd(0,TAU)});
        for(let i=0;i<7;i++) s.lines.push({y:H*(0.25+0.6*i/6), amp:rnd(6,14)*dpr, k:rnd(.004,.009)/dpr, sp:rnd(.15,.4), ph:rnd(0,TAU)});
      } else if(kind==='wind'){
        for(let i=0;i<90;i++) s.lines.push(newStream(true));
        for(let i=0;i<140;i++) s.grains.push({x:rnd(0,W),y:rnd(H*.3,H),v:rnd(.6,1.4),s:rnd(.6,1.6)*dpr});
      } else if(kind==='embers'){
        s.glow=0;
      } else if(kind==='stars'){
        for(let i=0;i<220;i++) s.stars.push({x:rnd(0,W),y:rnd(0,H*.72)*rnd(.6,1),r:rnd(.5,1.7)*dpr,ph:rnd(0,TAU),tw:rnd(.6,2.2),b:rnd(.25,.9)});
        s.road=[{t0:0},{t0:-9},{t0:-18}];
      } else if(kind==='dawn'){
        for(let i=0;i<5;i++) s.mist.push({y:H*(0.52+0.09*i), h:H*rnd(.05,.1), sp:rnd(4,9)*dpr, ph:rnd(0,TAU), a:rnd(.05,.11)});
        s.sun=0;
      }
    }
    function newStream(anywhere){
      const y=rnd(H*.22,H*.92);
      return {x:anywhere?rnd(-W*.2,W):rnd(-W*.25,-W*.02), y, len:rnd(W*.05,W*.16), v:rnd(.7,1.3), a:rnd(.25,.7), w:rnd(.6,1.3)*dpr, ph:rnd(0,TAU)};
    }
    // the dune field: slow waves, two layers
    function duneY(x,base){ return base + Math.sin(x*0.0021/dpr*dpr+1.3)*H*.035 + Math.sin(x*0.0063/dpr*dpr+0.4)*H*.012; }

    // ---------- draw per kind ----------
    function drawWater(L,dt){
      const s=state;
      // caustic drift lines
      ctx.lineWidth=1.1*dpr; ctx.strokeStyle='rgba(255,255,255,1)';
      s.lines.forEach(l=>{
        ctx.globalAlpha=0.05+0.10*L.mid;
        ctx.beginPath();
        for(let x=0;x<=W;x+=12*dpr){ const y=l.y+Math.sin(x*l.k+T*l.sp+l.ph)*l.amp*(0.6+L.low); x?ctx.lineTo(x,y):ctx.moveTo(x,y); }
        ctx.stroke();
      });
      // spawn rings with the voice
      const rate=(0.35+L.level*5.5)*dt;
      s.emit.forEach(e=>{ if(Math.random()<rate){ s.rings.push({x:e.x+rnd(-20,20)*dpr,y:e.y+rnd(-8,8)*dpr,r:2*dpr,v:(28+70*L.level)*dpr,a:0.55+0.4*L.mid,w:(0.9+1.6*L.high)*dpr}); } });
      if(s.rings.length>90) s.rings.splice(0,s.rings.length-90);
      s.rings.forEach(r=>{ r.r+=r.v*dt; r.v*=0.995; r.a*=Math.pow(0.42,dt); });
      s.rings=s.rings.filter(r=>r.a>0.012);
      ctx.strokeStyle='rgba(255,255,255,1)';
      s.rings.forEach(r=>{ ctx.globalAlpha=r.a; ctx.lineWidth=r.w; ctx.beginPath(); ctx.ellipse(r.x,r.y,r.r,r.r*0.42,0,0,TAU); ctx.stroke(); });
      ctx.globalAlpha=1;
    }
    function drawWind(L,dt){
      const s=state, base1=H*.62, base2=H*.78;
      // two dune crests, faint
      ctx.globalAlpha=0.16; ctx.lineWidth=1.2*dpr; ctx.strokeStyle='#fff';
      [base1,base2].forEach((b,i)=>{ ctx.beginPath(); for(let x=0;x<=W;x+=10*dpr){ const y=duneY(x+T*(6+4*i)*dpr,b); x?ctx.lineTo(x,y):ctx.moveTo(x,y);} ctx.stroke(); });
      // streamlines
      const v=(55+260*L.level)*dpr;
      ctx.lineCap='round';
      s.lines.forEach(l=>{
        l.x+=v*l.v*dt;
        if(l.x-l.len>W){ Object.assign(l,newStream(false)); }
        const yoff=Math.sin(l.x*0.004/dpr+l.ph+T*.6)*H*.012*(0.5+L.mid);
        const y0=l.y+yoff;
        ctx.globalAlpha=l.a*(0.18+0.6*L.level);
        ctx.lineWidth=l.w;
        ctx.beginPath(); ctx.moveTo(l.x-l.len,y0+Math.sin(T+l.ph)*2*dpr);
        ctx.quadraticCurveTo(l.x-l.len*.5,y0-4*dpr*(0.5+L.high),l.x,y0);
        ctx.stroke();
      });
      // grains
      ctx.fillStyle='#fff';
      s.grains.forEach(g=>{ g.x+=v*g.v*1.4*dt; g.y+=Math.sin(T*2+g.x*.01)*0.3*dpr; if(g.x>W){ g.x=-5; g.y=rnd(H*.3,H);} ctx.globalAlpha=0.12+0.45*L.high; ctx.beginPath(); ctx.arc(g.x,g.y,g.s,0,TAU); ctx.fill(); });
      ctx.globalAlpha=1;
    }
    function drawEmbers(L,dt){
      const s=state;
      // the glow at the hearth
      s.glow+=((0.25+0.75*L.low)-s.glow)*Math.min(1,dt*3);
      const gx=W*.5, gy=H*1.02;
      const g=ctx.createRadialGradient(gx,gy,0,gx,gy,H*.62);
      g.addColorStop(0,`rgba(255,150,60,${0.28*s.glow})`); g.addColorStop(.45,`rgba(200,70,20,${0.12*s.glow})`); g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.globalCompositeOperation='lighter';
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      // spawn embers with the voice
      const n=(5+70*L.level)*dt;
      for(let i=0;i<n;i++) if(Math.random()<n-i||i<Math.floor(n)) s.parts.push({x:W*rnd(.3,.7),y:H*rnd(.95,1.05),vx:rnd(-12,12)*dpr,vy:-rnd(26,80)*dpr*(0.7+L.mid),life:rnd(2.5,6),age:0,r:rnd(.8,2.6)*dpr,ph:rnd(0,TAU),hot:Math.random()});
      if(s.parts.length>420) s.parts.splice(0,s.parts.length-420);
      s.parts.forEach(p=>{ p.age+=dt; p.x+=(p.vx+Math.sin(T*1.7+p.ph)*14*dpr)*dt; p.y+=p.vy*dt; p.vy*=Math.pow(0.86,dt); p.vy-=12*dpr*dt*L.level; });
      s.parts=s.parts.filter(p=>p.age<p.life && p.y>-10);
      s.parts.forEach(p=>{
        const k=1-p.age/p.life, fl=0.65+0.35*Math.sin(T*9+p.ph);
        const r=p.r*(0.7+0.6*k);
        ctx.globalAlpha=clamp(k*fl*(0.5+0.6*L.high),0,1);
        ctx.fillStyle=p.hot>0.7?'#FFE2A8':(p.hot>0.35?'#FFA64D':'#E8602A');
        ctx.beginPath(); ctx.arc(p.x,p.y,r,0,TAU); ctx.fill();
        if(p.hot>0.8){ ctx.globalAlpha*=0.35; ctx.beginPath(); ctx.arc(p.x,p.y,r*3,0,TAU); ctx.fill(); }
      });
      ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1;
    }
    function star(x,y,r,a){ // the hand-built star of the compass, small
      ctx.globalAlpha=a; ctx.beginPath();
      ctx.moveTo(x,y-r); ctx.bezierCurveTo(x+r*.1,y-r*.27,x+r*.27,y-r*.1,x+r,y);
      ctx.bezierCurveTo(x+r*.27,y+r*.1,x+r*.1,y+r*.27,x,y+r);
      ctx.bezierCurveTo(x-r*.1,y+r*.27,x-r*.27,y+r*.1,x-r,y);
      ctx.bezierCurveTo(x-r*.27,y-r*.1,x-r*.1,y-r*.27,x,y-r); ctx.fill();
    }
    function drawStars(L,dt){
      const s=state, hor=H*.70;
      ctx.fillStyle='#fff';
      s.stars.forEach(st=>{ const tw=0.5+0.5*Math.sin(T*st.tw+st.ph); ctx.globalAlpha=clamp(st.b*(0.35+0.65*tw)*(0.55+0.9*L.high),0,1); ctx.beginPath(); ctx.arc(st.x,st.y,st.r,0,TAU); ctx.fill(); });
      // the thirty-two points on the horizon, faint
      ctx.strokeStyle='rgba(255,255,255,1)'; ctx.lineWidth=1*dpr;
      const cx=W*.5, R=W*.62;
      for(let i=0;i<32;i++){ const a=Math.PI+i*(Math.PI/31); const x=cx+Math.cos(a)*R, y=hor+Math.sin(a)*R*.42; if(x<-10||x>W+10) continue; ctx.globalAlpha=0.18+0.22*L.mid; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x,y-(i%4?5:10)*dpr); ctx.stroke(); }
      // the star road: a star rises at one point, climbs, fades, the next rises at the same point
      s.road.forEach(rd=>{ rd.t0+=dt; const p=(rd.t0%27)/27; const a=Math.PI*1.08+p*Math.PI*.84; const x=cx+Math.cos(a)*R*.9, y=hor+Math.sin(a)*R*.45-p*H*.05; const fade=Math.sin(Math.PI*p); ctx.fillStyle='#F3DDA6'; star(x,y,(6+9*L.level)*dpr,clamp(fade*(0.5+0.6*L.mid),0,1)); ctx.globalAlpha*=0.3; ctx.beginPath(); ctx.arc(x,y,(14+14*L.level)*dpr,0,TAU); ctx.fill(); });
      // the swell at the bottom
      ctx.strokeStyle='rgba(255,255,255,1)'; ctx.lineWidth=1.3*dpr;
      for(let j=0;j<3;j++){ ctx.globalAlpha=0.12+0.2*L.low*(1-j*.3); ctx.beginPath(); for(let x=0;x<=W;x+=10*dpr){ const y=H*(0.82+0.05*j)+Math.sin(x*0.004/dpr+T*(0.6+0.2*j)+j)*H*.012*(0.6+L.low)+Math.sin(x*0.011/dpr-T*1.1)*H*.004; x?ctx.lineTo(x,y):ctx.moveTo(x,y);} ctx.stroke(); }
      ctx.globalAlpha=1;
    }
    function drawDawn(L,dt){
      const s=state; s.sun=Math.min(1,s.sun+dt/600); // the sun climbs over ten minutes
      const sx=W*.68, sy=H*(0.66-0.18*s.sun);
      ctx.globalCompositeOperation='lighter';
      // rays: soft, slow, a little wider when the voice rises
      const n=14;
      for(let i=0;i<n;i++){
        const a=-Math.PI*.98+i*(Math.PI*.96/(n-1))+Math.sin(T*.06+i)*.025;
        const len=H*(0.45+0.35*L.level)*(0.75+0.25*Math.sin(T*.25+i*1.7));
        const g=ctx.createLinearGradient(sx,sy,sx+Math.cos(a)*len,sy+Math.sin(a)*len);
        g.addColorStop(0,`rgba(255,214,140,${0.05+0.09*L.mid})`); g.addColorStop(.6,`rgba(255,214,140,${0.02+0.03*L.mid})`); g.addColorStop(1,'rgba(255,214,140,0)');
        ctx.strokeStyle=g; ctx.lineWidth=(26+40*L.level)*dpr; ctx.globalAlpha=0.55;
        ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(sx+Math.cos(a)*len,sy+Math.sin(a)*len); ctx.stroke();
      }
      // the sun's glow
      const g2=ctx.createRadialGradient(sx,sy,0,sx,sy,H*.34);
      g2.addColorStop(0,`rgba(255,230,170,${0.22+0.26*L.level})`); g2.addColorStop(.25,`rgba(255,190,110,${0.08+0.14*L.low})`); g2.addColorStop(1,'rgba(255,190,110,0)');
      ctx.globalAlpha=1; ctx.fillStyle=g2; ctx.beginPath(); ctx.arc(sx,sy,H*.34,0,TAU); ctx.fill();
      ctx.globalCompositeOperation='source-over';
      // mist bands drifting
      s.mist.forEach(m=>{ const x=(T*m.sp+Math.sin(T*.2+m.ph)*30*dpr)%(W*1.5); const g3=ctx.createLinearGradient(0,m.y,0,m.y+m.h); g3.addColorStop(0,'rgba(255,255,255,0)'); g3.addColorStop(.5,`rgba(255,255,255,${m.a*(0.6+0.8*L.low)})`); g3.addColorStop(1,'rgba(255,255,255,0)'); ctx.fillStyle=g3; ctx.fillRect(-W*.5+x-W*.5,m.y,W*1.2,m.h); });
      // a bird now and then, on the high band
      if(Math.random()<dt*(0.04+0.4*Math.max(0,L.high-0.25))) s.birds.push({x:-20*dpr,y:H*rnd(.12,.4),v:rnd(40,70)*dpr,ph:rnd(0,TAU),s:rnd(5,9)*dpr});
      ctx.strokeStyle='rgba(30,30,30,.55)'; ctx.lineWidth=1.3*dpr; ctx.lineCap='round';
      s.birds.forEach(b=>{ b.x+=b.v*dt; b.y+=Math.sin(T*2+b.ph)*0.2*dpr; const f=Math.sin(T*7+b.ph)*b.s*.5; ctx.globalAlpha=0.8; ctx.beginPath(); ctx.moveTo(b.x-b.s,b.y-f); ctx.quadraticCurveTo(b.x,b.y+f*.4,b.x+b.s,b.y-f); ctx.stroke(); });
      s.birds=s.birds.filter(b=>b.x<W+30*dpr);
      ctx.globalAlpha=1;
    }

    function frame(L,dt){
      dt=Math.min(0.05,Math.max(0.001,dt||1/60)); T+=dt;
      ctx.clearRect(0,0,W,H);
      if(!state) init();
      if(kind==='water') drawWater(L,dt);
      else if(kind==='wind') drawWind(L,dt);
      else if(kind==='embers') drawEmbers(L,dt);
      else if(kind==='stars') drawStars(L,dt);
      else drawDawn(L,dt);
    }
    // a touch on the water
    function ripple(px,py,strength){
      if(kind!=='water'||!state) return;
      const x=px*dpr,y=py*dpr; strength=strength||1;
      state.rings.push({x,y,r:2*dpr,v:(60+40*strength)*dpr,a:0.75,w:1.6*dpr});
    }
    function still(){ // reduced motion: one quiet frame
      frame({level:.3,low:.3,mid:.3,high:.2},1/30);
    }
    function destroy(){ ctx.clearRect(0,0,W,H); state=null; }
    resize();
    return {frame,resize,ripple,destroy,setKind,still,get reduced(){return reduced;}};
  };
})();
