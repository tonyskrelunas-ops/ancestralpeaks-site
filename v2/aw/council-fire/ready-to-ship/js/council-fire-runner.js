// The Runners — The Council Fire, Prologue I. "I run with a stone in my hand."
// Seventy miles across a wide valley, from the tiring mesa to the blue mountain that combs the wet out of the wind.
// At every shelter the ones who came before pecked the knowing into the stone: a spiral (the water moves in a circle
// through the year), a deer (the moon the deer come down), a row of handprints (the names of the keepers of the road),
// and the wavy line beneath the flat line — water, below, always. At the end, in the last light, the seedlings are up,
// and two hands are laid flat on the rock with red earth blown over them, for the ones who come after.
// Symbols only, drawn on canvas. CouncilFireRunner(canvas) -> {seek(p, t)}: p in 0..1 is the scroll, t the clock.
(function(){
var clamp=function(x,a,b){ return x<a?a:x>b?b:x; };
var ease=function(x){ x=clamp(x,0,1); return x*x*(3-2*x); };
var mix=function(a,b,k){ return a+(b-a)*k; };
function rgb(c1,c2,k){ return 'rgb('+Math.round(mix(c1[0],c2[0],k))+','+Math.round(mix(c1[1],c2[1],k))+','+Math.round(mix(c1[2],c2[2],k))+')'; }
function rng(seed){ var s=seed>>>0; return function(){ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }

window.CouncilFireRunner=function(canvas){
  var ctx=canvas.getContext('2d'); var w=0,h=0,dpr=1,S=1,tall=false,lastP=0,lastT=0;
  var R=rng(23), stars=[], spray=[];
  for(var i=0;i<170;i++) stars.push({x:R(), y:R(), s:R(), p:R()*6.283});
  for(var j=0;j<260;j++) spray.push({a:R()*6.283, r:Math.sqrt(R()), s:R()});
  var road=null;

  function size(){
    var r=canvas.getBoundingClientRect(); dpr=Math.min(window.devicePixelRatio||1,2);
    var W=Math.max(1,Math.round(r.width*dpr)), H=Math.max(1,Math.round(r.height*dpr));
    if(canvas.width!==W||canvas.height!==H){ canvas.width=W; canvas.height=H; road=null; }
    w=W; h=H; S=Math.min(w,h); var t2 = h > w*1.05; if(t2!==tall){ tall=t2; road=null; }
  }
  // two compositions: wide (desktop) and tall (phone); everything is in fractions of the frame
  function lay(){
    return tall ? {
      hz:.62, mesa:{x0:-.04, x1:.34, top:.53}, mtn:{x:.80, top:.43, half:.36},
      road:[[.08,.70],[.24,.80],[.46,.74],[.62,.82],[.80,.71]],
      shelters:[.20,.42,.62,.83]
    } : {
      hz:.64, mesa:{x0:-.02, x1:.24, top:.47}, mtn:{x:.80, top:.29, half:.30},
      road:[[.14,.71],[.30,.81],[.48,.75],[.63,.82],[.79,.71]],
      shelters:[.20,.42,.62,.83]
    };
  }
  // the road as a smooth curve sampled into a polyline, with the length along it
  function buildRoad(Lx){
    var P=Lx.road.map(function(q){ return [q[0]*w, q[1]*h]; }), pts=[], N=240;
    function cr(p0,p1,p2,p3,t){ var t2=t*t,t3=t2*t; return [ .5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),
                                                              .5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3) ]; }
    var seg=P.length-1;
    for(var k=0;k<=N;k++){ var u=k/N*seg, s=Math.min(seg-1,Math.floor(u)), f=u-s;
      var p0=P[Math.max(0,s-1)], p1=P[s], p2=P[s+1], p3=P[Math.min(P.length-1,s+2)]; pts.push(cr(p0,p1,p2,p3,f)); }
    var len=[0]; for(var m=1;m<pts.length;m++){ len.push(len[m-1]+Math.hypot(pts[m][0]-pts[m-1][0], pts[m][1]-pts[m-1][1])); }
    return {pts:pts, len:len, total:len[len.length-1]};
  }
  function at(u){ // point on the road at fraction u of its length
    u=clamp(u,0,1); var L=u*road.total, a=0, b=road.len.length-1;
    while(b-a>1){ var c=(a+b)>>1; if(road.len[c]<L) a=c; else b=c; }
    var f=(L-road.len[a])/Math.max(1e-6, road.len[b]-road.len[a]); var A=road.pts[a], B=road.pts[b];
    return [A[0]+(B[0]-A[0])*f, A[1]+(B[1]-A[1])*f];
  }
  function stroke(col, lw){ ctx.strokeStyle=col; ctx.lineWidth=lw; ctx.lineCap='round'; ctx.lineJoin='round'; }

  // ── the marks pecked into the rock, revealed by k in 0..1 ─────────────
  function glyph(kind, x, y, s, k, col){
    if(k<=0) return; ctx.save(); ctx.translate(x,y); ctx.globalAlpha=Math.min(1,k*1.4); stroke(col, Math.max(1.2, s*.075));
    if(kind==='spiral'){ ctx.beginPath(); var turns=2.6, n=90; for(var i=0;i<=n*k;i++){ var a=i/n*turns*6.283, r=s*.08+s*.42*(i/n); var px=Math.cos(a)*r, py=Math.sin(a)*r; if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py); } ctx.stroke(); }
    else if(kind==='deer'){ var seg=[[-.42,0,.36,0],[-.34,0,-.40,.42],[-.20,0,-.16,.42],[.20,0,.16,.42],[.32,0,.38,.42],[.36,0,.50,-.34],[.50,-.34,.66,-.30],[.50,-.34,.40,-.72],[.40,-.72,.30,-.92],[.40,-.72,.56,-.86],[.50,-.34,.66,-.74],[.66,-.74,.80,-.88],[-.42,0,-.52,-.14]];
      var m=Math.floor(seg.length*k+.999); ctx.beginPath(); for(var d=0;d<Math.min(m,seg.length);d++){ var q=seg[d]; ctx.moveTo(q[0]*s,q[1]*s); ctx.lineTo(q[2]*s,q[3]*s); } ctx.stroke(); }
    else if(kind==='hands'){ for(var hnd=0;hnd<3;hnd++){ var kk=clamp(k*3-hnd,0,1); if(kk<=0) break; ctx.save(); ctx.translate((hnd-1)*s*.62, 0); ctx.globalAlpha=Math.min(1,kk*1.4); hand(s*.5, false); ctx.restore(); } }
    else if(kind==='water'){ ctx.beginPath(); ctx.moveTo(-s*.55,-s*.18); ctx.lineTo(-s*.55+s*1.1*Math.min(1,k*2),-s*.18); ctx.stroke();
      var kw=clamp(k*2-1,0,1); if(kw>0){ ctx.beginPath(); for(var xw=0;xw<=kw*1.1+1e-6;xw+=.02){ var X=-s*.55+xw*s, Y=s*.14+Math.sin(xw*12.5)*s*.07; if(xw===0) ctx.moveTo(X,Y); else ctx.lineTo(X,Y); } ctx.stroke(); } }
    ctx.restore();
  }
  function hand(s, fill){ // a hand, palm and five fingers, as a line or a filled shape
    ctx.beginPath(); ctx.ellipse(0, s*.22, s*.34, s*.38, 0, 0, 6.283);
    if(fill){ ctx.fill(); } else ctx.stroke();
    var F=[[-.40,-.02,-.62,-.38,.09],[-.20,-.16,-.30,-.78,.085],[0,-.20,0,-.88,.09],[.20,-.16,.30,-.80,.085],[.36,-.04,.54,-.52,.08]];
    for(var f=0;f<F.length;f++){ var q=F[f]; if(fill){ ctx.save(); ctx.lineWidth=s*q[4]*2; ctx.strokeStyle=ctx.fillStyle; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(q[0]*s,q[1]*s); ctx.lineTo(q[2]*s,q[3]*s); ctx.stroke(); ctx.restore(); }
      else { ctx.beginPath(); ctx.moveTo(q[0]*s,q[1]*s); ctx.lineTo(q[2]*s,q[3]*s); ctx.stroke(); } }
  }
  function rock(x,y,s,seed){ // a low boulder by the road
    ctx.beginPath(); ctx.moveTo(x-s*.9,y); ctx.quadraticCurveTo(x-s*.85,y-s*.62,x-s*.2,y-s*.72); ctx.quadraticCurveTo(x+s*.55,y-s*.8+seed*s*.1,x+s*.85,y-s*.25); ctx.lineTo(x+s*.95,y); ctx.closePath();
    ctx.fillStyle='rgba(58,38,26,.96)'; ctx.fill(); ctx.strokeStyle='rgba(236,186,124,.38)'; ctx.lineWidth=Math.max(1,dpr); ctx.stroke();
  }

  function seek(p, t){
    lastP=p; lastT=t; size(); var Lx=lay(); if(!road) road=buildRoad(Lx);
    var hz=Lx.hz*h, dusk=ease((p-.55)/.45);             // the run ends "in the last light"
    // sky
    var g=ctx.createLinearGradient(0,0,0,hz);
    g.addColorStop(0, rgb([44,56,82],[20,24,40],dusk)); g.addColorStop(.62, rgb([150,128,132],[92,70,86],dusk)); g.addColorStop(1, rgb([236,178,118],[214,120,74],dusk));
    ctx.fillStyle=g; ctx.fillRect(0,0,w,hz+2);
    // the first stars, as the light goes
    var sk=ease((p-.78)/.2); if(sk>0){ for(var i=0;i<stars.length;i++){ var st=stars[i]; var a=sk*(.25+.7*st.s)*(.6+.4*Math.sin(t*(1.1+st.s*2)+st.p)); ctx.fillStyle='rgba(250,244,228,'+a.toFixed(3)+')'; ctx.beginPath(); ctx.arc(st.x*w, st.y*hz*.86, (.5+st.s*1.3)*dpr, 0, 6.283); ctx.fill(); } }
    // the line of the wind, off the great water no one has seen, running the same road every year
    var M=Lx.mtn, mx=M.x*w, mtop=M.top*h, mhalf=M.half*w, shX=mx-mhalf*.42, shY=mtop+(hz-mtop)*.36;
    ctx.save(); ctx.setLineDash([S*.018,S*.016]); ctx.lineDashOffset=-t*S*.04; stroke('rgba(255,244,222,.34)', Math.max(1,dpr*1.3));
    for(var wl=0;wl<3;wl++){ var oy=(wl-1)*S*.028; ctx.beginPath(); ctx.moveTo(-w*.02, hz*.52+oy); ctx.bezierCurveTo(w*.28, hz*.42+oy, w*.48, hz*.66+oy, shX-S*.05, shY-S*.03+oy*.6); ctx.stroke(); }
    ctx.restore();
    // the blue mountain, combing the wet out of the wind
    ctx.beginPath(); ctx.moveTo(mx-mhalf, hz+1); ctx.bezierCurveTo(mx-mhalf*.62, hz-(hz-mtop)*.30, mx-mhalf*.30, mtop+(hz-mtop)*.10, mx, mtop);
    ctx.bezierCurveTo(mx+mhalf*.24, mtop+(hz-mtop)*.08, mx+mhalf*.6, hz-(hz-mtop)*.34, mx+mhalf, hz+1); ctx.closePath();
    var mg=ctx.createLinearGradient(0,mtop,0,hz); mg.addColorStop(0, rgb([92,116,152],[66,84,116],dusk)); mg.addColorStop(1, rgb([60,74,100],[40,48,70],dusk)); ctx.fillStyle=mg; ctx.fill();
    ctx.strokeStyle='rgba(222,232,246,.35)'; ctx.lineWidth=Math.max(1,dpr*1.2); ctx.stroke();
    // clouds piled against its shoulder, letting go
    ctx.save(); ctx.globalCompositeOperation='source-over';
    for(var c=0;c<9;c++){ var cx=shX+Math.cos(c*1.7)*S*.075+Math.sin(t*.12+c)*S*.006, cy=shY-S*.055+Math.sin(c*2.3)*S*.028, cr2=S*(.05+((c*37)%10)/10*.035);
      var cg=ctx.createRadialGradient(cx,cy,0,cx,cy,cr2); cg.addColorStop(0,'rgba(232,226,232,'+(.62-dusk*.22)+')'); cg.addColorStop(1,'rgba(232,226,232,0)'); ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(cx,cy,cr2,0,6.283); ctx.fill(); }
    // the rain, falling on that far shoulder and nowhere else
    stroke('rgba(214,226,242,.30)', Math.max(1,dpr*.9));
    for(var rr=0;rr<26;rr++){ var rx=shX-S*.08+rr/25*S*.17, ry0=shY-S*.02+(((t*.55+rr*.37)%1))*S*.05, rl=S*.06; ctx.beginPath(); ctx.moveTo(rx,ry0); ctx.lineTo(rx-S*.012,ry0+rl); ctx.stroke(); }
    ctx.restore();
    // the tiring mesa, home, where the runner starts
    var ms=Lx.mesa, mx0=ms.x0*w, mx1=ms.x1*w, mt=ms.top*h;
    ctx.beginPath(); ctx.moveTo(mx0, hz+1); ctx.lineTo(mx0+(mx1-mx0)*.04, mt); ctx.lineTo(mx0+(mx1-mx0)*.62, mt); ctx.lineTo(mx0+(mx1-mx0)*.70, mt+(hz-mt)*.30);
    ctx.lineTo(mx0+(mx1-mx0)*.80, mt+(hz-mt)*.36); ctx.lineTo(mx1, hz+1); ctx.closePath();
    var mgr=ctx.createLinearGradient(0,mt,0,hz); mgr.addColorStop(0, rgb([150,84,58],[112,58,44],dusk)); mgr.addColorStop(1, rgb([98,56,40],[66,38,30],dusk)); ctx.fillStyle=mgr; ctx.fill();
    ctx.beginPath(); ctx.moveTo(mx0+(mx1-mx0)*.04, mt); ctx.lineTo(mx0+(mx1-mx0)*.62, mt); ctx.strokeStyle='rgba(246,196,132,.55)'; ctx.lineWidth=Math.max(1,dpr*1.4); ctx.stroke();
    // the valley floor
    var lg=ctx.createLinearGradient(0,hz,0,h); lg.addColorStop(0, rgb([120,82,58],[86,56,42],dusk)); lg.addColorStop(.35, rgb([78,52,38],[56,38,30],dusk)); lg.addColorStop(1, rgb([40,28,22],[28,20,16],dusk));
    ctx.fillStyle=lg; ctx.fillRect(0,hz,w,h-hz);
    ctx.strokeStyle='rgba(246,206,150,.22)'; ctx.lineWidth=Math.max(1,dpr); ctx.beginPath(); ctx.moveTo(0,hz); ctx.lineTo(w,hz); ctx.stroke();

    // the run: from a slow start at home to the testing ground at the foot of the mountain
    var ux=clamp((p-.04)/.80,0,1), u=.5*(ux+ease(ux));
    // the whole road, faint; then the stretch already run, in gold
    ctx.save(); ctx.setLineDash([S*.004,S*.014]); stroke('rgba(246,226,190,.32)', Math.max(1.2,S*.0035));
    ctx.beginPath(); road.pts.forEach(function(q,k){ if(k===0) ctx.moveTo(q[0],q[1]); else ctx.lineTo(q[0],q[1]); }); ctx.stroke(); ctx.restore();
    if(u>0){ var lim=u*road.total; stroke('rgba(230,201,138,.92)', Math.max(1.4,S*.004)); ctx.beginPath();
      for(var k2=0;k2<road.pts.length;k2++){ if(road.len[k2]>lim) break; var q2=road.pts[k2]; if(k2===0) ctx.moveTo(q2[0],q2[1]); else ctx.lineTo(q2[0],q2[1]); }
      var hd=at(u); ctx.lineTo(hd[0],hd[1]); ctx.stroke(); }

    // the shelters, and the knowing pecked into their walls as he passes them
    var kinds=['spiral','deer','hands','water'], gs=S*.05;
    for(var sh=0;sh<Lx.shelters.length;sh++){ var su=Lx.shelters[sh], sp=at(su), up=S*.03;
      rock(sp[0], sp[1]-up, S*.032, sh*.3);
      var k=ease((u-su+.035)/.07);
      if(k>0){ var gx=sp[0], gy=sp[1]-up-S*.075; var halo=ctx.createRadialGradient(gx,gy,0,gx,gy,gs*1.3); halo.addColorStop(0,'rgba(255,214,150,'+(.18*k)+')'); halo.addColorStop(1,'rgba(255,214,150,0)'); ctx.fillStyle=halo; ctx.beginPath(); ctx.arc(gx,gy,gs*1.3,0,6.283); ctx.fill();
        glyph(kinds[sh], gx, gy, gs, k, 'rgba(232,150,96,.95)'); }
    }

    // the testing ground: the seedlings up in dark soil, water under the dry sand, and two hands on the rock
    var end=at(1), seed=ease((p-.80)/.08), prints=ease((p-.88)/.09);
    // the rock face at the foot of the mountain, where the ones who went ahead will sign the road
    var wx=end[0]+S*.075, wb=end[1]+S*.022, ww=S*.085, wh=S*.15;
    ctx.beginPath(); ctx.moveTo(wx-ww,wb); ctx.lineTo(wx-ww*.92,wb-wh*.72); ctx.quadraticCurveTo(wx-ww*.7,wb-wh*1.02,wx-ww*.1,wb-wh); ctx.quadraticCurveTo(wx+ww*.6,wb-wh*.98,wx+ww*.95,wb-wh*.6); ctx.lineTo(wx+ww,wb); ctx.closePath();
    var rgf=ctx.createLinearGradient(0,wb-wh,0,wb); rgf.addColorStop(0,'rgba(104,62,42,.98)'); rgf.addColorStop(1,'rgba(56,36,26,.98)'); ctx.fillStyle=rgf; ctx.fill();
    ctx.strokeStyle='rgba(246,196,132,.42)'; ctx.lineWidth=Math.max(1,dpr*1.2); ctx.stroke();
    if(seed>0){ ctx.save(); ctx.globalAlpha=seed; var sx0=end[0]-S*.115;
      ctx.fillStyle='rgba(30,22,16,.9)'; ctx.beginPath(); ctx.ellipse(sx0+S*.055, end[1]+S*.03, S*.075, S*.018, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle='rgba(120,160,190,'+(.55*seed)+')'; ctx.beginPath(); ctx.ellipse(end[0]-S*.005, end[1]+S*.036, S*.02, S*.007, 0, 0, 6.283); ctx.fill();
      stroke('rgba(150,196,112,.95)', Math.max(1.2,S*.003));
      for(var sd=0;sd<7;sd++){ var sx=sx0+S*(.004+sd*.017), sy=end[1]+S*.03, hgt=S*(.014+((sd*53)%7)/7*.01)*seed; ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(sx,sy-hgt); ctx.moveTo(sx,sy-hgt*.6); ctx.quadraticCurveTo(sx-S*.008,sy-hgt*.9,sx-S*.011,sy-hgt*.7); ctx.moveTo(sx,sy-hgt*.75); ctx.quadraticCurveTo(sx+S*.008,sy-hgt*1.05,sx+S*.012,sy-hgt*.85); ctx.stroke(); }
      ctx.restore(); }
    if(prints>0){ // two hands laid flat on the rock, red earth blown over them: the prints stay
      var rxp=wx-ww*.05, ryp=wb-wh*.55, hs=S*.036;
      ctx.save(); ctx.translate(rxp,ryp); ctx.scale(1,.62); var cloud=ctx.createRadialGradient(0,0,0,0,0,ww*.92); cloud.addColorStop(0,'rgba(200,72,44,'+(.78*prints)+')'); cloud.addColorStop(.6,'rgba(190,66,40,'+(.42*prints)+')'); cloud.addColorStop(1,'rgba(180,60,36,0)'); ctx.fillStyle=cloud; ctx.beginPath(); ctx.arc(0,0,ww*.92,0,6.283); ctx.fill(); ctx.restore();
      ctx.save(); for(var pp=0;pp<spray.length;pp++){ var o=spray[pp]; var cx2=rxp+Math.cos(o.a)*o.r*ww*.8, cy2=ryp+Math.sin(o.a)*o.r*wh*.36; var a2=prints*(.3+.6*o.s)*(1-o.r*.45); ctx.fillStyle='rgba(206,82,52,'+a2.toFixed(3)+')'; ctx.beginPath(); ctx.arc(cx2,cy2,(.6+o.s*1.5)*dpr,0,6.283); ctx.fill(); } ctx.restore();
      ctx.save(); ctx.globalAlpha=prints; ctx.fillStyle='rgba(138,92,62,1)'; ctx.translate(rxp-ww*.34, ryp+wh*.04); ctx.rotate(-.14); hand(hs, true); ctx.restore();
      ctx.save(); ctx.globalAlpha=prints; ctx.fillStyle='rgba(138,92,62,1)'; ctx.translate(rxp+ww*.32, ryp-wh*.02); ctx.rotate(.16); hand(hs, true); ctx.restore();
      // and pecked beside them: water, below, always
      glyph('water', wx+ww*.52, wb-wh*.24, S*.03, ease((p-.92)/.06), 'rgba(240,170,110,.95)');
    }

    // the runner: one warm point of light, the stone in his fist, breathing even
    if(p<.995){ var rp=at(u), br=1+.12*Math.sin(t*2.4); var fade=1-ease((p-.9)/.08);
      var rg=ctx.createRadialGradient(rp[0],rp[1]-S*.012,0,rp[0],rp[1]-S*.012,S*.04*br); rg.addColorStop(0,'rgba(255,236,196,'+(.85*fade)+')'); rg.addColorStop(.25,'rgba(255,196,120,'+(.35*fade)+')'); rg.addColorStop(1,'rgba(255,160,80,0)');
      ctx.fillStyle=rg; ctx.beginPath(); ctx.arc(rp[0],rp[1]-S*.012,S*.04*br,0,6.283); ctx.fill();
      ctx.fillStyle='rgba(255,248,232,'+fade+')'; ctx.beginPath(); ctx.arc(rp[0],rp[1]-S*.012,Math.max(2,S*.005),0,6.283); ctx.fill(); }
  }
  window.addEventListener('resize', function(){ road=null; seek(lastP,lastT); });
  return {seek:seek};
};
})();
