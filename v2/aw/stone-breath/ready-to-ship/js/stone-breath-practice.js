// The Stone Breath, counted. A smooth river pebble rests under moving water; a ring grows and settles
// with the breath. The counts are the book's own (front matter, "The Stone Breath — The Whole Practice"):
// in four, hold four, out six, hold four. One round is 18 seconds; five rounds are 90.
// Symbols only, drawn by hand in SVG. Same shape as council-tokens.js: StoneBreathPractice(host) -> {seek(t), DUR}.
(function(){
const NS='http://www.w3.org/2000/svg';
const INK='#3B3020', GOLD='#B98D3E', GOLD_TEXT='#7A5516', FAINT='#6E5E48', PAPER='#F7F0E1';
const STEPS=[['In',4],['Hold',4],['Out',6],['Hold',4]];
const ROUND=STEPS.reduce((a,s)=>a+s[1],0);   // 18
const ROUNDS=5, DUR=ROUND*ROUNDS;             // 90
const CX=500, CY=520, RP=320;                  // the pool
const R0=150, R1=300;                          // the breath ring, resting and full
const PEBBLE='M-92,4 C-94,-38 -50,-66 6,-64 C60,-62 97,-34 94,4 C91,40 50,66 -4,66 C-56,66 -90,42 -92,4 Z';
let uid=0;
function el(tag,attrs,parent){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e;}
const clamp=x=>x<0?0:x>1?1:x;
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const breathe=x=>(1-Math.cos(Math.PI*clamp(x)))/2;   // slow at both ends, like a breath
function stepAt(t){
  const tr=Math.min(Math.max(t,0),DUR-1e-6), round=Math.floor(tr/ROUND);
  let u=tr-round*ROUND, i=0;
  while(u>=STEPS[i][1]){u-=STEPS[i][1];i++;}
  return {round,i,name:STEPS[i][0],n:STEPS[i][1],u};
}
function wave(y,amp,W){   // a gentle periodic line, wider than the pool so it can drift without a seam
  let d=`M${CX-RP-W*2},${y}`;
  for(let x=CX-RP-W*2;x<CX+RP+W;x+=W) d+=` q${W/4},${-amp} ${W/2},0 t${W/2},0`;
  return d;
}
window.StoneBreathPractice=function(host,opts){
  opts=opts||{};
  const id='sbp'+(++uid);
  const svg=el('svg',{viewBox:'0 0 1000 1000',role:'img','aria-label':'The Stone Breath, counted. A smooth river pebble rests under moving water, inside a ring that grows and settles with the breath. In — four. Hold — four. Out — six. Hold — four. Five rounds.'});
  svg.style.width='100%'; svg.style.height='auto'; svg.style.display='block';
  const defs=el('defs',{},svg);
  const pg=el('radialGradient',{id:id+'p',cx:'50%',cy:'44%',r:'62%'},defs);
  [['0','#E4EDE5'],['.6','#CADCD4'],['1','#ADC6BF']].forEach(s=>el('stop',{offset:s[0],'stop-color':s[1]},pg));
  const sg=el('radialGradient',{id:id+'s',cx:'36%',cy:'30%',r:'78%'},defs);
  [['0','#C9BEAD'],['.5','#A09381'],['1','#75695A']].forEach(s=>el('stop',{offset:s[0],'stop-color':s[1]},sg));
  const blur=el('filter',{id:id+'b',x:'-50%',y:'-50%',width:'200%',height:'200%'},defs); el('feGaussianBlur',{stdDeviation:11},blur);
  const cp=el('clipPath',{id:id+'c'},defs); el('circle',{cx:CX,cy:CY,r:RP},cp);

  el('rect',{width:1000,height:1000,fill:PAPER},svg);
  el('circle',{cx:CX,cy:CY,r:RP,fill:`url(#${id}p)`},svg);
  const water=el('g',{'clip-path':`url(#${id}c)`},svg);
  // the pebble, resting on the bed
  const stone=el('g',{transform:`translate(${CX},${CY}) rotate(-11)`},water);
  el('path',{d:PEBBLE,fill:'#4F6A63',opacity:.32,filter:`url(#${id}b)`,transform:'translate(12,18)'},stone);
  el('path',{d:PEBBLE,fill:`url(#${id}s)`},stone);
  el('path',{d:'M-70,22 C-30,8 20,12 70,-4',fill:'none',stroke:'#DCD3C4','stroke-width':3,opacity:.4,'stroke-linecap':'round'},stone);
  el('ellipse',{cx:-34,cy:-30,rx:32,ry:12,fill:'#FFFFFF',opacity:.2,transform:'rotate(-6)'},stone);
  // the moving water over it
  const lines=[];
  for(let i=0;i<9;i++){
    const W=150+(i%3)*30, y=CY-256+i*64;
    const p=el('path',{d:wave(y,7+(i%2)*4,W),fill:'none',stroke:'#FFFFFF','stroke-width':i%2?2.2:3,'stroke-linecap':'round',opacity:.26},water);
    lines.push({p,W,speed:9+(i%4)*2.5,ph:i*1.7});
  }
  const ripples=[0,1,2].map(()=>el('circle',{cx:CX,cy:CY,r:120,fill:'none',stroke:'#FFFFFF','stroke-width':2.5,opacity:0},water));
  el('circle',{cx:CX,cy:CY,r:RP,fill:'none',stroke:'#9AB5AD','stroke-width':2,opacity:.55},svg);
  // the breath
  const halo=el('circle',{cx:CX,cy:CY,r:R0,fill:'none',stroke:GOLD,'stroke-width':26,opacity:.12},svg);
  const ring=el('circle',{cx:CX,cy:CY,r:R0,fill:GOLD,'fill-opacity':.05,stroke:GOLD,'stroke-width':6},svg);
  // the count
  const word=el('text',{x:CX,y:120,'text-anchor':'middle','font-family':'Fraunces, Georgia, serif','font-style':'italic','font-size':78,fill:INK,opacity:0},svg);
  const endWord=el('text',{x:CX,y:120,'text-anchor':'middle','font-family':'Fraunces, Georgia, serif','font-style':'italic','font-size':66,fill:INK,opacity:0},svg);
  endWord.textContent='Five rounds.';
  const dots=[0,1,2,3,4,5].map(()=>el('circle',{cx:CX,cy:164,r:10,fill:GOLD,'fill-opacity':0,stroke:GOLD,'stroke-width':2.5,opacity:0},svg));
  const legend=el('text',{x:CX,y:906,'text-anchor':'middle','font-family':'Inter, Helvetica, Arial, sans-serif','font-size':31,'font-weight':500,'letter-spacing':3},svg);
  const seg=STEPS.map((s,j)=>{
    if(j) { const sep=el('tspan',{fill:FAINT,opacity:.45},legend); sep.textContent='  ·  '; }
    const ts=el('tspan',{fill:FAINT},legend); ts.textContent=(s[0]+' '+s[1]).toUpperCase(); return ts;
  });
  const stones=[0,1,2,3,4].map(j=>el('ellipse',{cx:CX+(j-2)*48,cy:960,rx:14,ry:9.5,fill:'#8E8170','fill-opacity':0,stroke:FAINT,'stroke-width':2,opacity:.8},svg));
  host.appendChild(svg);

  function seek(t){
    const s=stepAt(t);
    // ring: grows over four, holds, settles over six, holds
    const k=s.i===0?breathe(s.u/4):s.i===1?1:s.i===2?1-breathe(s.u/6):0;
    const r=R0+(R1-R0)*k;
    ring.setAttribute('r',r); halo.setAttribute('r',r);
    ring.setAttribute('fill-opacity',.04+.07*k); halo.setAttribute('opacity',.09+.09*k);
    // water: slow drift, soft ripples
    lines.forEach((L,i)=>{
      const x=(t*L.speed)%L.W, y=3*Math.sin(t*.45+L.ph);
      L.p.setAttribute('transform',`translate(${x},${y})`);
      L.p.setAttribute('opacity',.2+.08*Math.sin(t*.6+L.ph));
    });
    ripples.forEach((c,j)=>{
      const p=((t/6)+j/3)%1, pp=p<0?p+1:p;
      c.setAttribute('r',112+200*pp); c.setAttribute('opacity',.26*Math.sin(Math.PI*pp));
    });
    // the count word and its dots; a short dip between steps
    const end=ease((t-(DUR-.45))/.4);
    const vis=Math.min(ease(s.u/.3),ease((s.n-s.u)/.25))*(1-end);
    word.textContent=s.name; word.setAttribute('opacity',vis);
    endWord.setAttribute('opacity',end);
    dots.forEach((d,j)=>{
      if(j>=s.n){d.setAttribute('opacity',0);return;}
      d.setAttribute('cx',CX+(j-(s.n-1)/2)*40);
      d.setAttribute('fill-opacity',ease((s.u-j)/.25));
      d.setAttribute('opacity',vis);
    });
    seg.forEach((ts,j)=>{
      const on=j===s.i?1:0;
      ts.setAttribute('fill',on&&end<.5?GOLD_TEXT:FAINT);
      ts.setAttribute('opacity',(on?1:.45)*(1-end)+.9*end);
    });
    stones.forEach((e,j)=>e.setAttribute('fill-opacity',ease((t-j*ROUND)/.8)));
  }
  seek(opts.start||0);
  return {seek,DUR,ROUND};
};
})();
