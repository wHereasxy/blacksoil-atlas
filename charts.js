/* Analysis charts: one theme, hover tooltips, viewport-triggered entrance. */
(()=>{
const E=D.extended,FONT=UI_FONT,MONO=UI_MONO;
const K={ink:'#ece6d6',ink2:'#c8c2b2',muted:'#8f8d80',faint:'#5f6058',grid:'rgba(236,230,214,.07)',axis:'rgba(236,230,214,.2)',amber:'#e0a458',rust:'#d06a43',jade:'#62c59c',cyan:'#62cbe3',violet:'#a58fd1',bg:'#131612'};
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const f=(v,d=1)=>v==null||!Number.isFinite(v)?'—':v.toFixed(d);
const pct=(v,d=1)=>f(v*100,d)+'%';
const setHTML=(id,html)=>{const el=$(id);if(el)el.innerHTML=html};
const mix=(a,b,t)=>{const p=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)),x=p(a),y=p(b);return `rgb(${x.map((v,i)=>Math.round(v+(y[i]-v)*t)).join(',')})`};
const scale=(stops,t)=>{t=Math.max(0,Math.min(1,t));const k=t*(stops.length-1),i=Math.min(stops.length-2,Math.floor(k));return mix(stops[i],stops[i+1],k-i)};
const ease=t=>1-Math.pow(1-t,3);

/* tooltip */
const tip=document.createElement('div');tip.className='chart-tip';tip.hidden=true;tip.setAttribute('role','status');document.body.appendChild(tip);
function showTip(e,title,rows=[]){tip.innerHTML=`<b>${title}</b>`+rows.map(([k,v])=>`<div class="row"><span>${k}</span><span>${v}</span></div>`).join('');tip.hidden=false;const r=tip.getBoundingClientRect();let x=e.clientX+16,y=e.clientY-r.height-14;if(x+r.width>innerWidth-8)x=e.clientX-r.width-16;if(y<8)y=e.clientY+18;tip.style.transform=`translate(${Math.max(8,x)}px,${y}px)`}
const hideTip=()=>tip.hidden=true;

/* canvas helpers */
function stage(id){const c=$(id),r=c.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);c.width=Math.max(1,Math.round(r.width*dpr));c.height=Math.max(1,Math.round(r.height*dpr));const ctx=c.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.textBaseline='middle';return{c,ctx,W:r.width,H:r.height}}
function txt(ctx,s,x,y,{col=K.muted,align='left',mono=true,size=10,weight=400,base='middle'}={}){ctx.font=`${weight} ${size}px ${mono?MONO:FONT}`;ctx.fillStyle=col;ctx.textAlign=align;ctx.textBaseline=base;ctx.fillText(s,x,y)}
function hline(ctx,x0,x1,y,col=K.grid,dash){ctx.strokeStyle=col;ctx.lineWidth=1;if(dash)ctx.setLineDash(dash);ctx.beginPath();ctx.moveTo(x0,Math.round(y)+.5);ctx.lineTo(x1,Math.round(y)+.5);ctx.stroke();ctx.setLineDash([])}
function vline(ctx,x,y0,y1,col=K.grid,dash){ctx.strokeStyle=col;ctx.lineWidth=1;if(dash)ctx.setLineDash(dash);ctx.beginPath();ctx.moveTo(Math.round(x)+.5,y0);ctx.lineTo(Math.round(x)+.5,y1);ctx.stroke();ctx.setLineDash([])}
function rr(ctx,x,y,w,h,r=3){r=Math.min(r,Math.abs(w)/2,Math.abs(h)/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}

/* registry: each chart redraws itself with st.p (entrance progress) and st.hover */
const charts=new Map();
function chart(id,draw,opts={}){const c=$(id);if(!c)return;const st={id,draw,p:reduce?1:0,hover:null,hits:[],shown:reduce,...opts};charts.set(id,st);
  c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;if(st.onMove)return st.onMove(e,x,y,st);const h=st.hits.find(h=>x>=h.x&&x<=h.x+h.w&&y>=h.y&&y<=h.y+h.h);const key=h?h.key:null;if(key!==st.hover){st.hover=key;render(id)}h?showTip(e,h.title,h.rows):hideTip()});
  c.addEventListener('pointerleave',()=>{st.hover=null;hideTip();render(id)});
  if(st.onClick)c.addEventListener('click',e=>{const r=c.getBoundingClientRect();st.onClick(e.clientX-r.left,e.clientY-r.top,st)});
}
function render(id){const st=charts.get(id);if(!st)return;const c=$(id);if(!c.getBoundingClientRect().width)return;st.hits=[];st.draw(st,ease(st.p))}
function animateIn(st){if(st.shown)return;st.shown=true;const t0=performance.now();const step=t=>{st.p=Math.min(1,(t-t0)/1000);render(st.id);if(st.p<1)requestAnimationFrame(step)};requestAnimationFrame(step)}
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){const st=charts.get(e.target.id);if(st)animateIn(st);io.unobserve(e.target)}}),{threshold:.2});

/* ---------- 02 carbon ---------- */
const socRows=D.stats.filter(r=>r.variable==='soc'),depths=D.depths;
const piMeans=socRows.map((_,L)=>{let a=0,b=0,k=0;for(let i=0;i<n;i++){const q=D.q05[L*n+i],r=D.q95[L*n+i];if(q!=null&&r!=null){a+=q;b+=r;k++}}return[a/k,b/k]});
{const top=socRows[0],deep=socRows[5];setHTML('tk-depth',`表层均值 <b>${f(top.mean)}</b> g/kg，到 1–2 m 降至 <b>${f(deep.mean)}</b>，衰减 <b>${pct(1-deep.mean/top.mean,0)}</b>；而空间变异系数从 <b>${f(top.cv_pct,0)}%</b> 升到 <b>${f(deep.cv_pct,0)}%</b>——越深越不均匀。`)}
chart('depth-chart',(st,p)=>{const{ctx,W,H}=stage('depth-chart'),L=78,R=W-56,T=12,B=H-26,xmax=35,X=v=>L+Math.min(v,xmax)/xmax*(R-L),Y=d=>T+Math.sqrt(d/200)*(B-T);
  for(let v=0;v<=30;v+=10){vline(ctx,X(v),T,B);txt(ctx,v,X(v),B+14,{align:'center',col:K.faint})}
  socRows.forEach((r,L_)=>{const y0=Y(depths[L_]),y1=Y(depths[L_+1]),hgt=Math.max(2,y1-y0-3),ym=(y0+y1)/2,hov=st.hover===L_,[q5,q95]=piMeans[L_];
    ctx.fillStyle=hov?'rgba(165,143,209,.26)':'rgba(165,143,209,.13)';ctx.fillRect(X(q5),y0+1,(X(q95)-X(q5))*p,hgt);
    if(q95>xmax&&p>.9)txt(ctx,'Q95 '+f(q95)+' ›',R+4,y0+8,{col:K.violet,size:9});
    const g=ctx.createLinearGradient(L,0,X(r.mean),0);g.addColorStop(0,'rgba(224,164,88,.08)');g.addColorStop(1,hov?'#f0bd7a':K.amber);ctx.fillStyle=g;rr(ctx,L,y0+1+hgt*.18,(X(r.mean)-L)*p,hgt*.64,3);ctx.fill();
    if(p>.6){ctx.strokeStyle=K.ink2;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(X(r.mean-r.sd),ym);ctx.lineTo(X(r.mean+r.sd),ym);ctx.moveTo(X(r.mean-r.sd),ym-4);ctx.lineTo(X(r.mean-r.sd),ym+4);ctx.moveTo(X(r.mean+r.sd),ym-4);ctx.lineTo(X(r.mean+r.sd),ym+4);ctx.stroke();txt(ctx,f(r.mean),X(r.mean+r.sd)+8,ym,{col:K.ink,size:11})}
    txt(ctx,r.depth.replace('cm',' cm'),0,ym,{col:hov?K.ink:K.muted});
    st.hits.push({key:L_,x:0,y:y0,w:W,h:y1-y0,title:`${r.depth.replace('cm','')} cm 层`,rows:[['均值',f(r.mean,2)+' g/kg'],['中位数',f(r.median,2)],['空间标准差',f(r.sd,2)],['变异系数',f(r.cv_pct,1)+'%'],['Q05–Q95 层均',f(q5,1)+' – '+f(q95,1)]]})});
  txt(ctx,'SOC g/kg →',R,B+14,{col:K.faint,align:'right'});
});

