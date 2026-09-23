const fs=require('fs');const INK='#0B1A3F',GOLD='#AE8A47';
const wm=(W)=>`<div style="width:${W}px;height:${(W*(273/1215)).toFixed(1)}px;background:${INK};-webkit-mask:url(word_alpha.png) center/100% 100% no-repeat"></div>`;
const mk=(W)=>`<img src="arch_mark.svg" width="${W}" style="display:block">`;
// shard: gold parallelogram at the mark's crack angle
const shard=(h)=>`<svg width="${(h*0.55).toFixed(1)}" height="${h}" viewBox="0 0 55 100" style="display:block"><polygon points="0,0 22,0 55,100 33,100" fill="${GOLD}"/></svg>`;
const line=(s,ls=.32)=>`<div style="font:700 ${s}px/1 'Cinzel';letter-spacing:${ls}em;margin-right:-${ls}em;color:${INK}">AI SYSTEMS</div>`;
const desc1=(s)=>`<div style="display:flex;align-items:center;gap:${s*.6}px">${shard(s*1.25)}${line(s)}${'<div style="transform:scaleX(-1)">'+shard(s*1.25)+'</div>'}</div>`;
const desc2=(s)=>`<div style="display:flex;align-items:stretch;gap:${s*.45}px">${shard(s*2.25)}<div style="display:flex;flex-direction:column;justify-content:space-between;font:700 ${s}px/1 'Cinzel';color:${INK};letter-spacing:.2em"><div>AI</div><div>SYSTEMS</div></div></div>`;
const col=(...x)=>`<div style="display:flex;flex-direction:column;align-items:center">${x.join('')}</div>`;
const row=(g,...x)=>`<div style="display:flex;align-items:center;gap:${g}px">${x.join('')}</div>`;
const gap=h=>`<div style="height:${h}px"></div>`;
const A={
 // kernel brand_assets equivalents
 seal:mk(720),
 wordmark:wm(1200),
 header:row(48,mk(560),wm(620)),
 signature:row(44,wm(640),desc2(62)),
 watermark:col(mk(1100),gap(120),wm(1100)),
 // extended lockups
 primary_stacked_full:col(mk(1000),gap(110),wm(1040),gap(80),desc1(62)),
 horizontal_full:row(56,mk(620),wm(680),desc2(70)),
 stacked:col(mk(1000),gap(120),wm(1040)),
};
let h='<!doctype html><html><head><meta charset=utf-8><link href="c.css" rel=stylesheet><style>body{margin:0;background:transparent}.a{display:inline-block;padding:4px;margin:40px}</style></head><body>';
for(const k in A)h+=`<div class=a id="${k}">${A[k]}</div><br>`;
fs.writeFileSync('assets.html',h+'</body></html>');fs.writeFileSync('aids.json',JSON.stringify(Object.keys(A)));
