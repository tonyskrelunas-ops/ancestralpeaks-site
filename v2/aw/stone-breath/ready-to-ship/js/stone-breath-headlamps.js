// The Headlamp in the Dark — Stone Breath, chapter 21, the Swiss Alps 100.
// A night pass; switchbacks carved into rock; the headlamps of a hundred and twenty runners spiraling up
// into the dark; then, near dawn, four headlamps close in a diamond and a constellation of smaller lights
// behind them. Symbols only, drawn on canvas. StoneBreathHeadlamps(canvas) -> {seek(p)} with p in 0..1.
(function(){
function rng(seed){ var s=seed>>>0; return function(){ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }
var clamp=function(x,a,b){ return x<a?a:x>b?b:x; };
var ease=function(x){ x=clamp(x,0,1); return x*x*(3-2*x); };
window.StoneBreathHeadlamps=function(canvas){
  var ctx=canvas.getContext('2d'); var R=rng(21);
  var stars=[]; for(var i=0;i<220;i++) stars.push({x:R(),y:R()*.62,s:R(),p:R()*6.283});
  var runners=[]; for(var j=0;j<120;j++) runners.push({o:j/120, w:.2+R()*.8, p:R()*6.283});
  var small=[]; for(var k=0;k<40;k++) small.push({o:R(), d:R(), p:R()*6.283});
  // the pass: a polyline of switchbacks from bottom-left up to the saddle at upper right (unit coords)
  var path=[[0.04,0.96],[0.30,0.90],[0.12,0.84],[0.42,0.78],[0.20,0.72],[0.50,0.66],[0.30,0.60],[0.58,0.54],[0.40,0.49],[0.66,0.44],[0.50,0.40],[0.72,0.36],[0.60,0.33],[0.78,0.30]];
  var lens=[0]; for(var m=1;m<path.length;m++){ var dx=path[m][0]-path[m-1][0], dy=(path[m][1]-path[m-1][1])*1.6; lens.push(lens[m-1]+Math.sqrt(dx*dx+dy*dy)); }
  var total=lens[lens.length-1];
  function at(u){ u=clamp(u,0,1)*total; var i=1; while(i<lens.length-1 && lens[i]<u) i++; var a=path[i-1], b=path[i]; var f=(u-lens[i-1])/((lens[i]-lens[i-1])||1); return [a[0]+(b[0]-a[0])*f, a[1]+(b[1]-a[1])*f]; }
  function ridge(x){ // the mountain silhouette, unit y for unit x
    return 0.30 + 0.06*Math.sin(x*6.1) + 0.05*Math.sin(x*13.7+1.2) + 0.09*Math.pow(Math.max(0,1-Math.abs(x-0.78)*3.2),1.5) - 0.12*x; }
  var lastP=0, w=0, h=0, dpr=1;
  function size(){ var r=canvas.getBoundingClientRect(); dpr=Math.min(window.devicePixelRatio||1,2); var W=Math.max(1,Math.round(r.width*dpr)), H=Math.max(1,Math.round(r.height*dpr)); if(canvas.width!==W||canvas.height!==H){ canvas.width=W; canvas.height=H; } w=W; h=H; }
  function seek(p, t){
    p=clamp(p,0,1); lastP=p; size(); t=t||0;
    var dawn=ease((p-.72)/.28);                                     // the sky greys toward the end
    // sky
    var g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'rgb('+(14+30*dawn)+','+(17+34*dawn)+','+(28+48*dawn)+')'); g.addColorStop(1,'rgb('+(22+70*dawn)+','+(22+60*dawn)+','+(26+50*dawn)+')');
    ctx.globalCompositeOperation='source-over'; ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    // stars, fewer as dawn comes
    for(var i=0;i<stars.length;i++){ var s=stars[i]; var a=(.2+.75*s.s)*(.6+.4*Math.sin(t*1.5+s.p))*(1-dawn*.9); if(a<=0) continue; ctx.fillStyle='rgba(248,242,226,'+a.toFixed(3)+')'; ctx.beginPath(); ctx.arc(s.x*w,s.y*h,(0.5+s.s*1.4)*dpr,0,6.283); ctx.fill(); }
    // the Milky Way, a soft band
    ctx.save(); ctx.globalCompositeOperation='lighter'; var mw=ctx.createLinearGradient(0,0,w,h*.6); mw.addColorStop(0,'rgba(200,205,230,0)'); mw.addColorStop(.45,'rgba(200,205,230,'+(0.07*(1-dawn))+')'); mw.addColorStop(.55,'rgba(230,220,200,'+(0.09*(1-dawn))+')'); mw.addColorStop(1,'rgba(200,205,230,0)'); ctx.fillStyle=mw; ctx.fillRect(0,0,w,h); ctx.restore();
    // far ridge and snow
    ctx.fillStyle='rgb('+(26+26*dawn)+','+(24+22*dawn)+','+(30+22*dawn)+')'; ctx.beginPath(); ctx.moveTo(0,h);
    for(var x=0;x<=1.001;x+=.01) ctx.lineTo(x*w, ridge(x)*h); ctx.lineTo(w,h); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(235,230,220,'+(0.18+0.3*dawn)+')'; ctx.lineWidth=1.2*dpr; ctx.beginPath(); for(var x2=0;x2<=1.001;x2+=.01){ var yy=ridge(x2)*h; if(x2===0) ctx.moveTo(0,yy); else ctx.lineTo(x2*w,yy); } ctx.stroke();
    // near slope the trail climbs (darker)
    ctx.fillStyle='rgb('+(18+22*dawn)+','+(16+18*dawn)+','+(16+16*dawn)+')'; ctx.beginPath(); ctx.moveTo(0,h); ctx.lineTo(0,h*.86); ctx.quadraticCurveTo(w*.3,h*.70,w*.62,h*.46); ctx.quadraticCurveTo(w*.76,h*.36,w*.84,h*.31); ctx.lineTo(w,h*.3); ctx.lineTo(w,h); ctx.closePath(); ctx.fill();
    // the switchback trail, faint
    ctx.strokeStyle='rgba(200,190,170,'+(0.08+0.12*dawn)+')'; ctx.lineWidth=1.4*dpr; ctx.setLineDash([3*dpr,5*dpr]); ctx.beginPath(); for(var n=0;n<path.length;n++){ var pt=path[n]; if(n===0) ctx.moveTo(pt[0]*w,pt[1]*h); else ctx.lineTo(pt[0]*w,pt[1]*h); } ctx.stroke(); ctx.setLineDash([]);
    // the climb: runners spiral up through p 0..0.62; the field spreads along the pass
    var climb=ease(p/.62);
    ctx.globalCompositeOperation='lighter';
    var diamond=ease((p-.66)/.2);                                   // the four close lamps form
    for(var r=0;r<runners.length;r++){ var rr=runners[r];
      var u=clamp(0.16 + climb*1.05 - rr.o*.62 + Math.sin(t*.3+rr.p)*.004, 0, 1);   // the first runners are already on the lower switchbacks
      if(u<=0) continue;
      var pos=at(u); var px=pos[0]*w, py=pos[1]*h; var a=(.35+.65*rr.w)*(1-diamond*.55); var rad=(1.1+rr.w*1.6)*dpr;
      ctx.fillStyle='rgba(255,236,190,'+a.toFixed(3)+')'; ctx.beginPath(); ctx.arc(px,py,rad,0,6.283); ctx.fill();
      var glow=ctx.createRadialGradient(px,py,0,px,py,rad*7); glow.addColorStop(0,'rgba(255,214,140,'+(a*.28)+')'); glow.addColorStop(1,'rgba(255,200,120,0)'); ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(px,py,rad*7,0,6.283); ctx.fill(); }
    // near dawn: the diamond around him, and the constellation behind, walking him home across the saddle
    if(diamond>0){
      var walk=ease((p-.74)/.26); var cx=w*(0.56+0.26*walk), cy=h*(0.52-0.19*walk);
      var S=Math.min(w,h)*.055;
      var pts=[[0,-1.1],[-1,0],[1,0],[0,1.1]];
      for(var d=0;d<4;d++){ var dx=cx+pts[d][0]*S*diamond, dy=cy+pts[d][1]*S*diamond*.7; var ra=(2.2+.4*Math.sin(t*2+d))*dpr;
        ctx.fillStyle='rgba(255,240,205,'+(0.95*diamond)+')'; ctx.beginPath(); ctx.arc(dx,dy,ra,0,6.283); ctx.fill();
        var gl=ctx.createRadialGradient(dx,dy,0,dx,dy,ra*12); gl.addColorStop(0,'rgba(255,220,150,'+(0.35*diamond)+')'); gl.addColorStop(1,'rgba(255,200,120,0)'); ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(dx,dy,ra*12,0,6.283); ctx.fill(); }
      // him: a warm, steadier light at the center
      ctx.fillStyle='rgba(255,228,170,'+(0.9*diamond)+')'; ctx.beginPath(); ctx.arc(cx,cy,1.6*dpr,0,6.283); ctx.fill();
      // the constellation of smaller lights spreading across the trail behind them
      for(var q=0;q<small.length;q++){ var sm=small[q]; var back=ease((p-.78-sm.o*.14)/.08); if(back<=0) continue;
        var sx=cx - (0.06+sm.o*.34)*w*(1-walk*.15) + Math.sin(sm.p+t*.4)*4*dpr, sy=cy + (0.03+sm.o*.26)*h + (sm.d-.5)*h*.06;
        ctx.fillStyle='rgba(255,236,190,'+(0.75*back)+')'; ctx.beginPath(); ctx.arc(sx,sy,(1+sm.d)*dpr,0,6.283); ctx.fill(); }
    }
    ctx.globalCompositeOperation='source-over';
    // a thin dawn line on the saddle
    if(dawn>0){ var dl=ctx.createRadialGradient(w*.86,h*.30,0,w*.86,h*.30,w*.46); dl.addColorStop(0,'rgba(255,196,130,'+(0.26*dawn)+')'); dl.addColorStop(.5,'rgba(255,190,120,'+(0.08*dawn)+')'); dl.addColorStop(1,'rgba(255,200,140,0)'); ctx.save(); ctx.scale(1,.28); ctx.fillStyle=dl; ctx.beginPath(); ctx.arc(w*.86,h*.30/.28,w*.46,0,6.283); ctx.fill(); ctx.restore(); }
  }
  window.addEventListener('resize', function(){ seek(lastP); });
  return {seek:seek, redraw:function(t){ seek(lastP,t); }};
};
})();