const carbon=E.carbon,inc=carbon.map((r,i)=>r.mean-(i?carbon[i-1].mean:0)),segName=['0–30 cm','30–100 cm','100–200 cm'],segCol=['#efc58a','#c9834c','#8a5434'];
{const tot=carbon[2],mt=tot.total_tC_valid_area/1e6;setHTML('tk-stock',`两米土体平均 <b>${f(tot.mean)}</b> tC/ha，样区有效范围合计约 <b>${f(mt*100,0)}</b> 万吨 C（≈ ${f(mt*44/12,1)} Mt CO₂e）；其中 1–2 m 贡献 <b>${pct(inc[2]/tot.mean,0)}</b>。`);setHTML('ins-deep',f(inc[2]/tot.mean*100,0))}
chart('stock-chart',(st,p)=>{const{ctx,W,H}=stage('stock-chart'),L=0,R=W,tot=carbon[2].mean;
  txt(ctx,'构成 · 0–200 cm',0,10,{col:K.faint,mono:false,size:11});
  let x=L;inc.forEach((v,i)=>{const w=(R-L)*v/tot*p,hov=st.hover==='s'+i;ctx.fillStyle=segCol[i];ctx.globalAlpha=st.hover&&!hov?.55:1;rr(ctx,x+1,28,w-2,54,6);ctx.fill();ctx.globalAlpha=1;
    if(p>.8&&w>60){txt(ctx,pct(v/tot,0),x+12,46,{col:'#1a120b',size:15,weight:600});txt(ctx,segName[i],x+12,68,{col:'rgba(26,18,11,.75)',size:10,mono:false})}
    st.hits.push({key:'s'+i,x,y:28,w,h:54,title:segName[i]+' 增量',rows:[['储量',f(v,1)+' tC/ha'],['占两米',pct(v/tot)]]});x+=w});
  const max=Math.max(...carbon.map(r=>r.high_soc_only_t_ha))*1.04,X=v=>40+v/max*(R-110),y0=128;
  txt(ctx,'累计储量与 SOC 分位包络',0,y0-12,{col:K.faint,mono:false,size:11});
  carbon.forEach((r,i)=>{const y=y0+18+i*62,hov=st.hover==='c'+i;
    txt(ctx,r.depth_cm.replace('-','–')+' cm',0,y,{col:hov?K.ink:K.muted});
    ctx.strokeStyle='rgba(236,230,214,.25)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(X(r.low_soc_only_t_ha),y);ctx.lineTo(X(r.low_soc_only_t_ha+(r.high_soc_only_t_ha-r.low_soc_only_t_ha)*p),y);ctx.stroke();
    for(const v of [r.low_soc_only_t_ha,r.high_soc_only_t_ha])vline(ctx,X(v),y-5,y+5,'rgba(236,230,214,.35)');
    ctx.fillStyle=segCol[i];ctx.beginPath();ctx.arc(X(r.mean*p),y,hov?7:5.5,0,7);ctx.fill();
    txt(ctx,f(r.mean)+' tC/ha',X(r.mean)+12,y-13,{col:K.ink,size:11});
    txt(ctx,f(r.total_tC_valid_area/1e6,2)+' Mt C',R,y,{col:K.faint,align:'right'});
    st.hits.push({key:'c'+i,x:0,y:y-22,w:W,h:44,title:`0–${r.depth_cm.split('-')[1]} cm 累计`,rows:[['均值',f(r.mean,2)+' tC/ha'],['中位数',f(r.median,2)],['SOC 分位包络',f(r.low_soc_only_t_ha,0)+' – '+f(r.high_soc_only_t_ha,0)],['有效面积合计',f(r.total_tC_valid_area/1e6,2)+' Mt C']]})});
});

const corrKeys=['SOC0','BD0','Stock30','Slope','TWI','NDVI','Uncertainty'],corrName={SOC0:'表层SOC',BD0:'容重',Stock30:'碳储量',Slope:'坡度',TWI:'湿润指数',NDVI:'NDVI',Uncertainty:'预测区间'};
const rho=(a,b)=>E.correlations.find(r=>r.x===a&&r.y===b);
{const pairs=[];corrKeys.forEach((a,i)=>corrKeys.slice(0,i).forEach(b=>{const r=rho(a,b);if(r?.spearman!=null)pairs.push([a,b,r.spearman])}));pairs.sort((x,y)=>Math.abs(y[2])-Math.abs(x[2]));const s=pairs[0],nd=rho('SOC0','NDVI');
 setHTML('tk-corr',`最强关联是 ${corrName[s[0]]}–${corrName[s[1]]}（<b>ρ ${f(s[2],2)}</b>）。NDVI 与表层 SOC 仅 <b>ρ ${f(nd.spearman,3)}</b>：地上绿度几乎不携带地下碳的信息。`);setHTML('ins-rho',f(nd.spearman,2).replace('-','−'))}
