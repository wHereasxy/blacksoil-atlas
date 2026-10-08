/* Narrative layer: hero DEM contours, scroll choreography, guided twin steps. */
(function(){
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const qa=(s,r=document)=>[...r.querySelectorAll(s)];

/* ---------- Hero: marching-squares contours of the real DEM ---------- */
const hero=$('hero-canvas'),hctx=hero.getContext('2d'),dem=T.dem,GW=T.w,GH=T.h;
const LMIN=135,LMAX=285,STEP=5,levels=[];
for(let L=LMIN;L<=LMAX;L+=STEP)levels.push({L,idx:L%25===0,seg:[]});
const EDGES=[[],[[3,2]],[[2,1]],[[3,1]],[[0,1]],[[3,0],[2,1]],[[0,2]],[[3,0]],[[3,0]],[[0,2]],[[0,1],[3,2]],[[0,1]],[[3,1]],[[2,1]],[[3,2]],[]];
for(let y=0;y<GH-1;y++)for(let x=0;x<GW-1;x++){
  const a=dem[y*GW+x],b=dem[y*GW+x+1],c=dem[(y+1)*GW+x+1],d=dem[(y+1)*GW+x];
  if(a==null||b==null||c==null||d==null)continue;
  const lo=Math.min(a,b,c,d),hi=Math.max(a,b,c,d);
  let k0=Math.max(0,Math.ceil((lo-LMIN)/STEP)),k1=Math.min(levels.length-1,Math.floor((hi-LMIN)/STEP));
  for(let k=k0;k<=k1;k++){
    const lv=levels[k],L=lv.L,code=(a>L)<<3|(b>L)<<2|(c>L)<<1|(d>L);
    const pt=e=>e===0?[x+(L-a)/(b-a),y]:e===1?[x+1,y+(L-b)/(c-b)]:e===2?[x+(L-d)/(c-d),y+1]:[x,y+(L-a)/(d-a)];
    for(const [e1,e2] of EDGES[code]){const p=pt(e1),q=pt(e2);lv.seg.push(p[0],p[1],q[0],q[1])}
  }
}
let W=0,H=0,dpr=1,fit={s:1,ox:0,oy:0},base=null,glow=null,mask=null;
const off=()=>{const c=document.createElement('canvas');c.width=W*dpr;c.height=H*dpr;const x=c.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);return[c,x]};
const elevTone=(L,alpha)=>{const t=(L-LMIN)/(LMAX-LMIN),r=Math.round(98+(224-98)*t),g=Math.round(197+(164-197)*t),b=Math.round(156+(88-156)*t);return`rgba(${r},${g},${b},${alpha})`};
function strokeLevels(ctx,styler){
  for(const lv of levels){if(!lv.seg.length)continue;const s=lv.seg;styler(ctx,lv);ctx.beginPath();
    for(let i=0;i<s.length;i+=4){ctx.moveTo(fit.ox+s[i]*fit.s,fit.oy+s[i+1]*fit.s);ctx.lineTo(fit.ox+s[i+2]*fit.s,fit.oy+s[i+3]*fit.s)}ctx.stroke()}
}
function heroResize(){
  const r=hero.getBoundingClientRect();if(!r.width)return;
  W=r.width;H=r.height;dpr=Math.min(1.5,devicePixelRatio||1);hero.width=W*dpr;hero.height=H*dpr;hctx.setTransform(dpr,0,0,dpr,0,0);
  const narrow=W<760,s=narrow?Math.max(W/GW,H/GH)*1.05:Math.max(W*.72/GW,H*1.02/GH);
  fit={s,ox:(narrow?.5:.62)*W-GW*s/2,oy:H/2-GH*s/2};
  let bx,gx;[base,bx]=off();[glow,gx]=off();[mask]=off();
  strokeLevels(bx,(c,lv)=>{c.lineWidth=lv.idx?1:.6;c.strokeStyle=lv.idx?elevTone(lv.L,.34):elevTone(lv.L,.13)});
  strokeLevels(gx,(c,lv)=>{c.lineWidth=lv.idx?1.5:1;c.strokeStyle=lv.idx?'rgba(255,236,200,.95)':'rgba(224,164,88,.8)'});
  drawHero(performance.now());
}
const paths=T.flowPaths.map(p=>p.map(q=>[q[0]*(GW-1),q[1]*(GH-1)]));
let pointer=null,spot={x:0,y:0,init:false};
hero.closest('.hero').addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();pointer={x:e.clientX-r.left,y:e.clientY-r.top}});
hero.closest('.hero').addEventListener('pointerleave',()=>pointer=null);
function probe(px,py){
  const gx=(px-fit.ox)/fit.s,gy=(py-fit.oy)/fit.s;if(gx<0||gy<0||gx>GW-1||gy>GH-1)return null;
  const e=dem[Math.round(gy)*GW+Math.round(gx)];if(e==null)return null;
  const di=Math.min(h-1,Math.round(gy/(GH-1)*(h-1)))*w+Math.min(w-1,Math.round(gx/(GW-1)*(w-1)));
  return{e,lon:D.lon[di],lat:D.lat[di]};
}
function drawHero(t){
  if(!base)return;
  const tx=pointer?pointer.x:W*(.64+.16*Math.sin(t*.00021)),ty=pointer?pointer.y:H*(.48+.22*Math.sin(t*.00033+1));
  if(!spot.init){spot={x:tx,y:ty,init:true}}else{spot.x+=(tx-spot.x)*.08;spot.y+=(ty-spot.y)*.08}
  hctx.clearRect(0,0,W,H);hctx.drawImage(base,0,0,W,H);
  const R=Math.max(150,Math.min(W,H)*.3),mx=mask.getContext('2d');
  const bx=Math.max(0,Math.floor(spot.x-R)),by=Math.max(0,Math.floor(spot.y-R)),bw=Math.min(W,Math.ceil(spot.x+R))-bx,bh=Math.min(H,Math.ceil(spot.y+R))-by;
  if(bw>0&&bh>0){
    const sx=bx*dpr,sy=by*dpr,sw=bw*dpr,sh=bh*dpr;
    mx.setTransform(1,0,0,1,0,0);mx.globalCompositeOperation='copy';mx.drawImage(glow,sx,sy,sw,sh,sx,sy,sw,sh);
    mx.setTransform(dpr,0,0,dpr,0,0);mx.globalCompositeOperation='destination-in';
    const g=mx.createRadialGradient(spot.x,spot.y,0,spot.x,spot.y,R);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.45,'rgba(0,0,0,.55)');g.addColorStop(1,'rgba(0,0,0,0)');
    mx.fillStyle=g;mx.fillRect(bx,by,bw,bh);hctx.drawImage(mask,sx,sy,sw,sh,bx,by,bw,bh);
  }
  hctx.save();hctx.lineWidth=1.1;hctx.setLineDash([3,11]);hctx.lineDashOffset=reduced?0:-t*.018;hctx.strokeStyle='rgba(98,203,227,.42)';hctx.beginPath();
  for(const p of paths){hctx.moveTo(fit.ox+p[0][0]*fit.s,fit.oy+p[0][1]*fit.s);for(let i=1;i<p.length;i++)hctx.lineTo(fit.ox+p[i][0]*fit.s,fit.oy+p[i][1]*fit.s)}
  hctx.stroke();hctx.restore();
  const pr=probe(spot.x,spot.y);
  if(pr&&W>=760){
    hctx.save();hctx.strokeStyle='rgba(224,164,88,.7)';hctx.lineWidth=1;hctx.beginPath();
    hctx.arc(spot.x,spot.y,5,0,Math.PI*2);hctx.moveTo(spot.x-18,spot.y);hctx.lineTo(spot.x-9,spot.y);hctx.moveTo(spot.x+9,spot.y);hctx.lineTo(spot.x+18,spot.y);
    hctx.moveTo(spot.x,spot.y-18);hctx.lineTo(spot.x,spot.y-9);hctx.moveTo(spot.x,spot.y+9);hctx.lineTo(spot.x,spot.y+18);hctx.stroke();
    hctx.font='500 11px '+UI_MONO;hctx.fillStyle='rgba(236,230,214,.85)';hctx.textBaseline='middle';
    hctx.fillText(pr.e.toFixed(1)+' m',spot.x+26,spot.y-7);hctx.fillStyle='rgba(236,230,214,.45)';
    hctx.fillText(pr.lat.toFixed(3)+'°N  '+pr.lon.toFixed(3)+'°E',spot.x+26,spot.y+9);hctx.restore();
  }
}
let heroOn=true,raf=0;
function loop(t){raf=0;if(!heroOn||document.hidden)return;drawHero(t);raf=requestAnimationFrame(loop)}
const kick=()=>{if(!reduced&&!raf&&heroOn&&!document.hidden)raf=requestAnimationFrame(loop)};
new IntersectionObserver(es=>{heroOn=es[0].isIntersecting;kick()}).observe(hero);
document.addEventListener('visibilitychange',kick);
let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(heroResize,120)});
heroResize();requestAnimationFrame(()=>hero.classList.add('on'));kick();

