// Ancestral Peaks — agent 3. The voice chain for the Listening Room and the Practice, built on the shared
// sound layer (shared/site.js, window.AP). AP.sound owns the context, the beds and the small tones; this file
// adds what the full-screen player needs: an analyser on the session voice so the picture can move with it,
// an envelope fallback for pages opened from a folder, and a forced level for the frame renderer.
(function(){
  let an=null, data=null, ctx=null, forced=null, env=null, envRate=25, lastSignal=0, idlePhase=0, tainted=false;
  const sources=new WeakMap();
  const sm={level:0,low:0,mid:0,high:0};
  function ctxNow(){ ctx=(window.AP&&AP.sound&&AP.sound.ensure())||null; return ctx; }
  // The voice: a media element the picture listens to. Over file:// Web Audio keeps the element opaque, so skip.
  function attach(el){
    if(!ctxNow()) return false;
    if(window.AP&&AP.fileMode) return false;
    if((/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1))) return false;   // 11/8: iPhone silent switch mutes Web Audio; let the voice play straight
    if(sources.has(el)) return true;
    try{
      const s=ctx.createMediaElementSource(el);
      if(!an){ an=ctx.createAnalyser(); an.fftSize=1024; an.smoothingTimeConstant=.78; data=new Uint8Array(an.frequencyBinCount); an.connect(ctx.destination); }
      s.connect(an);
      sources.set(el,s); return true;
    }catch(e){ return false; }
  }
  // envelope (low, mid, high bytes at 25 fps, base64) from media/env/<id>.env.js, loaded on demand
  function setEnv(j){ env=null; if(j&&j.data){ env={bytes:Uint8Array.from(atob(j.data),c=>c.charCodeAt(0)),rate:j.rate||25}; envRate=env.rate; } }
  function loadEnv(url,id){
    return new Promise(res=>{
      if(window.PEAKS_ENV&&window.PEAKS_ENV[id]){ setEnv(window.PEAKS_ENV[id]); return res(true); }
      const s=document.createElement('script'); s.src=url; s.onload=()=>{ setEnv(window.PEAKS_ENV&&window.PEAKS_ENV[id]); res(!!env); }; s.onerror=()=>res(false); document.head.appendChild(s);
    });
  }
  function fromEnv(t){
    if(!env) return null;
    const i=Math.floor(t*envRate)*3, E=env.bytes;
    if(i+2>=E.length) return null;
    const low=E[i]/255, mid=E[i+1]/255, high=E[i+2]/255;
    return {low,mid,high,level:Math.min(1,(low+mid+high)/2.2)};
  }
  // Levels for the picture, 0..1 each: analyser (http) -> envelope at the audio's time -> a slow idle breath.
  function levels(audio,dt){
    dt=dt||1/60;
    let L=null;
    if(forced!==null){ L={level:forced,low:forced*.9,mid:forced,high:forced*.7}; }
    else if(an&&!tainted&&audio&&!audio.paused){
      an.getByteFrequencyData(data);
      const hz=ctx.sampleRate/an.fftSize;
      const band=(a,b)=>{ let s=0,n=0; for(let i=Math.max(1,Math.floor(a/hz));i<Math.min(data.length,Math.ceil(b/hz));i++){ s+=data[i]; n++; } return n?s/n/255:0; };
      const low=band(60,250), mid=band(250,2500), high=band(2500,8000);
      if(low+mid+high>0.002){ lastSignal=performance.now(); L={low:Math.min(1,low*1.5),mid:Math.min(1,mid*2.1),high:Math.min(1,high*3.2)}; L.level=Math.min(1,(low*.35+mid*.95+high*.6)*1.25); }
      else if(audio.currentTime>1.2 && performance.now()-lastSignal>1500){ tainted=true; }
    }
    if(!L&&audio&&!audio.paused){ L=fromEnv(audio.currentTime); }
    if(!L){
      idlePhase+=dt; const b=0.5+0.5*Math.sin(idlePhase*0.8);
      L={level:0.10+0.14*b,low:0.08+0.1*b,mid:0.10+0.12*b,high:0.04+0.07*(0.5+0.5*Math.sin(idlePhase*2.1))};
    }
    const k=(t,c)=>c+(t-c)*(t>c?Math.min(1,dt*16):Math.min(1,dt*4.5));
    sm.level=k(L.level,sm.level); sm.low=k(L.low,sm.low); sm.mid=k(L.mid,sm.mid); sm.high=k(L.high,sm.high);
    return sm;
  }
  function levelsAt(t){ // deterministic, for the renderer: straight from the envelope
    const L=fromEnv(t)||{level:.12,low:.1,mid:.12,high:.05}; return L;
  }
  function force(v){ forced=(v===null||v===undefined)?null:Math.max(0,Math.min(1,v)); }
  function cue(name){
    const S=window.AP&&AP.sound; if(!S||!S.on) return;
    const T=(f,d,g,w)=>setTimeout(()=>S.tone(f,d,g),w||0);
    if(name==='tick') S.tone(1175,.09,.012);
    else if(name==='open'){ T(293.66,.9,.035); T(440,1.2,.03,120); }
    else if(name==='close'){ T(440,.5,.025); T(293.66,.9,.03,100); }
    else if(name==='done'){ T(293.66,2.2,.04); T(369.99,2.2,.03,150); T(440,2.6,.028,300); }
    else if(name==='step') S.tone(329.63,.6,.02);
  }
  window.PeaksVoice={attach,loadEnv,setEnv,levels,levelsAt,force,cue,get tainted(){return tainted;}};
})();