chart('corr-chart',(st,p)=>{const{ctx,W,H}=stage('corr-chart'),m=corrKeys.length,L=74,T=6,size=Math.min((W-L-4)/m,(H-T-60)/m),neg='#3f8fb0',pos='#e0a458';
  corrKeys.forEach((a,i)=>{txt(ctx,corrName[a],L-10,T+i*size+size/2,{align:'right',mono:false,size:11,col:st.hover?.[0]===i?K.ink:K.muted});
    corrKeys.forEach((b,j)=>{if(j>i)return;const r=rho(a,b)?.spearman,x=L+j*size,y=T+i*size,hov=st.hover&&st.hover[0]===i&&st.hover[1]===j;
      const v=(r??0)*p;ctx.fillStyle=i===j?'rgba(236,230,214,.05)':v>=0?`rgba(224,164,88,${.06+Math.abs(v)*.85})`:`rgba(63,143,176,${.06+Math.abs(v)*.85})`;rr(ctx,x+1.5,y+1.5,size-3,size-3,5);ctx.fill();
      if(hov){ctx.strokeStyle=K.ink;ctx.lineWidth=1.5;rr(ctx,x+1.5,y+1.5,size-3,size-3,5);ctx.stroke()}
      if(i!==j&&size>34&&p>.7)txt(ctx,f(r,2),x+size/2,y+size/2,{align:'center',size:10,col:Math.abs(r)>.45?'#16120c':K.ink2});
      if(i!==j)st.hits.push({key:[i,j],x,y,w:size,h:size,title:`${corrName[a]} × ${corrName[b]}`,rows:[['Spearman ρ',f(r,3)],['有效像元',(rho(a,b).valid_pixels/1e4).toFixed(1)+' 万'],['抽样步长',rho(a,b).sampling_stride]]})})});
  corrKeys.forEach((b,j)=>{ctx.save();ctx.translate(L+j*size+size/2,T+m*size+8);ctx.rotate(-Math.PI/4);txt(ctx,corrName[b],0,0,{align:'right',mono:false,size:10,col:st.hover?.[1]===j?K.ink:K.muted});ctx.restore()});
  const lx=L+size*3.6,ly=T+size*.6,lw=Math.min(150,W-lx-10);if(lw>60){const g=ctx.createLinearGradient(lx,0,lx+lw,0);g.addColorStop(0,neg);g.addColorStop(.5,'rgba(236,230,214,.06)');g.addColorStop(1,pos);ctx.fillStyle=g;rr(ctx,lx,ly,lw,6,3);ctx.fill();txt(ctx,'−1',lx,ly+16,{col:K.faint});txt(ctx,'0',lx+lw/2,ly+16,{col:K.faint,align:'center'});txt(ctx,'+1',lx+lw,ly+16,{col:K.faint,align:'right'})}
});

const uncValid=D.uncertainty.filter(v=>v!=null).sort((a,b)=>a-b),uq=q=>uncValid[Math.floor(q*(uncValid.length-1))];
const uLo=1.75,uHi=5,uStep=.125,uBins=new Array(Math.round((uHi-uLo)/uStep)).fill(0);uncValid.forEach(v=>uBins[Math.max(0,Math.min(uBins.length-1,Math.floor((v-uLo)/uStep)))]++);
setHTML('tk-unc',`中位数 <b>${f(uq(.5),2)}</b>：典型像元的 90% 预测区间宽度是预测值本身的三倍以上。P05–P95 落在 <b>${f(uq(.05),2)}–${f(uq(.95),2)}</b>，分布集中——这是模型级的不确定性，而非局部异常。`);
chart('uncertainty-chart',(st,p)=>{const{ctx,W,H}=stage('uncertainty-chart'),L=34,R=W-6,T=26,B=H-28,max=Math.max(...uBins),bw=(R-L)/uBins.length,X=v=>L+(v-uLo)/(uHi-uLo)*(R-L);
  ctx.fillStyle='rgba(165,143,209,.06)';ctx.fillRect(X(uq(.25)),T,X(uq(.75))-X(uq(.25)),B-T);
  for(let k=0;k<=4;k++){const y=B-k/4*(B-T);hline(ctx,L,R,y);txt(ctx,pct(max*k/4/uncValid.length,0),L-6,y,{align:'right',col:K.faint,size:9})}
  uBins.forEach((c,i)=>{const h=c/max*(B-T)*p,x=L+i*bw,hov=st.hover===i,mid=uLo+(i+.5)*uStep,inIQR=mid>=uq(.25)&&mid<=uq(.75);ctx.fillStyle=hov?'#c8b6ee':inIQR?K.violet:'rgba(165,143,209,.45)';rr(ctx,x+1,B-h,bw-2,h,2);ctx.fill();
    st.hits.push({key:i,x,y:T,w:bw,h:B-T,title:`区间宽度 ${f(uLo+i*uStep,2)}–${f(uLo+(i+1)*uStep,2)}${i===uBins.length-1?'+':''}`,rows:[['像元占比',pct(c/uncValid.length,2)],['像元数',c]]})});
  if(p>.8){const mx=X(uq(.5));vline(ctx,mx,T-8,B,K.ink,[3,3]);txt(ctx,'中位 '+f(uq(.5),2),mx+6,T-6,{col:K.ink,size:10});txt(ctx,'IQR',X(uq(.25))+4,B-10,{col:K.violet,size:9})}
  for(const v of [2,3,4,5])txt(ctx,v===5?'≥5':v,X(v),B+14,{align:'center',col:K.faint});txt(ctx,'× 预测值',R,B+14,{align:'right',col:K.faint});
});

