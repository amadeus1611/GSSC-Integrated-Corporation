/* appearance: system, light or dark; remembered per viewer, eased between palettes */
const HOST_THEME=root.getAttribute("data-theme");let THEME=(()=>{try{return localStorage.getItem("expira.theme")||"system"}catch(e){return "system"}})();
function applyTheme(v,soft){if(soft&&!reduce&&document.startViewTransition&&!applyTheme.vt){applyTheme.vt=1;try{const t=document.startViewTransition(()=>applyTheme(v,false));t.finished.finally(()=>applyTheme.vt=0)}catch(e){applyTheme.vt=0;applyTheme(v,false)}return}root.classList.add("tnone");requestAnimationFrame(()=>requestAnimationFrame(()=>root.classList.remove("tnone")));setTimeout(()=>{try{plates.main&&plates.main.recolor();plates.minis.forEach(m=>m&&m.recolor())}catch(e){}},0);
 if(v==="system"){if(HOST_THEME)root.setAttribute("data-theme",HOST_THEME);else root.removeAttribute("data-theme")}else root.setAttribute("data-theme",v);
 THEME=v;try{localStorage.setItem("expira.theme",v)}catch(e){}document.querySelectorAll("[data-th]").forEach(b=>b.setAttribute("aria-checked",String(b.dataset.th===v)))}
applyTheme(THEME,false);
