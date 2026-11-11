/* OPEN WATER · the sea and the sky.
   One WebGL canvas behind the game's SVG. It draws the sky, the stars, the Milky Way, the light of dawn and dusk,
   the weather, and a lit, moving sea with swell, for each scene. The SVG above it keeps the canoe, the tappable
   stars, the tap targets and the words. If WebGL is missing, a still picture of each scene stands in.
   Kept modest on purpose: one pass, no post effects, pixel ratio capped at 1.5, paused when the page is hidden. */
(function(){
'use strict';

var VS='attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}';

var FS=[
'precision highp float;',
'varying vec2 v;',
'uniform vec2 R;uniform float T;uniform float MODE;',
'uniform float HY;',                       // horizon, as a fraction of the height from the top
'uniform vec3 ZEN,MID,HOR;',               // sky: zenith, middle, horizon
'uniform vec3 SUN;uniform vec3 SUNC;uniform float SUNK;uniform float DISK;',
'uniform float STARS,MILKY;',
'uniform float CLOUD;uniform vec3 CLC,CLL;uniform float CLDARK;',
'uniform vec3 DEEP,SHAL;uniform float FOAM,FOG,FLASH,RAIN,DETAIL,GLINT,HAZE;',
'uniform vec4 W[4];uniform vec4 WS;',       // waves: dir.x, dir.z, k, amp  ·  WS: angular speed of each
'uniform vec4 TR[4];uniform vec4 TRS;uniform vec3 RIM;', // swell scene from above: trains and the round window

'float h12(vec2 p){p=fract(p*vec2(443.897,441.423));p+=dot(p,p.yx+19.19);return fract(p.x*p.y);}',
'vec3 h33(vec2 p){float a=h12(p),b=h12(p+7.31),c=h12(p+3.17);return vec3(a,b,c);}',
'float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
' return mix(mix(h12(i),h12(i+vec2(1,0)),f.x),mix(h12(i+vec2(0,1)),h12(i+vec2(1,1)),f.x),f.y);}',
'float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*vnoise(p);p=p*2.03+vec2(17.,9.);a*=.5;}return s;}',
'float fbm2(vec2 p){return .6*vnoise(p)+.3*vnoise(p*2.07+3.);}',

/* ---- stars: three layers of points on a cell grid, each with its own size, colour and slow twinkle ---- */
'float starLayer(vec2 q,float cell,float seed,float th,float sig){',
' vec2 g=floor(q/cell);vec2 f=fract(q/cell);vec3 h=h33(g+seed);',
' float b=smoothstep(th,1.,h.z);if(b<=0.)return 0.;',
' vec2 p=.18+.64*h.xy;float d=length(f-p)*cell;',
' float tw=.86+.14*sin(T*(1.5+5.*h.x)+h.y*6.28);',
' return b*b*tw*exp(-d*d/(sig*sig));}',
'vec3 starColour(vec2 q){vec3 h=h33(floor(q*37.));return mix(vec3(.82,.88,1.),vec3(1.,.9,.72),h.x*h.x);}',
'vec3 stars(vec2 q,float px,float dens){',
' if(dens<=0.)return vec3(0.);',
' float s=0.;',
' s+=starLayer(q,px*5.,1.,.985-dens*.1,px*.75)*.55;',   // faint, dense
' s+=starLayer(q,px*11.,2.,.93-dens*.1,px*.95)*.8;',
' s+=starLayer(q,px*26.,3.,.9,px*1.35)*1.3;',             // the bright ones
' return starColour(q)*s*dens;}',

/* ---- the Milky Way: a soft, dusty band across the sky ---- */
'vec3 milky(vec2 q,float px){',
' if(MILKY<=0.)return vec3(0.);',
' vec2 n=normalize(vec2(.62,.78));vec2 a=vec2(n.y,-n.x);float t=dot(q-vec2(.05,.22),n);float along=dot(q,a);',
' float band=exp(-t*t/.05);float core=exp(-t*t/.006);',
' vec2 u=vec2(along*7.,t*16.);float f=fbm(u);float f2=vnoise(u*3.1+5.);',
' float lane=smoothstep(.35,.6,fbm(vec2(along*5.,t*22.)+9.))*core;',   // a dark dust lane down the middle
' float d=band*(.55+.45*f)*(.8+.4*f2)*(1.-.6*lane)+core*.4*(1.-.8*lane);',
' vec3 c=mix(vec3(.74,.8,.98),vec3(.98,.9,.8),f);',
' float sp=starLayer(q,px*4.,9.,.9-.06*band,px*.6)*band+starLayer(q,px*7.,19.,.86,px*.75)*band;',
' return (c*d*.17+vec3(.92,.92,1.)*sp*.55)*MILKY;}',

/* ---- the sky in a direction d (y up, z away) ---- */
'vec3 skyBase(vec3 d){',
' float e=clamp(d.y,0.,1.);',
' vec3 c=mix(HOR,MID,smoothstep(0.,.22,e));c=mix(c,ZEN,smoothstep(.14,.95,pow(e,.8)));',
' float sd=max(dot(d,SUN),0.);',
' c+=SUNC*(pow(sd,5.)*.17+pow(sd,40.)*.45)*SUNK;',
' c+=SUNC*smoothstep(1.-DISK*.0012,1.-DISK*.0009,sd)*2.2*DISK;',
' return c;}',
'vec3 clouds(vec3 d,vec3 c,float lo){',
' if(CLOUD<=0.||d.y<=0.)return c;',
' vec2 u=d.xz/(d.y+.12);u*=.9;u+=vec2(T*.012,T*.004);',
' float f=lo>.5?fbm2(u*1.6):fbm(u*1.6+vec2(0.,T*.01));',
' float cov=smoothstep(1.-CLOUD-.15,1.-CLOUD+.35,f);',
' float sd=max(dot(d,SUN),0.);',
' vec3 cc=mix(CLC,CLL,pow(sd,3.)*.7+f*.3);',
' cc=mix(cc,cc*(1.-CLDARK),smoothstep(.3,.9,f));',
' cc+=FLASH*vec3(.55,.6,.8)*(.4+.6*f);',
' float fade=smoothstep(0.,.08,d.y);',                    // thins toward the horizon
' return mix(c,cc,cov*fade);}',
'vec3 sky(vec3 d,float px,float detail){',
' vec3 c=skyBase(d);',
' vec2 q=d.xy/(d.z+1.);',
' float up=smoothstep(-.02,.08,d.y);',
' if(detail>.5){c+=(stars(q,px,STARS)+milky(q,px))*up;}',
' else{c+=stars(q,px*1.6,STARS*.7)*up*.6;}',
' c=clouds(d,c,detail>.5?0.:1.);',
' c+=FLASH*vec3(.3,.35,.5);',
' return c;}',

/* ---- the sea: a height field of a few swells plus fine ripples, seen from a camera one unit above it ---- */
'float hgt(vec2 p){float h=0.;for(int i=0;i<4;i++){h+=W[i].w*sin(W[i].z*dot(W[i].xy,p)-WS[i]*T);}return h;}',
'vec2 grad(vec2 p){vec2 g=vec2(0.);for(int i=0;i<4;i++){float c=W[i].w*W[i].z*cos(W[i].z*dot(W[i].xy,p)-WS[i]*T);g+=c*W[i].xy;}return g;}',
'float ripple(vec2 p){return fbm2(p*2.2+vec2(T*.25,T*.1))*.5+fbm2(p*5.1-vec2(T*.3,T*.22))*.5;}',

'vec3 sea(vec2 su,float sv,float px){',
' float H=1.;float s=max(sv,.0025);',
' float z=H/s;float x=su.x*z;',
' float h0=hgt(vec2(x,z));z=clamp((H-h0)/s,.08,4000.);x=su.x*z;',
' float h1=hgt(vec2(x,z));z=clamp((H-h1)/s,.08,4000.);x=su.x*z;',
' vec2 p=vec2(x,z);float h=hgt(p);',
' vec2 g=grad(p);',
' float att=DETAIL/(1.+z*.35);',
' float e=.05;',
' float r0=ripple(p),rx=ripple(p+vec2(e,0.)),rz=ripple(p+vec2(0.,e));',
' g+=vec2(rx-r0,rz-r0)/e*att*.06;',
' vec3 n=normalize(vec3(-g.x,1.,-g.y));',
' vec3 V=normalize(vec3(x,h-H,z));',
' vec3 Rf=reflect(V,n);Rf.y=max(Rf.y,.012);',
' float F=.03+.97*pow(1.-max(dot(-V,n),0.),5.);',
' vec3 skyR=sky(normalize(Rf),px,0.);',
' float amp=0.;for(int i=0;i<4;i++)amp+=abs(W[i].w);amp=max(amp,.02);',
' float rel=clamp(.5+.5*h/amp,0.,1.);',
' float sunlit=.25+.75*max(dot(n,SUN),0.);',
' vec3 body=DEEP+SHAL*(rel*rel*.9+.1)*(.35+.65*sunlit*SUNK)*(1.+r0*.25);',
' vec3 col=mix(body,skyR,F);',
' float sp=max(dot(Rf,SUN),0.);',
' col+=SUNC*(pow(sp,900.)*3.+pow(sp,120.)*.6+pow(sp,18.)*.08)*SUNK*GLINT;',
' float crest=smoothstep(FOAM,FOAM+.18,rel)*smoothstep(.35,.75,r0+.25*fbm2(p*9.+T*.4));',
' float lit=.55+.45*sunlit;',
' col=mix(col,vec3(.86,.9,.94)*lit*(.35+.65*SUNK+.5*FLASH)+HOR*.3,crest*FOAM*.9);',
' col=mix(col,col*.25+vec3(.6,.65,.8)*.6,FLASH*.5);',
' float fog=1.-exp(-z*FOG);',
' col=mix(col,HOR*(1.+FLASH*.5),fog);',
' return col;}',

/* ---- the swell scene: the sea from directly above, lit from one side ---- */
'vec3 top(vec2 fp){',
' vec2 p=fp;float h=0.;vec2 g=vec2(0.);',
' for(int i=0;i<4;i++){float th=TR[i].z*dot(TR[i].xy,p)-TRS[i]*T;h+=TR[i].w*sin(th);g+=TR[i].w*TR[i].z*cos(th)*TR[i].xy;}',
' float r0=ripple(p*.03);float e=.6;',
' g+=vec2(ripple((p+vec2(e,0.))*.03)-r0,ripple((p+vec2(0.,e))*.03)-r0)/e*.22;',
' vec3 n=normalize(vec3(-g*.8,1.));',
' vec3 L=normalize(vec3(-.5,-.6,.62));',
' float dif=max(dot(n,L),0.);',
' vec3 Rf=reflect(-L,n);float sp=pow(max(Rf.z,0.),30.);',
' float amp=0.;for(int i=0;i<4;i++)amp+=abs(TR[i].w);',
' float rel=.5+.5*h/max(amp,1.);',
' vec3 col=vec3(.05,.1,.18)*(.5+1.1*dif)+vec3(.16,.28,.42)*rel*rel*.9+vec3(.6,.72,.88)*sp*.5;',
' float fleck=smoothstep(.74,.9,r0)*smoothstep(.6,.95,rel);',
' col=mix(col,vec3(.72,.8,.92),fleck*.3);',
' return col;}',

'float rain(vec2 fp){',
' if(RAIN<=0.)return 0.;',
' float a=0.;',
' for(int i=0;i<2;i++){',
'  float sc=1.+float(i)*.6;vec2 r=fp*sc;r.x+=r.y*.42;',
'  vec2 cell=vec2(22.,170.);vec2 g=floor(r/cell+float(i)*3.1);vec2 f=fract(r/cell);',
'  float h=h12(g);float h2=h12(g+5.5);',
'  float y=fract(f.y-T*(2.2+1.6*h));',
'  float line=smoothstep(1.3,0.,abs(f.x-(.15+.7*h))*cell.x)*smoothstep(0.,.3,y)*smoothstep(1.,.5,y)*step(.74,h2);',
'  a+=line*(.42-float(i)*.14);}',
' return a*RAIN;}',

'void main(){',
' vec2 fp=vec2(v.x*R.x,(1.-v.y)*R.y);',          // pixels from the top-left
' float px=1./(2.*R.y);',                          // sky units per pixel
' vec3 col;',
' if(MODE>.5){',
'  vec2 c=vec2(R.x*.5,R.y*.5);vec2 p=(fp-c)/R.y*300.;',
'  col=top(p);',
'  float d=length(fp-RIM.xy*R.y)/(RIM.z*R.y);',
'  col*=mix(1.,.22,smoothstep(.985,1.03,d));',
'  col+=vec3(.5,.6,.75)*(1.-smoothstep(0.,.014,abs(d-1.)))*.25;',
' }else{',
'  float hy=HY*R.y;',
'  vec2 su=vec2((fp.x-R.x*.5)/R.y,0.);',
'  float sv=(fp.y-hy)/R.y;',
'  if(sv<0.){vec3 d=normalize(vec3(su.x,-sv,1.));col=sky(d,px,1.);',
'   col=mix(col,HOR,HAZE*exp(-(-sv)*18.));}',
'  else{col=sea(su,sv,px);}',
'  col+=vec3(.75,.8,.9)*rain(fp);',
' }',
' col=col/(1.+col*.12);',                           // soft shoulder
' col=pow(max(col,0.),vec3(.95));',
' float vg=1.-.22*pow(length((v-.5)*vec2(1.2,1.)),2.5);',
' gl_FragColor=vec4(col*vg,1.);}'
].join('\n');

/* ---------- scene presets ---------- */
function c3(hex){var n=parseInt(hex.slice(1),16);return [((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255];}
function dir(deg){var a=deg*Math.PI/180;return [Math.sin(a),Math.cos(a)];}
// a wave: direction in degrees (0 = coming straight at the viewer), wavelength in world units, height, period in s
function wave(deg,len,amp,per){var d=dir(deg);return {d:[d[0],-d[1]],k:2*Math.PI/len,amp:amp,w:2*Math.PI/per};}
var SEAS={
  night:[wave(12,7,.055,7.5),wave(-28,4.2,.03,5.5),wave(40,2.1,.012,3.6),wave(-5,1.1,.006,2.2)],
  gentle:[wave(8,6,.045,7),wave(-30,3.6,.024,5),wave(35,1.8,.01,3.2),wave(-8,1,.005,2)],
  shore:[wave(5,5,.04,6.5),wave(-20,3,.03,4.6),wave(30,1.6,.014,3),wave(-6,.9,.006,1.9)],
  glass:[wave(10,9,.012,9),wave(-35,4,.006,6),wave(40,1.5,.003,3.5),wave(0,.7,.0015,2)],
  storm:[wave(18,7.5,.26,6.2),wave(-26,4.6,.17,4.6),wave(42,2.3,.07,3.1),wave(-8,1.2,.035,2)]
};
var P={
  night:{hy:190,zen:'#02050C',mid:'#07101F',hor:'#172538',sun:[0,-.3,1],sunc:'#000000',sunk:0,disk:0,stars:1,milky:1,cloud:0,clc:'#000000',cll:'#000000',cldark:0,
         deep:'#030710',shal:'#0B1A2C',foam:1.2,fog:.02,rain:0,detail:.7,glint:0,haze:.25,sea:'night',near:'#06101C'},
  dawn: {hy:170,zen:'#1B2A4A',mid:'#4A5A86',hor:'#F2B07E',sun:[.22,-.035,1],sunc:'#FFB070',sunk:1.1,disk:0,stars:.25,milky:0,cloud:.34,clc:'#6B6480',cll:'#FFC8A0',cldark:.25,
         deep:'#102A3C',shal:'#3A6A80',foam:.86,fog:.045,rain:0,detail:.9,glint:1,haze:.3,sea:'shore',near:'#1E3E52'},
  day:  {hy:170,zen:'#5F93C4',mid:'#9FC3DE',hor:'#DCE8EE',sun:[.45,.62,1],sunc:'#FFF6E0',sunk:1,disk:1,stars:0,milky:0,cloud:.22,clc:'#F6F8FA',cll:'#FFFFFF',cldark:.08,
         deep:'#17507A',shal:'#3A8CA8',foam:1.2,fog:.06,rain:0,detail:.35,glint:.8,haze:.4,sea:'glass',near:'#2C6E8E'},
  storm:{hy:150,zen:'#05070C',mid:'#141A24',hor:'#2A3240',sun:[-.3,.25,1],sunc:'#8A94A8',sunk:.35,disk:0,stars:0,milky:0,cloud:.98,clc:'#1A1F2A',cll:'#4A5262',cldark:.6,
         deep:'#060A12',shal:'#1C2A3A',foam:.55,fog:.07,rain:1,detail:1.2,glint:.6,haze:.5,sea:'storm',near:'#0A1420'},
  dusk: {hy:176,zen:'#2E3A66',mid:'#7A6A98',hor:'#F8B27A',sun:[-.3,.035,1],sunc:'#FFB56A',sunk:1.15,disk:.55,stars:.3,milky:0,cloud:.3,clc:'#8D7A95',cll:'#FFCDA2',cldark:.3,
         deep:'#0E2538',shal:'#4A5A6A',foam:.95,fog:.04,rain:0,detail:.8,glint:1.1,haze:.3,sea:'gentle',near:'#17344A'},
  end:  {hy:190,zen:'#02050C',mid:'#08121F',hor:'#1A2A3E',sun:[0,-.3,1],sunc:'#000000',sunk:0,disk:0,stars:1,milky:.9,cloud:0,clc:'#000000',cll:'#000000',cldark:0,
         deep:'#030710',shal:'#0C1B2E',foam:1.2,fog:.02,rain:0,detail:.7,glint:0,haze:.25,sea:'night',near:'#06101C'}
};
function flat(p){
  var sea=SEAS[p.sea], W=[], WS=[];
  sea.forEach(function(w){W.push(w.d[0],w.d[1],w.k,w.amp);WS.push(w.w);});
  var s=p.sun, l=Math.hypot(s[0],s[1],s[2]);
  return {HY:[p.hy/300],ZEN:c3(p.zen),MID:c3(p.mid),HOR:c3(p.hor),SUN:[s[0]/l,s[1]/l,s[2]/l],SUNC:c3(p.sunc),SUNK:[p.sunk],DISK:[p.disk],
    STARS:[p.stars],MILKY:[p.milky],CLOUD:[p.cloud],CLC:c3(p.clc),CLL:c3(p.cll),CLDARK:[p.cldark],DEEP:c3(p.deep),SHAL:c3(p.shal),
    FOAM:[p.foam],FOG:[p.fog],RAIN:[p.rain],DETAIL:[p.detail],GLINT:[p.glint],HAZE:[p.haze],W:W,WS:WS};
}

/* ---------- the renderer ---------- */
window.Ocean=function(host,opts){
  opts=opts||{};
  var canvas=document.createElement('canvas'); canvas.className='sea'; canvas.setAttribute('aria-hidden','true');
  host.insertBefore(canvas,host.firstChild);
  var gl=null;
  try{ gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:!!opts.keep,powerPreference:'low-power'}); }catch(e){}
  var api={ok:false,canvas:canvas,preset:null,kind:null};
  if(!gl){ host.removeChild(canvas); return api; }
  function sh(type,src){var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){throw new Error(gl.getShaderInfoLog(s));}return s;}
  var prog;
  try{
    prog=gl.createProgram(); gl.attachShader(prog,sh(gl.VERTEX_SHADER,VS)); gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,FS)); gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(prog));
  }catch(e){ if(window.console)console.warn('Open Water: shader failed, using stills.',e.message); host.removeChild(canvas); return api; }
  gl.useProgram(prog);
  var buf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buf); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  var loc=gl.getAttribLocation(prog,'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  var U={}; ['R','T','MODE','HY','ZEN','MID','HOR','SUN','SUNC','SUNK','DISK','STARS','MILKY','CLOUD','CLC','CLL','CLDARK','DEEP','SHAL','FOAM','FOG','FLASH','RAIN','DETAIL','GLINT','HAZE','W','WS','TR','TRS','RIM'].forEach(function(n){U[n]=gl.getUniformLocation(prog,n);});
  api.ok=true;

  var cur=null, tgt=null, blend=1, mode=0, flash=0, trains=[], rim=[200,150,132], hidden=false, w=0, h=0;
  function size(){
    var r=host.getBoundingClientRect(), dpr=Math.min(window.devicePixelRatio||1,1.5);
    var cw=Math.max(1,Math.round(r.width*dpr)), ch=Math.max(1,Math.round(r.height*dpr));
    if(cw!==w||ch!==h){ w=cw; h=ch; canvas.width=w; canvas.height=h; gl.viewport(0,0,w,h); }
  }
  size();
  if(window.ResizeObserver){ new ResizeObserver(size).observe(host); } else window.addEventListener('resize',size);

  api.scene=function(kind,hy){
    var p=P[kind]||P.night; api.kind=kind; api.preset=p;
    var f=flat(p); if(hy)f.HY=[hy/300];
    if(!cur){cur=f;tgt=f;blend=1;} else { cur=lerpAll(cur,tgt,blend); tgt=f; blend=0; }
    mode=0; flash=0;
  };
  api.top=function(list,r){ mode=1; trains=list; rim=r; api.kind='swell'; api.preset=P.night; if(!cur){cur=tgt=flat(P.night);blend=1;} };
  api.flash=function(v){flash=v;};
  api.waves=function(){ return api.preset?SEAS[api.preset.sea]:SEAS.night; };
  /* height of the sea, in SVG pixels, under a point of the picture (x,y in the 400x300 view), and the slope there */
  api.at=function(x,y,t){
    var p=api.preset; if(!p||mode)return {dy:0,slope:0};
    var hy=cur?cur.HY[0]*300:p.hy, sv=(y-hy)/300; if(sv<=.003)return {dy:0,slope:0};
    var z=1/sv, wx=((x-200)/300)*z, hgt=0, gx=0, ws=api.waves(), tt=t*(opts.slow||1);
    for(var i=0;i<4;i++){var wv=ws[i], th=wv.k*(wv.d[0]*wx+wv.d[1]*z)-wv.w*tt; hgt+=wv.amp*Math.sin(th); gx+=wv.amp*wv.k*Math.cos(th)*wv.d[0];}
    return {dy:-hgt*(y-hy), slope:gx};
  };
  function lerpAll(a,b,k){ if(k>=1)return b; var o={}; for(var n in b){ var A=a[n],B=b[n],r=[]; for(var i=0;i<B.length;i++)r.push(A[i]+(B[i]-A[i])*k); o[n]=r; } return o; }
  function setU(f){
    gl.uniform1f(U.HY,f.HY[0]); gl.uniform3fv(U.ZEN,f.ZEN); gl.uniform3fv(U.MID,f.MID); gl.uniform3fv(U.HOR,f.HOR);
    gl.uniform3fv(U.SUN,f.SUN); gl.uniform3fv(U.SUNC,f.SUNC); gl.uniform1f(U.SUNK,f.SUNK[0]); gl.uniform1f(U.DISK,f.DISK[0]);
    gl.uniform1f(U.STARS,f.STARS[0]); gl.uniform1f(U.MILKY,f.MILKY[0]); gl.uniform1f(U.CLOUD,f.CLOUD[0]); gl.uniform3fv(U.CLC,f.CLC); gl.uniform3fv(U.CLL,f.CLL); gl.uniform1f(U.CLDARK,f.CLDARK[0]);
    gl.uniform3fv(U.DEEP,f.DEEP); gl.uniform3fv(U.SHAL,f.SHAL); gl.uniform1f(U.FOAM,f.FOAM[0]); gl.uniform1f(U.FOG,f.FOG[0]); gl.uniform1f(U.RAIN,f.RAIN[0]);
    gl.uniform1f(U.DETAIL,f.DETAIL[0]); gl.uniform1f(U.GLINT,f.GLINT[0]); gl.uniform1f(U.HAZE,f.HAZE[0]); gl.uniform4fv(U.W,f.W); gl.uniform4fv(U.WS,f.WS);
  }
  var lastT=0;
  api.render=function(t){
    if(hidden||!cur)return;
    size();
    var dt=Math.min(.1,Math.max(0,t-lastT)); lastT=t;
    if(blend<1){ blend=Math.min(1,blend+dt/.8); }
    var f=lerpAll(cur,tgt,blend);
    gl.uniform2f(U.R,w,h); gl.uniform1f(U.T,(t*(opts.slow||1))%3600); gl.uniform1f(U.MODE,mode); gl.uniform1f(U.FLASH,flash);
    setU(f);
    if(mode){
      var TR=[],TRS=[]; for(var i=0;i<4;i++){var tr=trains[i]; if(tr){TR.push(tr.d[0],tr.d[1],2*Math.PI/tr.len,tr.amp*(tr.op===undefined?1:tr.op));TRS.push(2*Math.PI*tr.speed/tr.len);} else {TR.push(0,1,1,0);TRS.push(0);}}
      gl.uniform4fv(U.TR,TR); gl.uniform4fv(U.TRS,TRS); gl.uniform3f(U.RIM,rim[0]/300,rim[1]/300,rim[2]/300);
    }
    gl.drawArrays(gl.TRIANGLES,0,3);
  };
  document.addEventListener('visibilitychange',function(){ hidden=document.hidden; });
  api.pause=function(v){hidden=v;};
  return api;
};
})();