/* ---------- Data-driven headline numbers + count-up ---------- */
const last=D.curve[D.curve.length-1];
$('ins-retain').textContent=last.difference_mm.toFixed(1);
$('ins-a').textContent=last.A_remaining_mm.toFixed(1);
$('ins-b').textContent=last.B_remaining_mm.toFixed(1);
const heroDiff=document.querySelector('.hero-title [data-count]');if(heroDiff)heroDiff.dataset.count=last.difference_mm.toFixed(1);
function countUp(el){
  const to=+el.dataset.count,dec=+(el.dataset.dec||0),fmtN=v=>v.toFixed(dec);
  if(reduced){el.textContent=fmtN(to);return}
  const t0=performance.now(),dur=1700;
  (function tick(now){const k=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-k,4);el.textContent=fmtN(to*e);if(k<1)requestAnimationFrame(tick)})(t0);
}
qa('[data-count]').forEach(countUp);

/* ---------- Scroll choreography ---------- */
const topbar=document.querySelector('.topbar'),bar=$('scroll-progress'),navLinks=qa('.topbar nav a[href^="#"]');
const targets=navLinks.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
function onScroll(){
  const max=document.documentElement.scrollHeight-innerHeight,y=scrollY;
  bar.style.width=(max>0?y/max*100:0)+'%';topbar.classList.toggle('scrolled',y>24);
  let cur=null;for(const s of targets)if(s.getBoundingClientRect().top<=innerHeight*.35)cur=s;
  navLinks.forEach(a=>a.classList.toggle('active',!!cur&&a.getAttribute('href')==='#'+cur.id));
}
addEventListener('scroll',onScroll,{passive:true});onScroll();
const revealEls=qa('.chapter-head, .insight, .card, .story-bar, .lab-controls, .closing');
revealEls.forEach(el=>{el.classList.add('reveal');const sib=[...el.parentElement.children].filter(x=>x.classList.contains('reveal'));el.style.transitionDelay=Math.min(4,sib.indexOf(el))*80+'ms'});
const ro=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');ro.unobserve(e.target)}}),{rootMargin:'0px 0px -8% 0px',threshold:.08});
revealEls.forEach(el=>ro.observe(el));

