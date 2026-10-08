/* Diagnostics use full-resolution cached-raster quantiles, not display samples. */
T.diagnostics.distribution.forEach(r=>{let tr=document.createElement('tr');tr.innerHTML=`<td>${r.name}</td>`+['p05','p25','p50','p75','p95'].map(k=>`<td>${r[k].toFixed(r.unit==='—'?3:2)}</td>`).join('')+`<td>${r.unit}</td>`;$('distribution-table').appendChild(tr)});
$('hotspot-share').innerHTML=T.diagnostics.hotspot.erosion_share_pct.toFixed(1)+'<small>%</small>';
document.querySelectorAll('header nav a[href^="#"]').forEach(a=>a.onclick=()=>{document.querySelectorAll('header nav a').forEach(b=>b.classList.toggle('nav-active',b===a))});
let heatTooltip=document.createElement('div');heatTooltip.id='chart-popover';heatTooltip.setAttribute('role','status');heatTooltip.hidden=true;document.body.appendChild(heatTooltip);
// Surface native chart title text in a visible tooltip; remains available on tap.
for(let id of ['climate-chart','scatter-chart']){let c=$(id);c.addEventListener('pointermove',e=>{let value=c.title;if(!value)return;heatTooltip.textContent=value;heatTooltip.hidden=false;heatTooltip.style.cssText=`position:fixed;left:${Math.min(innerWidth-210,e.clientX+10)}px;top:${Math.max(8,e.clientY-45)}px;max-width:210px;background:#173b2d;color:#fff;padding:8px 11px;border-radius:5px;font-size:11px;z-index:60;pointer-events:none`});c.addEventListener('pointerleave',()=>heatTooltip.hidden=true)}
