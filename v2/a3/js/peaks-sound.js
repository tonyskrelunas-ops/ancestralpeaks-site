// Ancestral Peaks — the sound graph for the Listening Room and the Practice.
// One AudioContext, made on the first gesture. The session voice runs through an analyser so the
// picture can move with it. The five scene beds (dawn, ocean, desert, hearth, creek) each have a gain
// so they can crossfade. Small interaction tones are synthesized here, so no sound files are needed for them.
(function(){
  const BEDS=['dawn','ocean','desert','hearth','creek'];
  let ctx=null, master=null, analyser=null, data=null, voiceGain=null, bedMaster=null;
  const beds={};            // scene -> {el, gain}
  const sources=new WeakMap();
  let bedScene=null, bedWanted=0, soundOn=false, forced=null, lastNonZero=0, fallbackPhase=0;
  const sm={level:0,low:0,mid:0,high:0};
  let bedBase='';

  function ensure(){
    if(!ctx){
      try{
        ctx=new (window.AudioContext||window.webkitAudioContext)();
        master=ctx.createGain(); master.gain.value=1; master.connect(ctx.destination);
        bedMaster=ctx.createGain(); bedMaster.gain.value=0; bedMaster.connect(master);
        voiceGain=ctx.createGain(); voiceGain.gain.value=1; voiceGain.connect(master);
        analyser=ctx.createAnalyser(); analyser.fftSize=1024; analyser.smoothingTimeConstant=.8;
        data=new Uint8Array(analyser.frequencyBinCount);
      }catch(e){ ctx=null; }
    }
    if(ctx&&ctx.state==='suspended') ctx.resume().catch(()=>{});
    return ctx;
  }
  // The voice: a media element the picture listens to.
  function attachVoice(el){
    if(!ensure()) return false;
    if(sources.has(el)) return true;
    try{
      const s=ctx.createMediaElementSource(el);
      s.connect(voiceGain); s.connect(analyser);
      sources.set(el,s); return true;
    }catch(e){ return false; }
  }
  // The beds: five loops, each with its own gain under one bed master.
  function setBedBase(path){ bedBase=path; }
  function bed(scene,opts){
    opts=opts||{};
    if(!scene||BEDS.indexOf(scene)<0) return;
    bedScene=scene;
    if(!soundOn) return;
    if(!ensure()) return;
    const now=ctx.currentTime, T=opts.time||1.8;
    BEDS.forEach(s=>{
      if(s===scene && !beds[s]){
        const el=new Audio(); el.loop=true; el.preload='auto'; el.crossOrigin='anonymous';
        el.src=bedBase+'bed-'+s+'.mp3';
        const g=ctx.createGain(); g.gain.value=0; g.connect(bedMaster);
        try{ const src=ctx.createMediaElementSource(el); src.connect(g); }catch(e){}
        beds[s]={el,gain:g};
      }
      const b=beds[s]; if(!b) return;
      const target=s===scene?1:0;
      b.gain.gain.cancelScheduledValues(now);
      b.gain.gain.setValueAtTime(b.gain.gain.value,now);
      b.gain.gain.linearRampToValueAtTime(target,now+T);
      if(target>0){ b.el.play().catch(()=>{}); }
      else { setTimeout(()=>{ if(bedScene!==s){ try{b.el.pause();}catch(e){} } }, T*1000+100); }
    });
  }
  function bedLevel(v,T){
    bedWanted=v;
    if(!ctx) return;
    const now=ctx.currentTime; T=T||1.6;
    bedMaster.gain.cancelScheduledValues(now);
    bedMaster.gain.setValueAtTime(bedMaster.gain.value,now);
    bedMaster.gain.linearRampToValueAtTime(soundOn?v:0,now+T);
  }
  function setSound(on){
    soundOn=!!on;
    if(soundOn){ ensure(); if(bedScene) bed(bedScene,{time:2.4}); bedLevel(bedWanted||0.9,2.4); }
    else { if(ctx){ bedLevel(0,1.2); } }
    try{ localStorage.setItem('ap.sound', soundOn?'1':'0'); }catch(e){}
  }
  function isOn(){ return soundOn; }
  // Small tones, D major, very quiet.
  function tone(f,dur,gain,type,when){
    if(!ensure()) return;
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.type=type||'sine'; o.frequency.value=f; g.gain.value=0;
    o.connect(g); g.connect(master);
    const n=ctx.currentTime+(when||0);
    g.gain.setValueAtTime(0,n);
    g.gain.linearRampToValueAtTime(gain,n+.04);
    g.gain.exponentialRampToValueAtTime(.0001,n+dur);
    o.start(n); o.stop(n+dur+.05);
  }
  const NOTE={A3:220,D4:293.66,E4:329.63,Fs4:369.99,A4:440,D5:587.33};
  function cue(name){
    if(!soundOn && name!=='breath') return;
    switch(name){
      case 'tick': tone(NOTE.D5,.09,.012); break;
      case 'open': tone(NOTE.D4,.9,.035); tone(NOTE.A4,1.2,.03,'sine',.12); break;
      case 'close': tone(NOTE.A4,.5,.025); tone(NOTE.D4,.9,.03,'sine',.1); break;
      case 'done': tone(NOTE.D4,2.2,.04); tone(NOTE.Fs4,2.2,.03,'sine',.15); tone(NOTE.A4,2.6,.028,'sine',.3); break;
      case 'step': tone(NOTE.E4,.6,.02); break;
    }
  }
  // Levels for the picture. Low 60–250 Hz, mid 250–2500, high 2500–8000, each 0..1.
  function levels(dt){
    dt=dt||1/60;
    let level=0,low=0,mid=0,high=0, ok=false;
    if(forced!==null){ level=forced; low=forced*.9; mid=forced; high=forced*.7; ok=true; }
    else if(analyser){
      analyser.getByteFrequencyData(data);
      const hz=ctx.sampleRate/analyser.fftSize;
      const band=(a,b)=>{ let s=0,n=0; for(let i=Math.floor(a/hz);i<Math.min(data.length,Math.ceil(b/hz));i++){ s+=data[i]; n++; } return n?s/n/255:0; };
      low=band(60,250); mid=band(250,2500); high=band(2500,8000);
      level=Math.min(1,(low*.35+mid*.9+high*.6)*1.15);
      if(level>0.004){ lastNonZero=performance.now(); ok=true; }
      else if(performance.now()-lastNonZero<1500) ok=true;
    }
    if(!ok){
      // No analyser signal (first frames, or a browser that keeps file:// audio opaque): a slow breath-like idle.
      fallbackPhase+=dt;
      const b=0.5+0.5*Math.sin(fallbackPhase*0.9);
      level=0.12+0.16*b; low=0.1+0.1*b; mid=level; high=0.05+0.08*(0.5+0.5*Math.sin(fallbackPhase*2.3));
    }
    const k=(t,c)=>c+(t-c)*(t>c?Math.min(1,dt*14):Math.min(1,dt*4));
    sm.level=k(level,sm.level); sm.low=k(low,sm.low); sm.mid=k(mid,sm.mid); sm.high=k(high,sm.high);
    return sm;
  }
  function force(v){ forced=(v===null||v===undefined)?null:Math.max(0,Math.min(1,v)); }
  function duckVoice(v,T){ if(!ctx) return; const n=ctx.currentTime; voiceGain.gain.cancelScheduledValues(n); voiceGain.gain.setValueAtTime(voiceGain.gain.value,n); voiceGain.gain.linearRampToValueAtTime(v,n+(T||.4)); }
  function context(){ return ctx; }
  window.PeaksSound={ensure,attachVoice,setBedBase,bed,bedLevel,setSound,isOn,cue,tone,levels,force,duckVoice,context,BEDS};
})();