/* ---------- Range fill sync ---------- */
const syncRange=el=>{const lo=+el.min||0,hi=+(el.max||100);el.style.setProperty('--fill',((+el.value-lo)/(hi-lo)*100)+'%')};
const syncAll=()=>qa('input[type=range]').forEach(syncRange);
document.addEventListener('input',e=>{if(e.target.matches&&e.target.matches('input[type=range]'))syncRange(e.target)});

/* ---------- Twin: layer notes + guided steps ---------- */
const layerNotes={satellite:'Sentinel-2 L2A · 2025夏季异期拼接。黑色为缺测；年份滑块仅控制侵蚀情景，不改变遥感影像。',soc:'SoilGrids空间预测浓度。切换六层深度，横向灰色表示缺测；色标统一，便于比较垂直梯度。',elevation:'Copernicus地表高程。等高线间隔10 m；高程读数始终为真实米值，形变夸张仅用于展示。',risk:'低SOC与弱垂直梯度的相对筛查，0–3级。不是历史退化率，也不是实测流失等级。',erosion:'RUSLE未校准情景累计剥蚀。时间轴与管理模式改变当前值；形变上限100 mm，读数不截断。',stock30:'浓度 × 容重 × 真实层厚 × 砾石校正。0–30 cm静态碳库存，非保护措施固碳增量。',stock100:'积分0–100 cm细土碳库存。任一所需层缺测则留空，未外推到全县。',stock200:'积分两米剖面碳库存，层厚不等。深层低浓度仍可贡献较大库存。',ndvi:'2025夏季多日期拼接。有效覆盖99.15%；绿度不可替代SOC，相关ρ约−0.026。',twi:'ln(汇流贡献面积/坡度)的地形代理。平坦区坡度下限、填洼与裁剪边界影响解释。',aspect:'北=0°，顺时针至东90°、南180°、西270°。环形色标；近水平区域坡向无意义。',slope:'由30 m地表模型计算。建筑、林冠影响局部坡度；当前显示上限10°，读取值保留原范围。',uncertainty:'(SOC Q95−Q05)/预测均值。数值越大，预测区间越宽；不是时间变化，也非碳库存联合置信区间。'};
const baseUpdate=update;
update=function(){baseUpdate();$('layer-explanation').textContent=exploded?'六层SOC按等间距展开以便比较；真实层厚为5/10/15/30/40/100 cm。':(layerNotes[mode]||'');$('cut').value=Math.round(cut*100);syncAll()};
APP.update=update;
const setScenario=s=>{scenario=s;for(const x of ['A','B'])$('scenario'+x).classList.toggle('active',x===s)};
const go=(el)=>el.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});
function story(step){
  qa('[data-story]').forEach(x=>x.classList.toggle('active',x.dataset.story===step));
  exploded=false;$('explode').checked=false;
  if(step==='surface'){mode='satellite';year=2015;$('fullmap').checked=true;update();view('bird');toast('真实卫星纹理叠加 10 m 等高线与 100 条汇流路径')}
  if(step==='soil'){mode='soc';year=2015;cut=.65;$('fullmap').checked=false;update();view('profile');toast('拖动剖切滑块或点击地表，读取六层土芯')}
  if(step==='protect'){mode='erosion';year=2025;setScenario('B');$('fullmap').checked=true;update();view('bird');toast('对照“传统耕作”按钮，查看同气候条件下的情景差异')}
}
qa('[data-story]').forEach(b=>b.onclick=()=>story(b.dataset.story));
qa('[data-goto]').forEach(b=>b.onclick=()=>{
  const step=b.dataset.goto;
  if(step==='ndvi'){$('scatter-x').value='ndvi';$('scatter-y').value='soc';CHARTS.buildScatter();CHARTS.render('scatter-chart');go($('scatter-chart').closest('.card'));return}
  go($('twin'));story(step);
});
$('inspect-hotspots').onclick=()=>{
  const hs=T.diagnostics&&T.diagnostics.hotspot;
  qa('[data-story]').forEach(x=>x.classList.remove('active'));
  exploded=false;$('explode').checked=false;mode='erosion';year=2025;setScenario('A');$('fullmap').checked=true;update();view('top');go($('twin'));
  if(hs)toast(`热点阈值 ≥${hs.threshold_mm.toFixed(1)} mm · ${hs.area_km2.toFixed(1)} km² 贡献 ${hs.erosion_share_pct.toFixed(1)}% 侵蚀`);
};
update();

const st=$('data-status');st.textContent='数据就绪 · 离线';st.parentElement.classList.add('ready');
lucide.createIcons();
})();
