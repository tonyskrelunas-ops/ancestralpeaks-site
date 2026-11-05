// The twelve tokens of The Council Fire gather into one place. Symbols only, drawn by hand in SVG.
// Order, names and tokens are the book's own table ("Twelve peoples. Twelve tokens. One fire.").
(function(){
const NS='http://www.w3.org/2000/svg';
const K=[['Käthe','lump of coal','coal'],['Ugnė','amber bead','amber'],['Illary','carved stone llama','llama'],
['Nizhoní','river stone','river'],['Aoi','black go stone','go'],['Vahan','stone cross','cross'],
['Lobsang','mala of bodhi seeds','mala'],['Te Rangi','pounamu','pounamu'],['Warrun','spinifex resin','resin'],
['Kiprono','beaded bracelet','bracelet'],['Hamish','granite clan stone','granite'],['Chariya','rice seed','rice']];
const INK='#3B3020', GOLD='#B98D3E', PAPER='#F7F0E1';
function el(tag,attrs,parent){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e;}
function token(kind,g){
  switch(kind){
  case 'coal': el('polygon',{points:'-24,6 -16,-16 2,-22 22,-12 26,8 10,22 -12,20',fill:'#2B2724'},g);
    el('polyline',{points:'-16,-16 -2,0 22,-12',fill:'none',stroke:'#5A534C','stroke-width':2},g);
    el('polyline',{points:'-2,0 10,22',fill:'none',stroke:'#4A443F','stroke-width':2},g); break;
  case 'amber': el('circle',{r:24,fill:'#D69A3C',stroke:'#9C6A1E','stroke-width':2.5},g);
    el('ellipse',{cx:-8,cy:-9,rx:8,ry:5,fill:'#F3D08A'},g); el('circle',{r:4.5,fill:'#7A5216'},g); break;
  case 'llama': { const s={fill:'#A39B8F',stroke:'#6F685E','stroke-width':2};
    el('ellipse',Object.assign({cx:-4,cy:4,rx:19,ry:10},s),g);
    el('path',Object.assign({d:'M8,0 L10,-24 L18,-24 L17,2 Z'},s),g);
    el('ellipse',Object.assign({cx:19,cy:-25,rx:8,ry:5},s),g);
    el('path',Object.assign({d:'M11,-28 L12,-37 L15,-29 M16,-29 L18,-37 L20,-29'},s),g);
    for(const x of [-18,-10,2,10]) el('rect',Object.assign({x:x,y:10,width:5,height:16,rx:2},s),g);
    el('path',Object.assign({d:'M-22,0 Q-28,-4 -25,-9'},{fill:'none',stroke:'#6F685E','stroke-width':4,'stroke-linecap':'round'}),g); break; }
  case 'river': el('ellipse',{rx:27,ry:18,fill:'#8C7F6E',stroke:'#6A5F51','stroke-width':2},g);
    el('ellipse',{cx:-5,cy:-4,rx:11,ry:6,fill:'#B5A893'},g); break;
  case 'go': el('ellipse',{rx:25,ry:21,fill:'#1C1C1E'},g); el('ellipse',{cx:-8,cy:-9,rx:9,ry:4,fill:'#55555C'},g); break;
  case 'cross': el('path',{d:'M-5,-26 L5,-26 L4,-8 L22,-9 L22,1 L4,0 L6,26 L-6,26 L-4,0 L-22,1 L-22,-9 L-4,-8 Z',fill:'#B5745A',stroke:'#8A5440','stroke-width':2,'stroke-linejoin':'round'},g); break;
  case 'mala': for(let i=0;i<16;i++){const a=i/16*Math.PI*2-Math.PI/2; el('circle',{cx:20*Math.cos(a),cy:20*Math.sin(a)-2,r:4.6,fill:'#7A4E2D',stroke:'#5A3820','stroke-width':1},g);}
    el('circle',{cx:0,cy:22,r:6,fill:'#8C5A34',stroke:'#5A3820','stroke-width':1},g);
    el('path',{d:'M0,28 L-4,40 M0,28 L0,41 M0,28 L4,40',stroke:'#B23A2E','stroke-width':2.5,'stroke-linecap':'round'},g); break;
  case 'pounamu': el('path',{d:'M0,-28 C14,-20 20,0 14,16 C9,27 -9,27 -14,16 C-20,0 -14,-20 0,-28 Z',fill:'#3F8F5E',stroke:'#2C6B45','stroke-width':2},g);
    el('circle',{cx:0,cy:-14,r:4,fill:PAPER},g); el('path',{d:'M-5,4 C-2,12 6,12 7,4',fill:'none',stroke:'#7CC096','stroke-width':2.5,'stroke-linecap':'round'},g); break;
  case 'resin': el('path',{d:'M-22,4 C-24,-12 -8,-22 6,-18 C20,-15 26,-2 20,10 C14,22 -2,24 -12,18 C-18,15 -21,10 -22,4 Z',fill:'#6E3B1E',stroke:'#4E2A15','stroke-width':2},g);
    el('ellipse',{cx:-4,cy:-8,rx:7,ry:4,fill:'#A0612F'},g); break;
  case 'bracelet': { const C=['#C0392B','#F2EEE6','#2D5DA8','#3E8E4E']; for(let i=0;i<18;i++){const a=i/18*Math.PI*2; el('circle',{cx:22*Math.cos(a),cy:22*Math.sin(a),r:4.6,fill:C[i%4],stroke:'#4a3d2c','stroke-width':0.8},g);} break; }
  case 'granite': el('path',{d:'M-24,-10 C-22,-22 18,-24 24,-12 C28,0 26,16 14,22 C0,27 -18,24 -24,12 C-27,4 -26,-4 -24,-10 Z',fill:'#A7A39B',stroke:'#78746D','stroke-width':2},g);
    { let s=7; const r=()=>{s=(s*9301+49297)%233280;return s/233280;}; for(let i=0;i<26;i++){el('circle',{cx:(r()-.5)*40,cy:(r()-.5)*36,r:1.3+r()*1.6,fill:i%3?'#5F5B55':'#E1DDD4'},g);} } break;
  case 'rice': { const r=el('g',{transform:'rotate(24)'},g); el('ellipse',{rx:9,ry:24,fill:'#E3C98A',stroke:'#B89B5A','stroke-width':2},r);
    el('line',{x1:0,y1:-18,x2:0,y2:18,stroke:'#C9AE6E','stroke-width':1.6},r); break; }
  }
}
window.CouncilTokens=function(host,opts){
  opts=opts||{};
  const svg=el('svg',{viewBox:'0 0 1000 1000',role:'img','aria-label':'The twelve tokens of The Council Fire gather into one place: a lump of coal, an amber bead, a carved stone llama, a river stone, a black go stone, a stone cross, a mala of bodhi seeds, a pounamu, spinifex resin, a beaded bracelet, a granite clan stone and a rice seed.'});
  svg.style.width='100%'; svg.style.height='auto'; svg.style.display='block';
  el('rect',{width:1000,height:1000,fill:PAPER},svg);
  const CX=500, CY=545, R=290;
  const glow=el('circle',{cx:CX,cy:CY+10,r:120,fill:'#E9A646',opacity:0},svg);
  const fire=el('g',{},svg);
  el('rect',{x:-46,y:30,width:92,height:13,rx:6,fill:'#6B4A2E',transform:'rotate(14)'},fire);
  el('rect',{x:-46,y:30,width:92,height:13,rx:6,fill:'#7E5636',transform:'rotate(-14)'},fire);
  const f1=el('path',{d:'M0,-70 C22,-40 40,-18 34,10 C30,30 14,40 0,40 C-14,40 -30,30 -34,10 C-40,-18 -22,-40 0,-70 Z',fill:'#D9822B'},fire);
  const f2=el('path',{d:'M0,-42 C14,-22 24,-8 20,12 C17,26 8,32 0,32 C-8,32 -17,26 -20,12 C-24,-8 -14,-22 0,-42 Z',fill:'#E8A93C'},fire);
  const f3=el('path',{d:'M0,-18 C7,-8 11,0 9,12 C8,20 4,24 0,24 C-4,24 -8,20 -9,12 C-11,0 -7,-8 0,-18 Z',fill:'#F6D27A'},fire);
  const cap1=el('text',{x:500,y:78,'text-anchor':'middle','font-family':'Fraunces, Georgia, serif','font-size':44,fill:INK,'font-style':'italic'},svg); cap1.textContent='Twelve peoples. Twelve tokens. One fire.';
  const cap2=el('text',{x:500,y:880,'text-anchor':'middle','font-family':'Fraunces, Georgia, serif','font-size':46,fill:INK,'font-style':'italic'},svg); cap2.textContent='And at the end, a child holds them all.';
  const cap3=el('text',{x:500,y:940,'text-anchor':'middle','font-family':'Inter, Helvetica, sans-serif','font-size':24,fill:GOLD,'letter-spacing':4},svg); cap3.textContent='THE COUNCIL FIRE';
  const items=K.map((k,i)=>{
    const a=-Math.PI/2+i/12*Math.PI*2;
    const g=el('g',{},svg); token(k[2],g);
    const lab=el('g',{},svg);
    const c=Math.cos(a), sn=Math.sin(a), tx=CX+R*c, ty=CY+R*sn;
    const side=c>0.35?'start':c<-0.35?'end':'middle';
    const lx=side==='middle'?tx:tx+(c>0?52:-52), ly=side==='middle'?ty+(sn<0?-52:84):ty+4;
    const t1=el('text',{x:lx,y:ly-4,'text-anchor':side,'font-family':'Fraunces, Georgia, serif','font-size':27,'font-weight':600,fill:INK},lab); t1.textContent=k[0];
    const t2=el('text',{x:lx,y:ly+22,'text-anchor':side,'font-family':'Fraunces, Georgia, serif','font-size':20,'font-style':'italic',fill:'#6E5E48'},lab); t2.textContent=k[1];
    return {a,g,lab};
  });
  host.appendChild(svg);
  const ease=x=>x<0?0:x>1?1:x*x*(3-2*x);
  const DUR=16;
  function seek(t){
    const fl=1+0.06*Math.sin(t*9.1)+0.04*Math.sin(t*14.3+1);
    const shrink=1-0.82*ease((t-8)/3);
    const fin=ease(t/0.8);
    fire.setAttribute('transform',`translate(${CX},${CY}) scale(${(0.9+0.1*fin)*shrink},${(0.9+0.1*fin)*shrink*fl})`);
    fire.setAttribute('opacity',fin);
    glow.setAttribute('opacity',0.12*ease((t-9)/2.5)); glow.setAttribute('r',150-30*ease((t-9)/2.5));
    cap1.setAttribute('opacity',ease((t-0.6)/0.8)*(1-ease((t-7.6)/0.8)));
    cap2.setAttribute('opacity',ease((t-11)/1.2)); cap3.setAttribute('opacity',ease((t-12)/1.2));
    items.forEach((it,i)=>{
      const appear=ease((t-0.9-i*0.48)/0.5);
      const m=ease((t-8.2-i*0.06)/2.6);
      const r=R+(96-R)*m, s=(1.25+(0.78-1.25)*m)*(0.6+0.4*appear);
      const a=it.a+m*0.5;
      const x=CX+r*Math.cos(a), y=CY+r*Math.sin(a)+(-6)*m;
      it.g.setAttribute('transform',`translate(${x},${y}) scale(${s})`);
      it.g.setAttribute('opacity',appear);
      it.lab.setAttribute('opacity',appear*(1-ease((t-7.6)/0.8)));
    });
  }
  seek(opts.start||0);
  return {seek,DUR};
};
})();
