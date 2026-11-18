/* Bubble logo intro – from "Bubble Logo Intro HTML.html". Runs only when the inline script in
   index.html has added the .intro class (first visit, no reduced motion, or ?intro in the URL). */
if (document.documentElement.classList.contains("intro")) {
/* =====================================================================
   SETTINGS  –  everything you may want to tweak lives here
   ===================================================================== */
const SETTINGS = {
  speed:        1.35,  // playback speed: 1 = original pace, higher = faster (the timings below stay in original seconds)
  // ---- timings (seconds) ------------------------------------------
  enterEnd:     1.7,   // 0 → 1.7   bubbles float in from beyond the screen edges into a cluster
  gatherEnd:    2.3,   //           cluster hovers and pulls in a little
  formEnd:      3.0,   // → 3.0     bubbles squash, shrink and merge into the word shape
  logoFadeStart:2.8,   // 2.8→3.3   word crossfades into the real logo (scaling down to size)
  logoFadeEnd:  3.3,
  settleEnd:    3.8,   //           squash-and-settle done  →  "bubble-intro:done"
  glintStart:   3.3,   //           glint sweep across the letters
  glintDuration:0.75,
  smallBubbleStart: 0.35, // the little bubble beside the final "e" floats in with the cluster
  smallBubbleLand:  1.75,
  replayLinkDelay:  0.8,  // seconds after the finish before "replay" fades in
  // ---- bubbles ----------------------------------------------------
  bubbleCount:  13,    // 12 – 24 entering bubbles
  liquidBlobs:  190,   // metaball droplets that fill the word shape (more = smoother)
  bubbleBlend:  0.008, // how softly touching bubbles join (fraction of logo width): 0 = crisp double-bubble seams, 0.06 = gooey
  seed:         3,     // change for a different arrangement
  // ---- colours ----------------------------------------------------
  colors: {
    background: "#5FA4CF",   // sky, matches the hero
    pearl:      "#FAF9F4",   // clear-glass body
    cream:      "#ECE7D2",   // glass shade on the side away from the light
    gold:       "#CDB850",   // rims and edge lines
    olive:      "#7D7440",
    lemon:      "#F3EBA6",   // thin-film sheen
    butter:     "#E8D68A"
  },
  // ---- layout / behaviour -----------------------------------------
  logoWidthDesktop: 0.50,  // fraction of viewport width (≥ 1000px wide)
  logoWidthPhone:   0.80,  // fraction of viewport width (≤ 600px wide)
  transparentBackground: false, // true = no page background (needs a LIGHT site behind the pale logo)
  mode: "overlay",         // "overlay" (fixed, full page)  |  "section" (fills its parent)
  autoplay: true,
  showReplayLink: false,  // off on the site: the logo docks into the nav instead
  skipOnClickOrKey: true
};

(function(){
"use strict";
const S = SETTINGS;
const root = document.getElementById("bubble-intro");
const cv = root.querySelector("canvas");
const ctx = cv.getContext("2d");
const dockEl = root.querySelector(".bi-dock");
const logoEl = root.querySelector(".bi-logo");
const imgMain = root.querySelector(".bi-main");
const imgBub = root.querySelector(".bi-bub");
const glint = root.querySelector(".bi-glint");
const replayEl = root.querySelector(".bi-replay");
const LOGO_W = 640, LOGO_H = 208;
// small separate bubble inside the supplied logo (logo pixel coordinates)
const SB = {cx:614.6, cy:35.9, r:20.8, x0:588.8, x1:641, y0:0, y1:61};

const reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
const qs = new URLSearchParams(location.search);
if (qs.get("transparent") === "1") S.transparentBackground = true;
root.dataset.mode = S.mode;
root.dataset.transparent = String(!!S.transparentBackground);

/* ---------- helpers ---------- */
const clamp=(x,a=0,b=1)=>x<a?a:x>b?b:x;
const lerp=(a,b,t)=>a+(b-a)*t;
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
const eSine=u=>-(Math.cos(Math.PI*u)-1)/2;
const eCubic=u=>u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;
function rng(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const hex=h=>{h=h.replace("#","");return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]};
const C={};for(const k in S.colors)C[k]=hex(S.colors[k]);
const rgba=(c,a)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
const mixc=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
// thin-film colours: lemon / butter / gold from the logo, nudged richer so the sheen reads on a pale ground
const sat=(c,k)=>{const a=(c[0]+c[1]+c[2])/3;return c.map(v=>clamp(a+(v-a)*k,0,255)*.96)};
const FILM=[sat(mixc(C.butter,C.gold,.2),1.5),sat(mixc(C.lemon,C.gold,.1),1.6),sat(mixc(C.pearl,C.gold,.35),1.3)];

/* ---------- layout ---------- */
let W=0,H=0,dpr=1,L={x:0,y:0,w:0,h:0,k:1};
let scene=null, liquid=null;

function layout(){
  const r=root.getBoundingClientRect();
  W=Math.max(1,r.width);H=Math.max(1,r.height);
  dpr=Math.min(window.devicePixelRatio||1,2);
  cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
  const f=lerp(S.logoWidthPhone,S.logoWidthDesktop,sstep(600,1000,W));
  let w=W*f; const maxH=H*0.62; if(w*LOGO_H/LOGO_W>maxH)w=maxH*LOGO_W/LOGO_H;
  L.w=w;L.h=w*LOGO_H/LOGO_W;L.k=w/LOGO_W;L.x=(W-L.w)/2;L.y=(H-L.h)/2;
  if(!docked){
    dockEl.style.cssText=`left:${L.x}px;top:${L.y}px;width:${L.w}px;height:${L.h}px`;
  }
  buildScene();
}

/* ---------- liquid (metaball) buffers + silhouette of the real logo ---------- */
function buildLiquid(){
  // film grid: ~300k cells whatever the screen size (finer is wasted once it is upscaled)
  const ps=Math.max(1.25,Math.sqrt(W*H/300000));
  const lw=Math.ceil(W/ps), ls=lw/W, lh=Math.ceil(H*ls);
  const oc=document.createElement("canvas");oc.width=lw;oc.height=lh;
  const ox=oc.getContext("2d");
  const out=ox.createImageData(lw,lh);
  // silhouette of the supplied logo (without the small separate bubble)
  const sc=document.createElement("canvas");sc.width=lw;sc.height=lh;
  const sx=sc.getContext("2d",{willReadFrequently:true});
  sx.drawImage(imgMain,L.x*ls,L.y*ls,L.w*ls,L.h*ls);
  sx.globalCompositeOperation="destination-out";
  sx.fillStyle="#000";sx.fillRect((L.x+SB.x0*L.k)*ls,(L.y+SB.y0*L.k)*ls,(SB.x1-SB.x0)*L.k*ls,(SB.y1-SB.y0)*L.k*ls);
  const sd=sx.getImageData(0,0,lw,lh).data;
  let M=new Float32Array(lw*lh);
  for(let i=0;i<M.length;i++)M[i]=sd[i*4+3]>40?1:0;
  const rad=Math.max(2,Math.round(L.w*.012*ls));
  M=boxBlur(M,lw,lh,rad);M=boxBlur(M,lw,lh,rad);
  const n=lw*lh,Mg=new Float32Array(n);
  for(let i=0;i<n;i++)Mg[i]=sstep(.35,.95,M[i]);    // how firmly a cell belongs to the word
  liquid={ps,lw,lh,ls,oc,ox,out,M,Mg,f:new Float32Array(n),D:new Float32Array(n),d1:new Float32Array(n),d2:new Float32Array(n),R1:new Float32Array(n)};
}
function boxBlur(src,w,h,r){
  const tmp=new Float32Array(w*h),dst=new Float32Array(w*h),n=2*r+1;
  for(let y=0;y<h;y++){let s=0;const o=y*w;for(let x=-r;x<=r;x++)s+=src[o+clamp(x,0,w-1)];
    for(let x=0;x<w;x++){tmp[o+x]=s/n;s+=src[o+Math.min(w-1,x+r+1)]-src[o+Math.max(0,x-r)]}}
  for(let x=0;x<w;x++){let s=0;for(let y=-r;y<=r;y++)s+=tmp[clamp(y,0,h-1)*w+x];
    for(let y=0;y<h;y++){dst[y*w+x]=s/n;s+=tmp[Math.min(h-1,y+r+1)*w+x]-tmp[Math.max(0,y-r)*w+x]}}
  return dst;
}

/* ---------- scene: bubbles + droplets (all positions are analytic functions of time) ---------- */
function buildScene(){
  if(!imgMain.complete||!imgMain.naturalWidth)return;
  buildLiquid();
  const R=rng(S.seed*977+13), u=Math.min(W,H);
  const N=Math.round(clamp(S.bubbleCount,12,24));
  const cx=W/2, cy=H/2;
  // --- target points inside the word (dart throwing over the silhouette) ---
  const {M,lw,lh,ls}=liquid;const cand=[];
  for(let y=0;y<lh;y++)for(let x=0;x<lw;x++)if(M[y*lw+x]>.6)cand.push([x/ls,y/ls]);
  const K=Math.max(N+20,S.liquidBlobs), pts=[];
  let dmin=L.w*.05;
  while(pts.length<K&&dmin>L.w*.012){
    for(let tries=0;tries<2500&&pts.length<K;tries++){
      const p=cand[(R()*cand.length)|0];if(!p)break;let ok=true;
      for(let j=0;j<pts.length;j++){const dx=p[0]-pts[j][0],dy=p[1]-pts[j][1];if(dx*dx+dy*dy<dmin*dmin){ok=false;break}}
      if(ok)pts.push(p);
    }
    dmin*=.94;
  }
  // shuffle targets
  for(let i=pts.length-1;i>0;i--){const j=(R()*(i+1))|0;[pts[i],pts[j]]=[pts[j],pts[i]]}
  const rt=Math.max(L.w*.027,dmin*.95);
  // --- cluster spots around the word (where the bubbles hover before they merge) ---
  // own random stream, so the cluster looks the same whatever the screen / grid size
  const R2=rng(S.seed*131+5);
  const crx=Math.min(L.w*.66,W*.42), cry=Math.min(L.h*1.15,H*.3);
  const rMin=L.w*.075, rMax=Math.min(L.w*.17,H*.19);
  const spots=[];
  for(let i=0;i<N;i++){
    let best=null,bestD=-1;
    for(let k=0;k<40;k++){
      const a=R2()*6.283,q=Math.sqrt(R2()),p=[cx+Math.cos(a)*q*crx,cy+Math.sin(a)*q*cry];
      let d=1e9;for(const o of spots)d=Math.min(d,Math.hypot(p[0]-o[0],p[1]-o[1])-o[2]);
      if(d>bestD){bestD=d;best=p}
    }
    const r=Math.min(lerp(rMin,rMax,Math.pow(R2(),.9)),Math.max(rMin*.8,bestD*1.3));
    spots.push([best[0],best[1],r]);
  }
  const used=new Uint8Array(pts.length),blobs=[];
  for(const [px,py,r] of spots){
    // start just beyond the screen edge in the bubble's direction, then float inward on a curve
    const ang=Math.atan2((py-cy)/H,(px-cx)/W)+(R()-.5)*1.1;
    const dx=Math.cos(ang),dy=Math.sin(ang);
    const s=Math.min(Math.abs(W/2/(dx||1e-6)),Math.abs(H/2/(dy||1e-6)))+r*1.4+24;
    const Sx=[cx+dx*s,cy+dy*s];
    const bend=(R()<.5?-1:1)*(.08+.14*R())*s;
    const C=[cx+(px-cx)*.9,cy+(py-cy)*.9];
    // merge target: nearest free point inside the word
    let ti=-1,td=1e18;
    for(let j=0;j<pts.length;j++){if(used[j])continue;const q=(pts[j][0]-C[0])**2+(pts[j][1]-C[1])**2;if(q<td){td=q;ti=j}}
    used[ti]=1;
    const d=R()*.55;
    blobs.push({main:true,r0:r,P:[px,py],S:Sx,cv:[-dy*bend,dx*bend],d,e1:Math.min(S.enterEnd,d+1.0+.25*R()),
      C,T:pts[ti],rt,fx:.5+R()*.7,fy:.45+R()*.7,ph:R()*6.28,ph2:R()*6.28,ax:r*.05+3,ay:r*.05+3,
      f0:S.gatherEnd-.1+R()*.12,f1:S.formEnd-.05+R()*.05,spin:R()*6.28,wob:R()*6.28});
  }
  // remaining word points: droplets that bud from the nearest bubble and fill out the letters
  for(let j=0;j<pts.length;j++){
    if(used[j])continue;
    let p=blobs[0],pd=1e18;
    for(let i=0;i<N;i++){const q=(blobs[i].C[0]-pts[j][0])**2+(blobs[i].C[1]-pts[j][1])**2;if(q<pd){pd=q;p=blobs[i]}}
    const f0=S.gatherEnd+R()*.25;
    blobs.push({main:false,r0:0,P:p.C,S:p.C,d:0,C:p.C,T:pts[j],rt:rt*(.85+.3*R()),
      fx:0,fy:0,ph:0,ph2:0,ax:0,ay:0,f0,f1:Math.min(S.formEnd,f0+.45+R()*.1),spin:R()*6.28,wob:R()*6.28,bud:f0-.1});
  }
  // draw order: big first
  blobs.sort((a,b)=>b.r0-a.r0);
  scene={blobs,N,u};
}

function blobState(b,t){
  let x,y;
  if(b.main){
    const e=1-Math.pow(1-clamp((t-b.d)/(b.e1-b.d)),3),arc=Math.sin(Math.PI*e);
    let bx=lerp(b.S[0],b.P[0],e)+b.cv[0]*arc,by=lerp(b.S[1],b.P[1],e)+b.cv[1]*arc;
    const wa=sstep(b.d+.2,b.e1+.3,t);
    bx+=Math.sin(t*b.fx*2+b.ph)*b.ax*wa;by+=Math.cos(t*b.fy*2+b.ph2)*b.ay*wa;
    const g=eCubic(clamp((t-S.enterEnd)/(S.gatherEnd-S.enterEnd)));
    x=lerp(bx,b.C[0],g);y=lerp(by,b.C[1],g);
  }else{x=b.C[0];y=b.C[1]}
  const f=eSine(clamp((t-b.f0)/(b.f1-b.f0)));
  x=lerp(x,b.T[0],f);y=lerp(y,b.T[1],f);
  let r;
  if(b.main){r=lerp(b.r0,b.rt,f*f*f)}
  else{r=b.rt*sstep(b.bud,b.bud+.35,t)}
  return [x,y,r,f];
}

/* ---------- the little bubble beside the final "e": floats in from the right edge with the cluster ---------- */
function smallBubbleState(t){
  const sb=S.smallBubbleStart,sl=S.smallBubbleLand;
  if(t<sb||t>=S.logoFadeEnd)return null;
  const k=L.k,e=1-Math.pow(1-clamp((t-sb)/(sl-sb)),3),hv=sstep(sl-.4,sl+.4,t);
  const tx=L.x+SB.cx*k,ty=L.y+SB.cy*k;
  return [lerp(W+SB.r*k+30,tx,e)+Math.sin(t*1.7)*4*k*hv,
          lerp(ty-H*.2,ty,e)-Math.sin(Math.PI*e)*H*.05+Math.cos(t*1.3)*3*k*hv, SB.r*k];
}

/* ---------- everything that feeds the film: bubbles (stretched / squashed), droplets, small bubble ---------- */
function filmBlobs(t){
  const list=[];
  for(const b of scene.blobs){
    const st=blobState(b,t),r=st[2];if(r<.6)continue;
    let rot=0,ex=1,ey=1;
    if(b.main){
      const e=.012,a=blobState(b,t-e),c2=blobState(b,t+e);
      const vx=(c2[0]-a[0])/(2*e),vy=(c2[1]-a[1])/(2*e),sp=Math.hypot(vx,vy);
      const Sx=1+.1*clamp(sp/(.5*Math.min(W,H)))*(1-sstep(S.gatherEnd-.25,S.gatherEnd,t));
      const wob=1+.035*Math.sin(t*2.1+b.wob);
      const sq=1+.3*Math.sin(Math.PI*st[3]);   // squash sideways while merging
      if(sq>1.01){ex=sq*wob;ey=1/Math.sqrt(sq)/wob}
      else{rot=sp>1?Math.atan2(vy,vx):0;ex=Sx*wob;ey=1/Math.sqrt(Sx)/wob}
    }
    list.push({x:st[0],y:st[1],r,rot,ex,ey,main:b.main,f:st[3]});
  }
  const sbs=smallBubbleState(t);
  if(sbs)list.push({x:sbs[0],y:sbs[1],r:sbs[2],rot:0,ex:1,ey:1,main:true,f:0});
  return list;
}

/* ---------- soap film, shaded per cell on a grid, then upscaled ----------
   Bubbles are signed distances (cells inside each bubble's own edge). Touching bubbles join like a
   real double bubble – a smoothed union outline plus a thin shared wall where they meet. While the
   cluster collapses into the word the smoothing grows, so the bubbles flow into each other and into
   the letters (droplets + word silhouette, a metaball field). */
function renderFilm(t,list,wm){
  const Q=liquid,{lw,lh,ls,f,D,M,Mg,out,d1,d2,R1}=Q,od=out.data,n=lw*lh;
  const merge=sstep(S.gatherEnd,S.formEnd,t);
  const k=Math.max(.5,L.w*ls*(S.bubbleBlend+.03*merge*merge)); // junction smoothing radius (cells)
  d1.fill(-1e9);d2.fill(-1e9);R1.fill(0);
  let field=wm>0;
  for(const b of list){
    if(!b.main){field=true;continue}
    const rc=b.r*ls,ext=(rc+3*k)*Math.max(b.ex,b.ey),cx=b.x*ls,cy=b.y*ls;
    const cs=Math.cos(b.rot),sn=Math.sin(b.rot),iex=1/b.ex,iey=1/b.ey;
    const x0=Math.max(0,Math.floor(cx-ext)),x1=Math.min(lw-1,Math.ceil(cx+ext));
    const y0=Math.max(0,Math.floor(cy-ext)),y1=Math.min(lh-1,Math.ceil(cy+ext));
    for(let y=y0;y<=y1;y++){
      const dy=y+.5-cy,o=y*lw;
      for(let x=x0;x<=x1;x++){
        const dx=x+.5-cx,u=(dx*cs+dy*sn)*iex,w=(dy*cs-dx*sn)*iey;
        const di=rc-Math.sqrt(u*u+w*w),j=o+x;
        if(di<-3*k)continue;
        if(di>d1[j]){d2[j]=d1[j];d1[j]=di;R1[j]=rc}else if(di>d2[j])d2[j]=di;
      }
    }
  }
  // droplets + word silhouette: metaball field (sprite-free, accumulated directly)
  if(field){
    f.fill(0);
    const A=.889;                                      // falloff radius 2r, edge (field = .5) at r
    for(const b of list){
      if(b.main)continue;
      const Rf=2*b.r*ls,Rf2=Rf*Rf,cx=b.x*ls,cy=b.y*ls;
      const x0=Math.max(0,Math.floor(cx-Rf)),x1=Math.min(lw-1,Math.ceil(cx+Rf));
      const y0=Math.max(0,Math.floor(cy-Rf)),y1=Math.min(lh-1,Math.ceil(cy+Rf));
      for(let y=y0;y<=y1;y++){const dy=y+.5-cy,o=y*lw;
        for(let x=x0;x<=x1;x++){const dx=x+.5-cx,q=(dx*dx+dy*dy)/Rf2;if(q<1){const h=1-q;f[o+x]+=A*h*h}}}
    }
    if(wm>0){const a=1-wm,b=1-.85*wm,c=.97*wm;for(let i=0;i<n;i++){const m=M[i];if(m>0||f[i]>0)f[i]=f[i]*(a+wm*Mg[i])*b+c*m}}
  }
  // combined signed distance: smooth union (polynomial) of the two nearest bubbles and the field
  const sU=(a,b)=>{const h=k-Math.abs(a-b);return (a>b?a:b)+(h>0?h*h*.25/k:0)};
  for(let y=0;y<lh;y++){
    for(let x=0;x<lw;x++){
      const i=y*lw+x;
      let a=d1[i];
      if(a>-1e8&&d2[i]>-1e8)a=sU(a,d2[i]);
      if(field&&f[i]>.02&&x>0&&x<lw-1&&y>0&&y<lh-1){
        const gx=(f[i+1]-f[i-1])*.5,gy=(f[i+lw]-f[i-lw])*.5;
        a=sU(a,(f[i]-.5)/(Math.sqrt(gx*gx+gy*gy)+1e-4));
      }
      D[i]=a;
    }
  }
  // shading follows a real soap bubble: bright iridescent film at the rim, a faint refracted ring
  // about three quarters out, an almost invisible centre (radial position is relative to the
  // bubble that owns the cell; the word and droplets use a nominal radius)
  const hairW=Math.max(.6,L.w*.0018*ls),Rn=L.w*.05*ls,tt=t*.6;
  const wallK=1-sstep(S.gatherEnd+.1,S.formEnd-.1,t);
  for(let y=1;y<lh-1;y++){
    for(let x=1;x<lw-1;x++){
      const i=y*lw+x,o=i*4,d=D[i];
      if(d<-1){od[o+3]=0;continue}
      const cov=clamp(d+.5);
      const gx=(D[i+1]-D[i-1])*.5,gy=(D[i+lw]-D[i-lw])*.5,mg=Math.sqrt(gx*gx+gy*gy)+1e-6;
      const nx=-gx/mg,ny=-gy/mg;                    // outward normal
      const dd=d>0?d:0,R=R1[i]>0?R1[i]:Rn,rho=clamp(1-dd/R); // 0 centre → 1 edge
      const e=(1-rho)/.09,edge=e<3?Math.exp(-e*e):0;          // film rim
      const q=(rho-.74)/.12,ring=q>-3&&q<3?Math.exp(-q*q):0;  // refracted inner ring
      const hair=dd<hairW*7?Math.exp(-dd/hairW):0;
      const lit=sstep(-.3,.9,-.62*nx-.78*ny);                  // light from the upper left
      // thin-film interference: colours drift around the rim and swirl slowly
      const ph=nx*.35+ny*.25+rho*1.4+Math.sin(x*.011-tt)*.6+Math.cos(y*.013+tt*.7)*.5+tt*.15;
      const kk=((ph%1)+1)%1*3,ci=kk|0;let fr=kk-ci;fr=fr*fr*(3-2*fr);
      const c0=FILM[ci],c1=FILM[(ci+1)%3],tint=.35+.4*edge;
      let r=lerp(255,lerp(c0[0],c1[0],fr),tint),g=lerp(255,lerp(c0[1],c1[1],fr),tint),b=lerp(255,lerp(c0[2],c1[2],fr),tint);
      // fine edge line, deeper gold on the side away from the light
      const hl=hair*(.35+.4*(1-lit));r=lerp(r,C.olive[0],hl*.55);g=lerp(g,C.olive[1],hl*.55);b=lerp(b,C.olive[2],hl*.55);
      // shared wall where two bubbles meet (equal depth inside both)
      const wl=d2[i]>0&&Math.abs(d1[i]-d2[i])<hairW*30?Math.exp(-Math.abs(d1[i]-d2[i])*.5/(hairW*2.2))*sstep(0,hairW*6,d2[i])*wallK:0;
      if(wl>.01){const wc=wl*.35;r=lerp(r,C.gold[0],wc);g=lerp(g,C.gold[1],wc);b=lerp(b,C.gold[2],wc)}
      const al=.015+edge*(.42+.3*lit)+ring*(.12+.1*lit)+hl*.5+wl*.6;
      od[o]=r;od[o+1]=g;od[o+2]=b;od[o+3]=clamp(al)*cov*255;
    }
  }
  Q.ox.putImageData(out,0,0);
}

/* ---------- window reflections on each bubble (vector → crisp at any size) ---------- */
function drawGloss(c,b,alpha){
  const R=b.r;
  c.save();c.globalAlpha=alpha;c.translate(b.x,b.y);c.rotate(b.rot);c.scale(b.ex,b.ey);c.rotate(-b.rot);
  const win=(x,y,w,h,rot,a)=>{ // soft window: a faint larger pane under a brighter core
    c.save();c.translate(x,y);c.rotate(rot);
    c.fillStyle=`rgba(255,255,255,${a*.35})`;c.beginPath();c.roundRect(-w*.65,-h*.65,w*1.3,h*1.3,h*.5);c.fill();
    c.fillStyle=`rgba(255,255,255,${a})`;c.beginPath();c.roundRect(-w/2,-h/2,w,h,h*.35);c.fill();
    c.restore();
  };
  if(c.roundRect){
    win(-.5*R,-.5*R,.2*R,.12*R,-.78,.55);   // main window, upper left
    win(-.22*R,-.66*R,.08*R,.07*R,-.4,.35);
    win(.55*R,.4*R,.12*R,.07*R,-.78,.3);    // its reflection, lower right
  }
  c.restore();
}

/* ---------- main render ---------- */
let wasFinal=false;
function render(t){
  if(!scene)return;
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
  const filmA=1-sstep(S.logoFadeStart+.1,S.logoFadeEnd,t);
  const wMask=sstep(S.gatherEnd+.25,S.formEnd,t);
  // the word arrives slightly oversized and eases down to its final size (film and logo zoom together)
  const z=lerp(1.12,1,1-Math.pow(1-sstep(S.gatherEnd+.2,S.settleEnd-.2,t),3));
  if(filmA>.003){
    const list=filmBlobs(t);
    renderFilm(t,list,wMask);
    ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
    const zx=L.x+L.w/2,zc=L.y+L.h/2;ctx.translate(zx,zc);ctx.scale(z,z);ctx.translate(-zx,-zc);
    ctx.globalAlpha=filmA;ctx.drawImage(liquid.oc,0,0,liquid.lw,liquid.lh,0,0,W,liquid.lh/liquid.ls);
    for(const b of list){if(!b.main)continue;const ga=filmA*(1-sstep(.15,.7,b.f));if(ga>.003)drawGloss(ctx,b,ga)}
    ctx.restore();
  }
  // DOM logo
  const lf=sstep(S.logoFadeStart,S.logoFadeEnd,t);
  const tau=t-(S.logoFadeStart+.3);
  let sx=1,sy=1;
  if(tau>0&&t<S.settleEnd+1.5){const a=.055*sstep(0,.12,tau)*Math.exp(-4.6*tau)*Math.cos(6.283*2.1*tau);sx=1+a;sy=1-a}
  const idleK=sstep(S.settleEnd,S.settleEnd+1.2,t),it=t-S.settleEnd;
  const fy=Math.sin(it*1.25)*L.h*.012*idleK,rot=Math.sin(it*.8)*.25*idleK;
  const zy=(z-1)*L.h/2; // logo scales about its bottom edge, so shift to keep the zoom centred
  if(!docked)logoEl.style.transform=`translate3d(0,${(fy+zy).toFixed(2)}px,0) rotate(${rot.toFixed(3)}deg) scale(${(sx*z).toFixed(4)},${(sy*z).toFixed(4)})`;
  logoEl.style.opacity=lf.toFixed(3);
  logoEl.style.filter=lf<1?`blur(${((1-lf)*5).toFixed(2)}px)`:"none";
  // small bubble overlay joins the logo once it has landed
  imgBub.style.opacity=lf.toFixed(3);
  // glint (also a faint, rarer shimmer while idle)
  let gp=-1,gs=1;
  if(t>=S.glintStart&&t<=S.glintStart+S.glintDuration){gp=(t-S.glintStart)/S.glintDuration}
  else if(t>S.settleEnd+2){const per=6.5,ph=((t-S.settleEnd-2)%per)/per;if(ph<.14){gp=ph/.14;gs=.4}}
  if(gp>=0){const ep=eSine(gp);glint.style.opacity=(gs*Math.sin(Math.PI*clamp(gp*1.1)) ).toFixed(3);
    glint.style.backgroundPosition=`${(100-ep*100).toFixed(2)}% 0`}
  else glint.style.opacity=0;
}

/* ---------- clock / state ---------- */
let t0=0,playing=false,paused=false,done=false,docked=false,tNow=0,raf=0,replayTimer=0,skipped=false;
function setTime(t){tNow=t;render(t);
  if(!done&&t>=S.settleEnd)finish();
  const showR=S.showReplayLink&&done&&t>=S.settleEnd+S.replayLinkDelay;
  replayEl.classList.toggle("on",!!showR);
}
function finish(){
  if(done)return;done=true;
  window.dispatchEvent(new CustomEvent("bubble-intro:done",{detail:{skipped}}));
}
function loop(now){
  raf=requestAnimationFrame(loop);
  if(paused)return;
  setTime((now-t0)/1000*S.speed);
}
function play(){
  cancelAnimationFrame(raf);paused=false;done=false;skipped=false;docked=false;
  root.removeAttribute("data-docked");dockEl.getAnimations().forEach(a=>a.cancel());
  dockEl.style.transform="";root.querySelector(".bi-bg").style.opacity="";
  layout();replayEl.classList.remove("on");
  if(reduceMotion){
    logoEl.style.transition="none";logoEl.style.opacity=0;logoEl.style.filter="none";logoEl.style.transform="none";
    imgBub.style.opacity=1;glint.style.opacity=0;ctx.clearRect(0,0,cv.width,cv.height);
    requestAnimationFrame(()=>{logoEl.style.transition="opacity .9s ease";logoEl.style.opacity=1});
    setTimeout(()=>{finish();if(S.showReplayLink)replayEl.classList.add("on")},950);
    return;
  }
  t0=performance.now();raf=requestAnimationFrame(loop);
}
function skip(){
  if(done||reduceMotion)return;skipped=true;
  t0=performance.now()-S.settleEnd*1000/S.speed;
}
function seek(t){cancelAnimationFrame(raf);paused=true;if(!scene)layout();
  if(t<S.settleEnd)done=false;setTime(t)}
function pause(){paused=true}
function setTransparent(v){S.transparentBackground=!!v;root.dataset.transparent=String(!!v)}
function getLogoRect(){const r=logoEl.getBoundingClientRect();return{left:r.left,top:r.top,width:r.width,height:r.height}}
function dock(target,opts){
  if(!target||docked)return;opts=opts||{};const dur=opts.duration||800;
  const from=dockEl.getBoundingClientRect(),to=target.getBoundingClientRect();
  const sc=to.width/from.width;
  docked=true;logoEl.style.transform="none";
  dockEl.style.transformOrigin="0 0";
  const rr=root.getBoundingClientRect();
  const dx=to.left-rr.left-L.x,dy=to.top-rr.top-L.y;
  const an=dockEl.animate([{transform:"translate(0,0) scale(1)"},{transform:`translate(${dx}px,${dy}px) scale(${sc})`}],
    {duration:dur,easing:"cubic-bezier(.65,0,.25,1)",fill:"forwards"});
  root.querySelector(".bi-bg").style.opacity=0;
  root.setAttribute("data-docked","true");
  an.onfinish=()=>window.dispatchEvent(new CustomEvent("bubble-intro:docked"));
}

/* ---------- wiring ---------- */
imgBub.src=imgMain.src;
const maskUrl=`url("${imgMain.src}")`;
glint.style.webkitMaskImage=maskUrl;glint.style.maskImage=maskUrl;
// clip: main logo hides the small bubble until it has arrived; overlay shows only the small bubble
const pc=(v,tot)=>(v/tot*100).toFixed(3)+"%";
imgMain.style.clipPath=`polygon(0 0,${pc(SB.x0,LOGO_W)} 0,${pc(SB.x0,LOGO_W)} ${pc(SB.y1,LOGO_H)},${pc(SB.x1,LOGO_W)} ${pc(SB.y1,LOGO_H)},${pc(SB.x1,LOGO_W)} 0,100% 0,100% 100%,0 100%)`;
imgBub.style.clipPath=`polygon(${pc(SB.x0,LOGO_W)} 0,100% 0,100% ${pc(SB.y1,LOGO_H)},${pc(SB.x0,LOGO_W)} ${pc(SB.y1,LOGO_H)})`;
imgBub.style.opacity=0;
glint.style.clipPath=imgMain.style.clipPath;

root.addEventListener("pointerdown",e=>{if(e.target===replayEl)return;if(S.skipOnClickOrKey)skip()});
window.addEventListener("keydown",e=>{if(S.skipOnClickOrKey&&!e.metaKey&&!e.ctrlKey)skip()});
replayEl.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();play()});
let rzT=0;
const ro=(window.ResizeObserver?new ResizeObserver(()=>{clearTimeout(rzT);rzT=setTimeout(()=>{layout();if(paused||done)setTime(tNow)},60)}):null);
if(ro)ro.observe(root);else window.addEventListener("resize",()=>{layout();if(paused||done)setTime(tNow)});

function destroy(){cancelAnimationFrame(raf);clearTimeout(rzT);if(ro)ro.disconnect()}
window.BubbleIntro={play,replay:play,skip,seek,pause,setTransparent,dock,getLogoRect,destroy,settings:S};
// async, so the site wiring below is listening even if this fails on the very first call
const fail=()=>setTimeout(()=>window.dispatchEvent(new CustomEvent("bubble-intro:error")));
function start(){try{layout();if(S.autoplay)play();}catch(err){fail()}}
imgMain.addEventListener("error",fail,{once:true});
if(imgMain.complete&&imgMain.naturalWidth)start();else imgMain.addEventListener("load",start,{once:true});
})();