/* ---------- 03 erosion ---------- */
const eroSorted=D.erosion.filter(v=>v!=null).sort((a,b)=>b-a),eroTot=eroSorted.reduce((a,b)=>a+b,0),lor=[[0,0]];{let c=0,step=Math.max(1,Math.floor(eroSorted.length/240));eroSorted.forEach((v,i)=>{c+=v;if((i+1)%step===0||i===eroSorted.length-1)lor.push([(i+1)/eroSorted.length,c/eroTot])})}
const lorAt=x=>{for(let i=1;i<lor.length;i++)if(lor[i][0]>=x){const[a,b]=[lor[i-1],lor[i]];return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]||1)}return 1};
const gini=(()=>{let s=0;for(let i=1;i<lor.length;i++)s+=(lor[i][0]-lor[i-1][0])*(lor[i][1]+lor[i-1][1]);return s-1})();
const hs=T.diagnostics.hotspot;setHTML('hotspot-share',f(hs.erosion_share_pct)+'%');
setHTML('tk-lorenz',`前 <b>10%</b> 面积贡献 <b>${pct(lorAt(.1))}</b> 侵蚀，前 20% 贡献 <b>${pct(lorAt(.2))}</b>；集中度基尼系数 <b>${f(gini,2)}</b>。把措施优先投向这 ${f(hs.area_km2,1)} km² 热点，单位投入的收益最高。`);
chart('lorenz-chart',(st,p)=>{const{ctx,W,H}=stage('lorenz-chart'),L=38,R=W-10,T=10,B=H-30,X=v=>L+v*(R-L),Y=v=>B-v*(B-T);
  for(let k=0;k<=4;k++){hline(ctx,L,R,Y(k/4));vline(ctx,X(k/4),T,B);txt(ctx,k*25+'%',L-6,Y(k/4),{align:'right',col:K.faint,size:9});txt(ctx,k*25+'%',X(k/4),B+14,{align:'center',col:K.faint,size:9})}
  ctx.strokeStyle=K.axis;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(X(0),Y(0));ctx.lineTo(X(1),Y(1));ctx.stroke();ctx.setLineDash([]);
  const cut=Math.max(1,Math.floor(lor.length*p)),pts=lor.slice(0,cut);
  ctx.beginPath();ctx.moveTo(X(0),Y(0));pts.forEach(([a,b])=>ctx.lineTo(X(a),Y(b)));const last=pts[pts.length-1];ctx.lineTo(X(last[0]),Y(last[0]));ctx.closePath();const g=ctx.createLinearGradient(0,T,0,B);g.addColorStop(0,'rgba(208,106,67,.35)');g.addColorStop(1,'rgba(208,106,67,.04)');ctx.fillStyle=g;ctx.fill();
  ctx.beginPath();pts.forEach(([a,b],i)=>i?ctx.lineTo(X(a),Y(b)):ctx.moveTo(X(a),Y(b)));ctx.strokeStyle=K.rust;ctx.lineWidth=2;ctx.stroke();
  if(p>.9)for(const q of [.1,.2,.5]){const v=lorAt(q);vline(ctx,X(q),Y(v),B,'rgba(236,230,214,.25)',[2,3]);ctx.fillStyle=K.bg;ctx.strokeStyle=K.ink;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(X(q),Y(v),4,0,7);ctx.fill();ctx.stroke();txt(ctx,pct(v,0),X(q)+8,Y(v)+12,{col:K.ink,size:10})}
  if(st.hover!=null){const q=st.hover,v=lorAt(q);vline(ctx,X(q),T,B,'rgba(236,230,214,.4)');ctx.fillStyle=K.amber;ctx.beginPath();ctx.arc(X(q),Y(v),4,0,7);ctx.fill()}
  txt(ctx,'累计面积（按侵蚀降序）→',R,B+26,{align:'right',col:K.faint,mono:false,size:10});
},{onMove:(e,x,y,st)=>{const c=$('lorenz-chart'),W=c.getBoundingClientRect().width,q=Math.max(0,Math.min(1,(x-38)/(W-48)));st.hover=q;render('lorenz-chart');showTip(e,`前 ${pct(q,0)} 面积`,[['累计侵蚀占比',pct(lorAt(q))],['集中倍数',f(lorAt(q)/(q||1e-9),2)+'×']])}});

const zones=E.slope_zones,zArea=zones.reduce((a,r)=>a+r.area_km2,0),zVol=zones.reduce((a,r)=>a+r.area_km2*r.erosion10_mm,0);
{const z=zones.find(r=>r.slope_band_deg==='2-5')||zones[2],steep=zones.filter(r=>parseFloat(r.slope_band_deg)>=2);setHTML('tk-zone',`坡度 ≥2° 仅占 <b>${pct(steep.reduce((a,r)=>a+r.area_km2,0)/zArea)}</b> 面积，承载 <b>${pct(steep.reduce((a,r)=>a+r.area_km2*r.erosion10_mm,0)/zVol)}</b> 侵蚀；其中 2–5° 缓坡一档就占 <b>${pct(z.area_km2*z.erosion10_mm/zVol)}</b>。`);setHTML('ins-zone',f(z.area_km2*z.erosion10_mm/zVol*100));setHTML('ins-zone-area',f(z.area_km2/zArea*100))}
chart('zone-chart',(st,p)=>{const{ctx,W,H}=stage('zone-chart'),L=36,R=W-4,T=16,B=H-46,max=Math.max(...zones.map(r=>r.erosion10_mm))*1.08,Y=v=>B-v/max*(B-T);
  for(const v of [0,50,100,150,200]){if(v>max)continue;hline(ctx,L,R,Y(v));txt(ctx,v,L-6,Y(v),{align:'right',col:K.faint,size:9})}
  let x=L;zones.forEach((r,i)=>{const w=(R-L)*r.area_km2/zArea,share=r.area_km2*r.erosion10_mm/zVol,h=(B-Y(r.erosion10_mm))*p,hov=st.hover===i;
    ctx.fillStyle=scale(['#5a3a2a','#a4553a','#d06a43','#f09a62'],i/(zones.length-1));ctx.globalAlpha=st.hover!=null&&!hov?.5:1;rr(ctx,x+1,B-h,Math.max(1,w-2),h,4);ctx.fill();ctx.globalAlpha=1;
    if(p>.85){const lab=pct(share,1),tw=ctx.measureText(lab).width;if(w>44)txt(ctx,lab,x+w/2,Math.min(B-h-12,B-18),{align:'center',col:K.ink,size:12,weight:600});else txt(ctx,lab,x+w/2,B-h-12,{align:'center',col:K.ink,size:10})}
    txt(ctx,r.slope_band_deg.replace('-90','+')+'°',x+w/2,B+14,{align:'center',col:hov?K.ink:K.muted,size:10});
    if(w>34)txt(ctx,pct(r.area_km2/zArea,0),x+w/2,B+29,{align:'center',col:K.faint,size:9});
    st.hits.push({key:i,x,y:T,w,h:B-T+30,title:`坡度 ${r.slope_band_deg.replace('-90','+')}°`,rows:[['面积',f(r.area_km2,1)+' km² · '+pct(r.area_km2/zArea)],['十年均值',f(r.erosion10_mm,1)+' mm'],['侵蚀总量占比',pct(share)],['表层 SOC',f(r.soc_mean,1)+' g/kg'],['0–30 cm 储量',f(r.stock30_mean,1)+' tC/ha'],['NDVI',f(r.ndvi_mean,3)]]});x+=w});
  txt(ctx,'mm',L-6,T-8,{align:'right',col:K.faint,size:9});txt(ctx,'面积占比',L,B+29,{col:K.faint,size:9,mono:false,align:'right'});
});

const ann=D.annual;{const xs=ann.map(a=>a.rain_mm),ys=ann.map(a=>a.A_t_km2_a),m=a=>a.reduce((x,y)=>x+y)/a.length,mx=m(xs),my=m(ys);let sxy=0,sxx=0,syy=0;xs.forEach((x,i)=>{sxy+=(x-mx)*(ys[i]-my);sxx+=(x-mx)**2;syy+=(ys[i]-my)**2});const r=sxy/Math.sqrt(sxx*syy),pk=ann.reduce((a,b)=>b.A_t_km2_a>a.A_t_km2_a?b:a),red=1-ann.reduce((a,b)=>a+b.B_t_km2_a,0)/ann.reduce((a,b)=>a+b.A_t_km2_a,0);
 setHTML('tk-annual',`年降水与传统情景侵蚀 <b>r = ${f(r,2)}</b>（R 因子由降水推导，含构造相关）。${pk.year} 年降水 ${f(pk.rain_mm,0)} mm 推高侵蚀至 <b>${f(pk.A_t_km2_a,0)}</b> t/(km²·a)；梨树模式在每一年都压低约 <b>${pct(red,0)}</b>。`)}
