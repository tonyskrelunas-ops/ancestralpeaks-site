// The star compass of The Far Messengers. Symbols only, drawn by hand in SVG.
// The book's own description (Reading the Swell, Chapter One): thirty-two points, perfectly spaced;
// "each one known by the exact point on the horizon where it rises and the exact point where it sets,
// one star handing the steersman to the next as it climbed too high to use."
// No star names and no house names are drawn: the book keeps those as the teacher's.
// The road each star travels is real sky geometry (a star of one declination, seen from 21 degrees north).
(function(){
const NS='http://www.w3.org/2000/svg';
const INK='#3B3020', GOLD='#B98D3E', GOLD_DEEP='#91691F', GOLD_LIGHT='#D7B071', PAPER='#F7F0E1', DOME='#EEE1C6';
const D=Math.PI/180;
function el(tag,attrs,parent){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e;}
const ease=x=>x<0?0:x>1?1:x*x*(3-2*x);

window.FarMessengersStars=function(host,opts){
  opts=opts||{};
  const words=opts.words!==false;
  const CX=500, CY=520, R=330, N=32, STEP=360/N;
  const svg=el('svg',{viewBox:words?'0 0 1000 1000':'110 130 780 780',role:'img',
    'aria-label':'A star compass of thirty-two points around a double-hulled canoe. A star rises at one point on the horizon, climbs and fades, and the next star rises at the same point while the canoe holds its heading.'});
  svg.style.width='100%'; svg.style.height='auto'; svg.style.display='block';
  el('rect',{x:0,y:0,width:1000,height:1000,fill:PAPER},svg);

  // ---- the sky geometry: the rising point sits exactly on the seventh point clockwise from the top
  const PHI=21*D, K=7, THR=K*STEP*D;               // screen angle of the rising point, clockwise from up
  const AZR=Math.PI-THR;                            // azimuth from north (screen = 180 - azimuth: south up, east right)
  const DEC=Math.asin(Math.cos(AZR)*Math.cos(PHI));
  const H0=Math.acos(-Math.tan(PHI)*Math.tan(DEC)); // rises at hour angle -H0, sets at +H0
  function sky(H){
    const sa=Math.sin(PHI)*Math.sin(DEC)+Math.cos(PHI)*Math.cos(DEC)*Math.cos(H);
    const alt=Math.asin(Math.max(-1,Math.min(1,sa)));
    const x=-Math.cos(DEC)*Math.sin(H), y=Math.sin(DEC)*Math.cos(PHI)-Math.cos(DEC)*Math.cos(H)*Math.sin(PHI);
    const az=Math.atan2(x,y), th=Math.PI-az, r=R*Math.max(0,(90-alt/D)/90);
    return {x:CX+r*Math.sin(th), y:CY-r*Math.cos(th), alt:alt/D};
  }
  function hourAt(altDeg){ // the rising-side hour angle at which the star stands at this altitude
    return -Math.acos((Math.sin(altDeg*D)-Math.sin(PHI)*Math.sin(DEC))/(Math.cos(PHI)*Math.cos(DEC)));
  }
  const pt=(deg,r)=>({x:CX+r*Math.sin(deg*D), y:CY-r*Math.cos(deg*D)});

  // ---- the horizon and its thirty-two points
  const defs=el('defs',{},svg), gid='fms-dome-'+Math.random().toString(36).slice(2,8);
  const rg=el('radialGradient',{id:gid,cx:'50%',cy:'50%',r:'50%'},defs);
  el('stop',{offset:'0%','stop-color':'#FAF4E6'},rg); el('stop',{offset:'100%','stop-color':DOME},rg);
  const dome=el('circle',{cx:CX,cy:CY,r:R,fill:`url(#${gid})`},svg);
  const CIRC=2*Math.PI*R;
  const ring=el('circle',{cx:CX,cy:CY,r:R,fill:'none',stroke:INK,'stroke-width':2.4,'stroke-opacity':.62,
    'stroke-dasharray':CIRC,'stroke-dashoffset':CIRC,transform:`rotate(-90 ${CX} ${CY})`},svg);
  const ticks=[];
  for(let i=0;i<N;i++){
    const a=i*STEP, p1=pt(a,R-10), p2=pt(a,R+16);
    ticks.push(el('line',{x1:p1.x,y1:p1.y,x2:p2.x,y2:p2.y,stroke:INK,'stroke-width':2.2,'stroke-linecap':'round',opacity:0},svg));
  }
  // the two houses this road uses: where the star rises, and where it sets
  function house(deg){
    const g=el('g',{opacity:0},svg);
    const a0=deg-STEP/2+1.2, a1=deg+STEP/2-1.2, q0=pt(a0,R), q1=pt(a1,R);
    el('path',{d:`M${q0.x},${q0.y} A${R},${R} 0 0 1 ${q1.x},${q1.y}`,fill:'none',stroke:GOLD,'stroke-width':7,'stroke-linecap':'round','stroke-opacity':.55},g);
    const p1=pt(deg,R-16), p2=pt(deg,R+28);
    el('line',{x1:p1.x,y1:p1.y,x2:p2.x,y2:p2.y,stroke:GOLD_DEEP,'stroke-width':3.4,'stroke-linecap':'round'},g);
    return g;
  }
  const riseHouse=house(K*STEP), setHouse=house(-K*STEP);

  // ---- the road: one fixed path across the sky, rising point to setting point
  const ROADN=64, road=[];
  for(let j=0;j<=ROADN;j++){
    const p=sky(-H0+2*H0*j/ROADN);
    road.push(el('circle',{cx:p.x,cy:p.y,r:3,fill:GOLD_DEEP,opacity:0},svg));
  }

  // ---- the canoe at the center: two hulls lashed side by side, the deck between them
  const RISE=sky(-H0);
  const head=el('line',{x1:CX,y1:CY,x2:RISE.x,y2:RISE.y,stroke:GOLD_DEEP,'stroke-width':2,'stroke-dasharray':'3 9','stroke-linecap':'round',opacity:0},svg);
  const canoe=el('g',{opacity:0},svg);
  const hullD='M-86,0 C-72,-9 52,-10 90,-1 L92,0 L90,1 C52,10 -72,9 -86,0 Z';
  for(const yy of [-27,27]){
    el('line',{x1:-128,y1:yy*1.6,x2:-92,y2:yy*1.05,stroke:INK,'stroke-width':1.6,'stroke-opacity':.22,'stroke-linecap':'round'},canoe); // faint wake
  }
  for(const yy of [-27,27]){
    const h=el('g',{transform:`translate(0,${yy})`},canoe);
    el('path',{d:hullD,fill:'#6B4A2E',stroke:'#4E3520','stroke-width':2,'stroke-linejoin':'round'},h);
    el('path',{d:'M-70,-2 C-30,-5 40,-5 78,-1',fill:'none',stroke:'#9A7048','stroke-width':2,'stroke-linecap':'round'},h);
  }
  for(const xx of [-48,-6,36]) el('rect',{x:xx-4,y:-40,width:8,height:80,rx:3,fill:'#5A3E26'},canoe);
  el('rect',{x:-34,y:-17,width:56,height:34,rx:3,fill:'#B08A5C',stroke:'#7E5A36','stroke-width':1.6},canoe);
  for(const xx of [-22,-10,2,14]) el('line',{x1:xx,y1:-17,x2:xx,y2:17,stroke:'#8E6A42','stroke-width':1.2},canoe);
  el('line',{x1:-86,y1:27,x2:-120,y2:33,stroke:'#4E3520','stroke-width':4,'stroke-linecap':'round'},canoe); // steering paddle
  const CANOE_ROT=K*STEP-90;

  // ---- the stars: one shape, hand-built; each travels the same road
  function makeStar(){
    const g=el('g',{opacity:0},svg);
    el('circle',{r:30,fill:GOLD_LIGHT,opacity:.32},g);
    el('circle',{r:17,fill:GOLD_LIGHT,opacity:.42},g);
    el('path',{d:'M0,-30 C3,-8 8,-3 30,0 C8,3 3,8 0,30 C-3,8 -8,3 -30,0 C-8,-3 -3,-8 0,-30 Z',fill:GOLD,stroke:GOLD_DEEP,'stroke-width':1.6,'stroke-linejoin':'round'},g);
    el('circle',{r:3.4,fill:'#FFF6DE'},g);
    return g;
  }
  const HIGH=42, FADE_FROM=24, LOW_REST=13;       // too high to use by about forty degrees
  const HHIGH=hourAt(HIGH), HREST=hourAt(LOW_REST);
  const CLIMB=6.0, RATE=(HHIGH+H0)/CLIMB;         // every star climbs at the same pace
  const STARS=[{t:3.6,last:false},{t:7.4,last:false},{t:11.2,last:true}].map(s=>Object.assign(s,{g:makeStar()}));

  // ---- the words (left off on the book page, where the heading and caption carry them)
  let cap1=null, cap2=null;
  if(words){
    cap1=el('text',{x:500,y:96,'text-anchor':'middle','font-family':'Fraunces, Georgia, serif','font-size':44,fill:INK,'font-style':'italic'},svg);
    cap1.textContent='The stars overhead ran their fixed roads.';
    cap2=el('text',{x:500,y:948,'text-anchor':'middle','font-family':'Inter, Helvetica, sans-serif','font-size':24,fill:GOLD,'letter-spacing':4},svg);
    cap2.textContent='THE FAR MESSENGERS';
  }
  host.appendChild(svg);

  const DUR=16;
  function seek(t){
    ring.setAttribute('stroke-dashoffset',CIRC*(1-ease((t-0.15)/1.7)));
    dome.setAttribute('opacity',ease((t-0.1)/1.4));
    ticks.forEach((k,i)=>k.setAttribute('opacity',0.58*ease((t-0.35-i*0.042)/0.35)));
    const cin=ease((t-1.4)/1.0);
    canoe.setAttribute('opacity',cin);
    canoe.setAttribute('transform',`translate(${CX},${CY}) rotate(${CANOE_ROT}) scale(${0.94+0.06*cin})`);
    riseHouse.setAttribute('opacity',ease((t-2.2)/0.9));
    setHouse.setAttribute('opacity',0.75*ease((t-3.0)/0.9));
    head.setAttribute('opacity',0.5*ease((t-2.5)/0.9));
    road.forEach((d,j)=>d.setAttribute('opacity',0.5*ease((t-2.6-j/ROADN*1.6)/0.35)));
    STARS.forEach(s=>{
      const dt=t-s.t;
      if(dt<=0){ s.g.setAttribute('opacity',0); return; }
      let H;
      if(s.last){ const span=HREST+H0; H=-H0+span*(1-Math.exp(-dt*RATE/span)); }
      else H=-H0+dt*RATE;
      const p=sky(H);
      const born=ease(dt/0.9);
      const fade=s.last?1:1-ease((p.alt-FADE_FROM)/(HIGH-FADE_FROM));
      s.g.setAttribute('opacity',born*fade);
      s.g.setAttribute('transform',`translate(${p.x.toFixed(2)},${p.y.toFixed(2)}) scale(${(0.7+0.3*born).toFixed(3)})`);
    });
    if(cap1) cap1.setAttribute('opacity',ease((t-0.5)/1.0));
    if(cap2) cap2.setAttribute('opacity',ease((t-13.8)/1.4));
  }
  seek(opts.start||0);
  return {seek,DUR};
};
})();