/* =====================================================================
   SITE WIRING
   1. bubbles form the logo (above)   2. the logo floats slowly up onto the nav logo
   3. only then the intro's background fades and the rest of the site appears
   ===================================================================== */
(function(){
  var HOLD = 400;    // ms to admire the finished logo before it floats up
  var FLOAT = 1100;  // ms for the float up to the nav
  var REVEAL = 600;  // ms for the site to fade in (matches .bi-bg's transition)
  var root = document.getElementById("bubble-intro");
  var bg = root.querySelector(".bi-bg");
  var navLogo = document.querySelector(".site-header .site-logo img");
  var ended = false;
  function end(){
    if (ended) return; ended = true;
    document.documentElement.classList.remove("intro"); // shows the real nav logo, unlocks scrolling
    if (window.BubbleIntro) BubbleIntro.destroy();
    root.remove();
  }
  function reveal(){
    bg.style.opacity = 0;
    setTimeout(end, REVEAL);
  }
  window.addEventListener("bubble-intro:done", function(){
    setTimeout(function(){
      var r = navLogo.getBoundingClientRect();
      if (r.width > 0 && r.bottom > 0) {
        BubbleIntro.dock(navLogo, { duration: FLOAT });
        bg.style.opacity = ""; // dock() fades the background right away; keep the site hidden until the logo lands
      } else {
        root.style.transition = "opacity .5s ease"; root.style.opacity = 0; // nav logo off screen (page opened at an anchor)
        setTimeout(end, 500);
      }
    }, HOLD);
  });
  window.addEventListener("bubble-intro:docked", reveal);
  window.addEventListener("bubble-intro:error", end);
  setTimeout(end, 12000); // safety net: never leave the overlay up
})();
}
