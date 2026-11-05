// Reading the Swell — The Far Messengers, from Nalu Kealoha-Nakamura's "Reading the Swell," Chapter One.
// "There are always several swells running. Big deep ones that have come a thousand miles from storms you will
// never see. Newer ones on top of them. Wind chop over all of it." A navigator lies down in the hull and reads it
// with his back; where a swell bends around an object, or bounces back from it, there is land beyond the horizon.
// Symbols only, drawn on canvas: the swell trains as moving contour lines seen from above; the hull; and, as you
// scroll, the deep swell separates from the chop, a reflected swell appears, and the island it announces.
// FarMessengersSwell(canvas) -> {seek(p, t)} with p in 0..1 (scroll progress) and t in seconds (the clock).
(function(){
var clamp=function(x,a,b){ return x<a?a:x>b?b:x; }; var ease=function(x){ x=clamp(x,0,1); return x*x*(3-2*x); };
window.FarMessengersSwell=function(canvas){
  var ctx=canvas.getContext('2d'); var w=0,h=0,dpr=1,lastP=0,lastT=0;
  var off=document.createElement('canvas'), octx=off.getContext('2d');   // the crests are composited over the sea, never in place of it
  function size(){ var r=canvas.getBoundingClientRect(); dpr=Math.min(window.devicePixelRatio||1,2); var W=Math.max(1,Math.round(r.width*dpr)), H=Math.max(1,Math.round(r.height*dpr)); if(canvas.width!==W||canvas.height!==H){ canvas.width=W; canvas.height=H; } w=W; h=H; }
  // swell trains: direction (radians), wavelength (fraction of the short side), speed, amplitude of the drawn line
  var trains=[
    {name:'deep',  dir:-0.62, L:.46, v:.045, amp:1.0},   // the deep one from the northeast, a thousand miles old
    {name:'new',   dir: 0.35, L:.20, v:.09,  amp:.55},   // newer, shallower
    {name:'chop',  dir: 1.25, L:.075,v:.16,  amp:.28}    // wind chop over all of it
  ];
  // the island lies beyond the horizon, off the upper right; the reflected swell comes back from it
  var ISL={x:1.02,y:-0.02};   // in short-side units; drawn later at the same spot, so the arcs come back from the land you can see
  function field(x,y,t,sel){ // sum of selected trains, as a height in -1..1
    var s=0; for(var i=0;i<trains.length;i++){ if(sel && !sel[i]) continue; var T=trains[i]; var k=2*Math.PI/(T.L); var u=x*Math.cos(T.dir)+y*Math.sin(T.dir); s+=T.amp*Math.sin(k*u - t*T.v*2*Math.PI/T.L*.35 + i); }
    return s;
  }
  function reflected(x,y,t,strength){ // a swell radiating back from the island
    var dx=x-ISL.x, dy=y-ISL.y; var r=Math.sqrt(dx*dx+dy*dy); var k=2*Math.PI/.3; return strength*0.6*Math.sin(k*r + t*0.9)*Math.exp(-r*.9);
  }
  function seek(p,t){
    p=clamp(p,0,1); lastP=p; lastT=t||0; size(); var S=Math.min(w,h);
    // the night sea
    var g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#0F1A28'); g.addColorStop(1,'#152638');
    ctx.globalCompositeOperation='source-over'; ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    var sep=ease((p-.22)/.3);          // the trains separate: the deep one brightens, the chop fades
    var refl=ease((p-.55)/.25);        // the reflected swell appears
    var isl=ease((p-.78)/.2);          // the island, beyond the horizon, announces itself
    // draw each train as contour lines: sample the field along lines, draw where height crosses thresholds
    var step=Math.max(2,Math.round(3*dpr)); var cols=Math.ceil(w/step), rows=Math.ceil(h/step);
    if(off.width!==w||off.height!==h){ off.width=w; off.height=h; }
    var img=octx.createImageData(w,h); var d=img.data;
    for(var j=0;j<h;j+=step){ for(var i=0;i<w;i+=step){
      var x=i/S, y=j/S;
      // real crests are not rulers: each train is bent a little along its length, and the deep one most slowly
      var bend0=0.035*Math.sin(2.6*(x*Math.sin(trains[0].dir)-y*Math.cos(trains[0].dir))+t*.05);
      var bend1=0.02*Math.sin(5.1*(x*Math.sin(trains[1].dir)-y*Math.cos(trains[1].dir))+1.7+t*.08);
      var deep=trains[0].amp*Math.sin(2*Math.PI/trains[0].L*(x*Math.cos(trains[0].dir)+y*Math.sin(trains[0].dir)+bend0) - t*0.35*2*Math.PI/trains[0].L*trains[0].v);
      var nw=trains[1].amp*Math.sin(2*Math.PI/trains[1].L*(x*Math.cos(trains[1].dir)+y*Math.sin(trains[1].dir)+bend1) - t*0.35*2*Math.PI/trains[1].L*trains[1].v+1);
      var ch=trains[2].amp*Math.sin(2*Math.PI/trains[2].L*(x*Math.cos(trains[2].dir)+y*Math.sin(trains[2].dir)) - t*0.35*2*Math.PI/trains[2].L*trains[2].v+2);
      var rf=reflected(x,y,t,refl);
      // brightness: broad soft crests for the deep swell, a finer newer train, and a fine chop that is texture only;
      // as the navigator separates them the chop and the newer train fade and the deep one reads alone
      var bDeep=Math.pow(Math.max(0,deep),1.8)*(0.16+0.16*sep);
      var bNew=Math.pow(Math.max(0,nw/trains[1].amp),4)*trains[1].amp*(0.20-0.17*sep);
      var bCh=Math.pow(Math.max(0,ch/trains[2].amp),5)*trains[2].amp*(0.34-0.33*sep);
      var bRf=Math.pow(Math.max(0,rf/0.6),2.2)*0.6*refl*0.7;
      var vign=1-0.4*Math.pow(Math.max(0,Math.abs(i/w-.5)*2-.35),2)-0.25*Math.pow(Math.max(0,Math.abs(j/h-.5)*2-.5),2);
      var b=Math.min(1,(bDeep+bNew+bCh+bRf)*vign);
      if(b<0.012) continue;
      var R=Math.round(100+80*b), G=Math.round(140+75*b), B=Math.round(175+60*b), A=Math.round(255*Math.min(1,b*.62));
      for(var yy=j; yy<Math.min(h,j+step); yy++){ var o=(yy*w+i)*4; for(var xx=0; xx<step && i+xx<w; xx++){ var q=o+xx*4; d[q]=R; d[q+1]=G; d[q+2]=B; d[q+3]=A; } }
    } }
    octx.putImageData(img,0,0); ctx.drawImage(off,0,0);
    // the island beyond the horizon: a low dark shape at the upper right, with a faint green under the cloud
    if(isl>0){ ctx.save(); ctx.globalAlpha=isl*.9; var ix=ISL.x*S, iy=ISL.y*S; var ir=S*.30;
      var cg=ctx.createRadialGradient(ix,iy,0,ix,iy,ir*1.6); cg.addColorStop(0,'rgba(120,170,140,.22)'); cg.addColorStop(1,'rgba(120,170,140,0)'); ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(ix,iy,ir*1.6,0,6.283); ctx.fill();
      ctx.fillStyle='#0A1218'; ctx.beginPath(); ctx.moveTo(ix-ir,iy+ir*.1); ctx.quadraticCurveTo(ix-ir*.5,iy-ir*.35,ix,iy-ir*.28); ctx.quadraticCurveTo(ix+ir*.4,iy-ir*.2,ix+ir,iy+ir*.1); ctx.closePath(); ctx.fill(); ctx.restore(); }
    // the hull, a long dark line with the navigator lying in it, drifting on the deep swell
    var hx=w*.42, hy=h*.58 + Math.sin(t*.6)*S*.012; var L=S*.30, ang=-0.62+Math.PI/2 + Math.sin(t*.25)*.02;
    ctx.save(); ctx.translate(hx,hy); ctx.rotate(ang);
    ctx.strokeStyle='rgba(12,16,22,.95)'; ctx.lineWidth=S*.028; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(-L/2,0); ctx.lineTo(L/2,0); ctx.stroke();
    ctx.strokeStyle='rgba(230,200,140,.85)'; ctx.lineWidth=Math.max(1,dpr*1.2); ctx.beginPath(); ctx.moveTo(-L/2,0); ctx.lineTo(L/2,0); ctx.stroke();
    // the body: a small warm mark at the center of the hull
    ctx.fillStyle='rgba(255,220,160,'+(0.5+0.5*sep)+')'; ctx.beginPath(); ctx.ellipse(0,0,S*.028,S*.008,0,0,6.283); ctx.fill();
    ctx.restore();
    // a thin horizon of stars at the top when the island shows (night; the navigator's eyes are closed)
    ctx.globalCompositeOperation='source-over';
  }
  window.addEventListener('resize', function(){ seek(lastP,lastT); });
  return {seek:seek, redraw:function(t){ seek(lastP,t); }};
};
})();