chart('annual-response',(st,p)=>{const{ctx,W,H}=stage('annual-response'),L=48,R=W-44,T=16,B=H-30,max=8000,rmax=1100,bw=(R-L)/ann.length,Y=v=>B-v/max*(B-T),YR=v=>B-v/rmax*(B-T);
  for(let v=0;v<=max;v+=2000){hline(ctx,L,R,Y(v));txt(ctx,v,L-8,Y(v),{align:'right',col:K.faint,size:9})}for(const v of [0,500,1000])txt(ctx,v,R+8,YR(v),{col:'rgba(98,203,227,.7)',size:9});
  ann.forEach((r,i)=>{const x=L+i*bw,hov=st.hover===i,ha=(B-Y(r.A_t_km2_a))*p,hb=(B-Y(r.B_t_km2_a))*p;if(hov){ctx.fillStyle='rgba(236,230,214,.04)';ctx.fillRect(x,T,bw,B-T)}
    ctx.fillStyle=hov?'#ec8a62':K.rust;rr(ctx,x+bw*.2,B-ha,bw*.32,ha,3);ctx.fill();ctx.fillStyle=hov?'#86dcb8':K.jade;rr(ctx,x+bw*.55,B-hb,bw*.22,hb,3);ctx.fill();
    if(W>520||i%2===0)txt(ctx,r.year,x+bw/2,B+14,{align:'center',col:hov?K.ink:K.muted,size:10});
    st.hits.push({key:i,x,y:T,w:bw,h:B-T+20,title:`${r.year} 年`,rows:[['年降水',f(r.rain_mm,0)+' mm'],['传统耕作',f(r.A_t_km2_a,0)+' t/km²·a'],['梨树模式',f(r.B_t_km2_a,0)+' t/km²·a'],['削减',pct(1-r.B_t_km2_a/r.A_t_km2_a)]]})});
  ctx.save();ctx.beginPath();ctx.rect(0,0,L+(R-L)*p,H);ctx.clip();ctx.strokeStyle=K.cyan;ctx.lineWidth=1.8;ctx.beginPath();ann.forEach((r,i)=>{const x=L+(i+.5)*bw,y=YR(r.rain_mm);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();ann.forEach((r,i)=>{ctx.fillStyle=K.bg;ctx.strokeStyle=K.cyan;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(L+(i+.5)*bw,YR(r.rain_mm),st.hover===i?5:3,0,7);ctx.fill();ctx.stroke()});ctx.restore();
  hline(ctx,L,R,Y(200),'rgba(98,197,156,.5)',[4,4]);txt(ctx,'容许流失量 200',R-4,Y(200)-8,{align:'right',col:'rgba(98,197,156,.8)',size:9});
});

const clim=E.climate,cvars={PRECTOTCORR:{name:'月总降水',unit:'mm',stops:['#141b1c','#1f4d57','#3f9cb0','#a9e6ef'],agg:'sum'},T2M:{name:'平均气温',unit:'°C',stops:['#3a6fa8','#9ab6c9','#e8e2cf','#e0a458','#c4482e'],agg:'mean'},WS2M:{name:'2 m 风速',unit:'m/s',stops:['#17151f','#4a3d74','#a58fd1','#e6dcff'],agg:'mean'},ALLSKY_SFC_SW_DWN:{name:'短波辐射',unit:'kWh/m²/d',stops:['#1b160e','#6d4a1e','#e0a458','#fbe3b4'],agg:'mean'}};
function climVals(key){return clim.map(r=>{let v=r[key];if(key==='PRECTOTCORR'&&v!=null)v*=new Date(r.year,r.month,0).getDate();return v})}
function climateTakeaway(){const key=$('climate-var').value,vals=climVals(key);if(key==='PRECTOTCORR'){let j=0,a=0;clim.forEach((r,i)=>{if(r.year>2024||vals[i]==null)return;a+=vals[i];if(r.month>=6&&r.month<=8)j+=vals[i]});const mx=clim.reduce((b,r,i)=>vals[i]>vals[b]?i:b,0);setHTML('tk-climate',`6–8 月集中了全年 <b>${pct(j/a,0)}</b> 的降水，最大单月为 <b>${clim[mx].year}-${String(clim[mx].month).padStart(2,'0')}</b>（${f(vals[mx],0)} mm）——侵蚀风险高度季节化，夏季地表覆盖是关键。`)}else{const c=cvars[key],valid=vals.filter(v=>v!=null),mn=Math.min(...valid),mx=Math.max(...valid);setHTML('tk-climate',`${c.name}月值范围 <b>${f(mn,1)} – ${f(mx,1)}</b> ${c.unit}。${key==='T2M'?'冬季长期低于 0 °C，冻融过程未纳入侵蚀模型。':key==='WS2M'?'春季风速最高，恰逢裸地期——风蚀未纳入本模型。':'辐射峰值在 5–6 月，早于降水峰值。'}`)}}
chart('climate-chart',(st,p)=>{const{ctx,W,H}=stage('climate-chart'),key=$('climate-var').value,cv=cvars[key],vals=climVals(key),valid=vals.filter(v=>v!=null),mn=Math.min(...valid),mx=Math.max(...valid),years=[...new Set(clim.map(r=>r.year))];
  const L=40,MR=W<520?54:84,R=W-MR,T=22,MB=58,B=H-MB,cw=(R-L)/12,ch=(B-T)/years.length;
  for(let m=1;m<=12;m++)txt(ctx,m+'月',L+(m-.5)*cw,10,{align:'center',col:st.hover?.m===m?K.ink:K.faint,size:9,mono:false});
  years.forEach((y,i)=>txt(ctx,y,L-6,T+(i+.5)*ch,{align:'right',col:st.hover?.y===y?K.ink:K.faint,size:9}));
  clim.forEach((r,i)=>{const yi=years.indexOf(r.year),x=L+(r.month-1)*cw,y=T+yi*ch,v=vals[i],order=(yi*12+r.month)/(years.length*12);const a=Math.max(0,Math.min(1,(p*1.4-order*.4)));ctx.globalAlpha=a;ctx.fillStyle=v==null?'#1f221e':scale(cv.stops,(v-mn)/(mx-mn||1));rr(ctx,x+1,y+1,cw-2,ch-2,2);ctx.fill();ctx.globalAlpha=1;
    if(st.hover&&st.hover.y===r.year&&st.hover.m===r.month){ctx.strokeStyle=K.ink;ctx.lineWidth=1.5;rr(ctx,x+1,y+1,cw-2,ch-2,2);ctx.stroke()}
    st.hits.push({key:{y:r.year,m:r.month},x,y,w:cw,h:ch,title:`${r.year} 年 ${r.month} 月`,rows:[[cv.name,v==null?'缺测':f(v,key==='PRECTOTCORR'?1:2)+' '+cv.unit]]})});
  const yearAgg=years.map(y=>{const vs=clim.map((r,i)=>r.year===y?vals[i]:null).filter(v=>v!=null);return cv.agg==='sum'?vs.reduce((a,b)=>a+b,0):vs.reduce((a,b)=>a+b,0)/vs.length}),ya=Math.max(...yearAgg),ymin=cv.agg==='sum'?0:Math.min(0,...yearAgg);
  yearAgg.forEach((v,i)=>{const y=T+i*ch,bwid=(MR-36)*(v-ymin)/(ya-ymin||1)*p;ctx.fillStyle=st.hover?.y===years[i]?K.ink2:'rgba(236,230,214,.22)';rr(ctx,R+8,y+ch*.25,Math.max(1,bwid),ch*.5,2);ctx.fill();if(W>=520)txt(ctx,f(v,cv.agg==='sum'?0:1),R+12+bwid,y+ch/2,{col:K.faint,size:9})});
  txt(ctx,cv.agg==='sum'?'年合计':'年均',R+8,10,{col:K.faint,size:9,mono:false});
  const mon=Array.from({length:12},(_,m)=>{const vs=clim.map((r,i)=>r.month===m+1?vals[i]:null).filter(v=>v!=null);return vs.reduce((a,b)=>a+b,0)/vs.length}),ma=Math.max(...mon.map(Math.abs)),base=B+MB-14,mh=MB-26;
  mon.forEach((v,m)=>{const x=L+m*cw,h=Math.abs(v)/ma*mh*p;ctx.fillStyle=st.hover?.m===m+1?K.ink2:v<0?'rgba(63,143,176,.55)':'rgba(236,230,214,.22)';rr(ctx,x+cw*.2,base-h,cw*.6,h,2);ctx.fill()});
  txt(ctx,'月均',L-6,base-mh/2,{align:'right',col:K.faint,size:9,mono:false});
  const lg=ctx.createLinearGradient(R+8,0,W-4,0);cv.stops.forEach((s,i)=>lg.addColorStop(i/(cv.stops.length-1),s));ctx.fillStyle=lg;rr(ctx,R+8,B+10,W-R-12,5,2);ctx.fill();txt(ctx,f(mn,0),R+8,B+24,{col:K.faint,size:9});txt(ctx,f(mx,0),W-4,B+24,{col:K.faint,size:9,align:'right'});
});

/* density scatter */
const sKeys={slope:'Slope',twi:'TWI',ndvi:'NDVI',soc:'SOC0',stock30:'Stock30'},sName={slope:'坡度 °',twi:'湿润指数',ndvi:'NDVI',soc:'表层 SOC',stock30:'碳储量',erosion:'十年剥蚀 mm'};
const soc0=D.soc.slice(0,n),series=k=>k==='soc'?soc0:D[k];
function quant(arr,q){return arr[Math.floor(q*(arr.length-1))]}
function rank(a){const idx=a.map((v,i)=>i).sort((i,j)=>a[i]-a[j]),r=new Array(a.length);let i=0;while(i<idx.length){let j=i;while(j+1<idx.length&&a[idx[j+1]]===a[idx[i]])j++;for(let k=i;k<=j;k++)r[idx[k]]=(i+j)/2;i=j+1}return r}
function spearman(x,y){const rx=rank(x),ry=rank(y),m=a=>a.reduce((s,v)=>s+v,0)/a.length,mx=m(rx),my=m(ry);let a=0,b=0,c=0;rx.forEach((v,i)=>{a+=(v-mx)*(ry[i]-my);b+=(v-mx)**2;c+=(ry[i]-my)**2});return a/Math.sqrt(b*c)}
let sc=null;
function buildScatter(){const xk=$('scatter-x').value,yk=$('scatter-y').value,xs=series(xk),ys=series(yk),pts=[];for(let i=0;i<n;i++)if(xs[i]!=null&&ys[i]!=null)pts.push(i);
  const xv=pts.map(i=>xs[i]).sort((a,b)=>a-b),yv=pts.map(i=>ys[i]).sort((a,b)=>a-b),x0=quant(xv,.005),x1=quant(xv,.995),y0=yk==='erosion'?0:quant(yv,.005),y1=quant(yv,.99);
  const nx=56,ny=40,bins=new Float32Array(nx*ny);pts.forEach(i=>{const bx=Math.floor((xs[i]-x0)/(x1-x0)*nx),by=Math.floor((ys[i]-y0)/(y1-y0)*ny);if(bx>=0&&bx<nx&&by>=0&&by<ny)bins[by*nx+bx]++});
  const order=pts.slice().sort((a,b)=>xs[a]-xs[b]),nb=14,trend=[];for(let k=0;k<nb;k++){const seg=order.slice(Math.floor(k*order.length/nb),Math.floor((k+1)*order.length/nb));if(!seg.length)continue;const sy=seg.map(i=>ys[i]).sort((a,b)=>a-b),sx=seg.map(i=>xs[i]).sort((a,b)=>a-b);trend.push([quant(sx,.5),quant(sy,.5),quant(sy,.25),quant(sy,.75),seg.length])}
  const full=E.correlations.find(r=>r.x===sKeys[xk]&&r.y===sKeys[yk]);let r=full?.spearman,src='全分辨率';if(r==null){const sub=pts.filter((_,k)=>k%3===0);r=spearman(sub.map(i=>xs[i]),sub.map(i=>ys[i]));src='显示网格'}
  $('rho-value').textContent=`Spearman ρ ${f(r,3)} · ${src}`;sc={xk,yk,xs,ys,pts,x0,x1,y0,y1,nx,ny,bins,max:Math.max(...bins),trend}}
chart('scatter-chart',(st,p)=>{const{ctx,W,H}=stage('scatter-chart'),s=sc,L=40,R=W-8,T=8,B=H-34,X=v=>L+(v-s.x0)/(s.x1-s.x0)*(R-L),Y=v=>B-(v-s.y0)/(s.y1-s.y0)*(B-T);
  for(let k=0;k<=4;k++){const yv=s.y0+(s.y1-s.y0)*k/4,xv=s.x0+(s.x1-s.x0)*k/4;hline(ctx,L,R,Y(yv));txt(ctx,f(yv,s.yk==='erosion'||s.yk==='stock30'?0:1),L-6,Y(yv),{align:'right',col:K.faint,size:9});txt(ctx,f(xv,s.xk==='ndvi'?2:1),X(xv),B+13,{align:'center',col:K.faint,size:9})}
  const cw=(R-L)/s.nx,chh=(B-T)/s.ny,lm=Math.log(1+s.max);for(let by=0;by<s.ny;by++)for(let bx=0;bx<s.nx;bx++){const c=s.bins[by*s.nx+bx];if(!c)continue;const t=Math.log(1+c)/lm;ctx.globalAlpha=Math.min(1,p*1.3)*(.25+.75*t);ctx.fillStyle=scale(['#1e4a3c','#62c59c','#e7f3c0'],t);ctx.fillRect(L+bx*cw,B-(by+1)*chh,cw+.5,chh+.5)}ctx.globalAlpha=1;
  if(p>.5){ctx.globalAlpha=(p-.5)*2;ctx.fillStyle='rgba(224,164,88,.12)';ctx.beginPath();s.trend.forEach((t,i)=>i?ctx.lineTo(X(t[0]),Y(t[3])):ctx.moveTo(X(t[0]),Y(t[3])));for(let i=s.trend.length-1;i>=0;i--)ctx.lineTo(X(s.trend[i][0]),Y(s.trend[i][2]));ctx.fill();ctx.strokeStyle=K.amber;ctx.lineWidth=2;ctx.beginPath();s.trend.forEach((t,i)=>i?ctx.lineTo(X(t[0]),Y(t[1])):ctx.moveTo(X(t[0]),Y(t[1])));ctx.stroke();s.trend.forEach(t=>{ctx.fillStyle=K.bg;ctx.strokeStyle=K.amber;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(X(t[0]),Y(t[1]),3,0,7);ctx.fill();ctx.stroke()});ctx.globalAlpha=1}
  if(st.hover){vline(ctx,st.hover[0],T,B,'rgba(236,230,214,.3)',[2,3]);hline(ctx,L,R,st.hover[1],'rgba(236,230,214,.3)',[2,3])}
  txt(ctx,sName[s.xk]+' →',R,B+27,{align:'right',col:K.faint,mono:false,size:10});txt(ctx,'↑ '+sName[s.yk],L+4,T+6,{col:K.faint,mono:false,size:10});
},{onMove:(e,x,y,st)=>{const s=sc,c=$('scatter-chart'),r=c.getBoundingClientRect(),L=40,R=r.width-8,T=8,B=r.height-34;if(x<L||x>R||y<T||y>B){st.hover=null;hideTip();return render('scatter-chart')}st.hover=[x,y];render('scatter-chart');const xv=s.x0+(x-L)/(R-L)*(s.x1-s.x0),yv=s.y0+(B-y)/(B-T)*(s.y1-s.y0),bx=Math.floor((x-L)/(R-L)*s.nx),by=Math.floor((B-y)/(B-T)*s.ny),cnt=s.bins[by*s.nx+bx]||0;showTip(e,'点击定位最近地块',[[sName[s.xk],f(xv,2)],[sName[s.yk],f(yv,2)],['此格像元',cnt]])},
 onClick:(x,y)=>{const s=sc,c=$('scatter-chart'),r=c.getBoundingClientRect(),L=40,R=r.width-8,T=8,B=r.height-34;const nxv=(x-L)/(R-L),nyv=(B-y)/(B-T);let best=null,bd=1e9;for(const i of s.pts){const dx=(s.xs[i]-s.x0)/(s.x1-s.x0)-nxv,dy=(s.ys[i]-s.y0)/(s.y1-s.y0)-nyv,d=dx*dx+dy*dy;if(d<bd){bd=d;best=i}}if(best!=null&&typeof core==='function'){core(best);toast(`已在数字孪生中定位 ${D.lon[best].toFixed(3)}°E ${D.lat[best].toFixed(3)}°N`)}}});

/* ---------- 04 scenario lab ---------- */
const baseA=ann.reduce((a,b)=>a+b.A_t_km2_a,0)/ann.length,REF=.38*.9,TOL=200,cRange=[.02,.5],pRange=[.1,1];
const ero=(c,p,r)=>baseA*c*p*r/REF;
function sensitivity(){const c=+$('c-factor').value,p=+$('p-factor').value,r=+$('r-factor').value,e=ero(c,p,r);$('c-value').textContent=c.toFixed(2);$('p-value').textContent=p.toFixed(2);$('r-value').textContent=r.toFixed(2)+'×';$('s-erosion').textContent=f(e,0);$('s-reduction').textContent=(e<=baseA?'−':'+')+pct(Math.abs(1-e/baseA));$('s-tolerance').textContent=f(e/TOL,2)+'×';$('s-tolerance').style.color=e<=TOL?K.jade:e<=TOL*3?K.amber:K.rust;
  const lg=v=>Math.log10(Math.max(v,10)),w=(lg(e)-1)/(lg(baseA*2*1.5)-1);$('tol-fill').style.width=Math.max(2,Math.min(100,w*100))+'%';document.querySelector('.tolerance-bar').style.setProperty('--tol',((lg(TOL)-1)/(lg(baseA*3)-1)*100)+'%');
  const pNeed=TOL*REF/(baseA*c*r);setHTML('tk-surface',pNeed<=1?`当前 C=${c.toFixed(2)}、R=${r.toFixed(2)}× 时，P 需降至 <b>${f(pNeed,2)}</b> 以下才能低于容许流失量。${p<=pNeed?'<b>当前组合已达标。</b>':`当前 P=${p.toFixed(2)}，还差 ${pct(1-pNeed/p,0)}。`}`:`当前 C=${c.toFixed(2)}、R=${r.toFixed(2)}× 时，仅靠水保措施 P 无法达标——必须先降低覆盖管理因子 C。`);render('cp-surface')}
chart('cp-surface',(st,pr)=>{const{ctx,W,H}=stage('cp-surface'),L=44,R=W-56,T=10,B=H-36,c=+$('c-factor').value,p=+$('p-factor').value,r=+$('r-factor').value,X=v=>L+(v-cRange[0])/(cRange[1]-cRange[0])*(R-L),Y=v=>B-(v-pRange[0])/(pRange[1]-pRange[0])*(B-T);
  const lo=1,hi=Math.log10(baseA*2*1.3),cs=['#0f2a22','#2d7d5f','#62c59c','#e0a458','#d06a43','#8c2f1e'],nx=Math.max(40,Math.round((R-L)/6)),ny=Math.max(30,Math.round((B-T)/6)),cw=(R-L)/nx,chh=(B-T)/ny;
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const cv=cRange[0]+(i+.5)/nx*(cRange[1]-cRange[0]),pv=pRange[0]+(j+.5)/ny*(pRange[1]-pRange[0]),v=ero(cv,pv,r),t=(Math.log10(v)-lo)/(hi-lo);ctx.globalAlpha=Math.min(1,pr*1.5);ctx.fillStyle=scale(cs,t);ctx.fillRect(L+i*cw,B-(j+1)*chh,cw+.6,chh+.6)}ctx.globalAlpha=1;
  const iso=(val,col,dash,lab)=>{ctx.strokeStyle=col;ctx.lineWidth=dash?2:1;ctx.setLineDash(dash||[]);ctx.beginPath();let started=false,lp=null;for(let k=0;k<=200;k++){const cv=cRange[0]+k/200*(cRange[1]-cRange[0]),pv=val*REF/(baseA*cv*r);if(pv<pRange[0]||pv>pRange[1]){if(started)break;continue}const x=X(cv),y=Y(pv);started?ctx.lineTo(x,y):ctx.moveTo(x,y);started=true;lp=[x,y]}ctx.stroke();ctx.setLineDash([]);if(lp&&lab){txt(ctx,lab,Math.min(lp[0]+4,R-4),lp[1]-10,{col,size:9,align:lp[0]>R-60?'right':'left'})}};
  for(const v of [500,1000,2000,4000])iso(v,'rgba(236,230,214,.28)',null,v+'');iso(TOL,'#ffffff',[5,4],'200 容许值');
  for(let k=0;k<=4;k++){const cv=cRange[0]+k/4*(cRange[1]-cRange[0]),pv=pRange[0]+k/4*(pRange[1]-pRange[0]);txt(ctx,cv.toFixed(2),X(cv),B+13,{align:'center',col:K.faint,size:9});txt(ctx,pv.toFixed(2),L-6,Y(pv),{align:'right',col:K.faint,size:9})}
  txt(ctx,'覆盖管理 C →',R,B+27,{align:'right',col:K.faint,mono:false,size:10});txt(ctx,'P',L-6,T+2,{align:'right',col:K.faint,size:10});
  const mk=(cv,pv,lab,col,big)=>{const x=X(cv),y=Y(pv);ctx.fillStyle=col;ctx.strokeStyle='#0a0b09';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,big?7:5,0,7);ctx.fill();ctx.stroke();if(lab){ctx.font=`500 11px ${FONT}`;const tw=ctx.measureText(lab).width,lx=x+tw+18>R?x-tw-20:x+10;ctx.fillStyle='rgba(10,11,9,.75)';rr(ctx,lx,y-10,tw+10,20,5);ctx.fill();txt(ctx,lab,lx+5,y,{col,mono:false,size:11,weight:500})}};
  mk(.38,.9,'传统',K.rust);mk(.08,.35,'梨树模式',K.jade);if(pr>.6)mk(c,p,'当前 '+f(ero(c,p,r),0),K.ink,true);
  const lg=ctx.createLinearGradient(0,B,0,T);cs.forEach((s,i)=>lg.addColorStop(i/(cs.length-1),s));ctx.fillStyle=lg;rr(ctx,R+14,T,8,B-T,3);ctx.fill();for(const v of [10,100,1000,baseA*2]){const t=(Math.log10(v)-lo)/(hi-lo);if(t<0||t>1)continue;txt(ctx,v>=1000?f(v/1000,v<1e4?1:0)+'k':v,R+26,B-t*(B-T),{col:K.faint,size:9})}
  if(st.hover){const[cv,pv]=st.hover;vline(ctx,X(cv),T,B,'rgba(255,255,255,.35)',[2,3]);hline(ctx,L,R,Y(pv),'rgba(255,255,255,.35)',[2,3])}
},{onMove:(e,x,y,st)=>{const r=$('cp-surface').getBoundingClientRect(),L=44,R=r.width-56,T=10,B=r.height-36;if(x<L||x>R||y<T||y>B){st.hover=null;hideTip();return render('cp-surface')}const cv=cRange[0]+(x-L)/(R-L)*(cRange[1]-cRange[0]),pv=pRange[0]+(B-y)/(B-T)*(pRange[1]-pRange[0]),v=ero(cv,pv,+$('r-factor').value);st.hover=[cv,pv];render('cp-surface');showTip(e,'点击设为当前情景',[['C',cv.toFixed(2)],['P',pv.toFixed(2)],['年均侵蚀',f(v,0)+' t/km²·a'],['相对容许值',f(v/TOL,2)+'×']])},
 onClick:(x,y)=>{const r=$('cp-surface').getBoundingClientRect(),L=44,R=r.width-56,T=10,B=r.height-36;if(x<L||x>R||y<T||y>B)return;const cv=cRange[0]+(x-L)/(R-L)*(cRange[1]-cRange[0]),pv=pRange[0]+(B-y)/(B-T)*(pRange[1]-pRange[0]);$('c-factor').value=(Math.round(cv*100)/100).toFixed(2);$('p-factor').value=(Math.round(pv*20)/20).toFixed(2);for(const id of ['c-factor','p-factor'])$(id).dispatchEvent(new Event('input'))}});
for(const id of ['c-factor','p-factor','r-factor'])$(id).addEventListener('input',sensitivity);
document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>{const[c,p,r]=b.dataset.preset.split(',');$('c-factor').value=c;$('p-factor').value=p;$('r-factor').value=r;for(const id of ['c-factor','p-factor','r-factor'])$(id).dispatchEvent(new Event('input'))});

/* ---------- 05 distribution table with box sparklines ---------- */
T.diagnostics.distribution.forEach(r=>{const tr=document.createElement('tr'),lo=r.p05-(r.p95-r.p05)*.06,hi=r.p95+(r.p95-r.p05)*.06,X=v=>((v-lo)/(hi-lo)*100).toFixed(2),skew=(r.p95-r.p50)/((r.p50-r.p05)||1e-9);
  const svg=`<svg viewBox="0 0 100 20" preserveAspectRatio="none" aria-label="P05 至 P95 分布箱线"><line x1="${X(r.p05)}" x2="${X(r.p95)}" y1="10" y2="10" stroke="rgba(236,230,214,.35)" stroke-width="1" vector-effect="non-scaling-stroke"/><rect x="${X(r.p25)}" y="4" width="${X(r.p75)-X(r.p25)}" height="12" rx="1.5" fill="rgba(224,164,88,.22)" stroke="rgba(224,164,88,.6)" vector-effect="non-scaling-stroke"/><line x1="${X(r.p50)}" x2="${X(r.p50)}" y1="2" y2="18" stroke="#e0a458" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
  const dec=r.unit==='—'?3:2;tr.innerHTML=`<td>${r.name}<br><small style="margin:0;font-size:10px;color:${skew>1.6?K.rust:skew<.62?K.cyan:K.faint}">${skew>1.6?'右偏 · 长尾':skew<.62?'左偏':'近对称'}</small></td><td class="dist-col">${svg}</td>`+['p05','p25','p50','p75','p95'].map(k=>`<td>${r[k].toFixed(dec)}</td>`).join('')+`<td>${r.unit}</td>`;$('distribution-table').appendChild(tr)});
if(E){setHTML('ndvi-cov',f(E.ndvi_coverage*100,2))}

/* ---------- wire up ---------- */
buildScatter();climateTakeaway();
$('climate-var').addEventListener('change',()=>{climateTakeaway();render('climate-chart')});
for(const id of ['scatter-x','scatter-y'])$(id).addEventListener('change',()=>{buildScatter();render('scatter-chart')});
sensitivity();
const renderAll=()=>charts.forEach((_,id)=>render(id));
let rt;window.addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(renderAll,120)});
renderAll();charts.forEach((_,id)=>io.observe($(id)));
window.CHARTS={render,renderAll,buildScatter,sensitivity};
})();
