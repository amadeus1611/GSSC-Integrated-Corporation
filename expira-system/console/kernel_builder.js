/* ---------- the kernel builder: runtime/build_derivative.py (Mode B), ported line for line ----------
   A derivative is the quotation master's <head> carried verbatim, at most one appended derivative style,
   and a new <body> written in the master's component vocabulary; brand assets hydrate from the package,
   hash-verified, byte-identical to the master's. Any failed check is a hard stop: nothing is delivered. */
const K_STYLE_RE=/<style\b[^>]*>[\s\S]*?<\/style>/g;
const K_PRIMARY="duke_y_demayo";
function kB64(b64){if(typeof atob==="function"){const s=atob(b64),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u}return new Uint8Array(Buffer.from(b64,"base64"))}
async function kSha(u){if(typeof crypto!=="undefined"&&crypto.subtle){const h=await crypto.subtle.digest("SHA-256",u);return [...new Uint8Array(h)].map(b=>b.toString(16).padStart(2,"0")).join("")}return require("crypto").createHash("sha256").update(u).digest("hex")}
async function kAssemble(K,src,opt={}){
 const checks=[],fail=m=>({ok:false,error:m,checks});
 const master=K.template,ver=K.assembly.verification;
 const title=src.match(/<title>([\s\S]*?)<\/title>/),bodyM=src.match(/<body\b[\s\S]*?<\/body>/);
 if(!title||!bodyM)return fail("The source needs a <title> and a <body>.");
 let body=bodyM[0];const pre=src.slice(0,bodyM.index);
 const dstyles=pre.match(K_STYLE_RE)||[];
 const link=pre.match(/<link rel="gssc-derivative-style" href="([^"]+)"\s*\/?>/);
 if(link){const stem=link[1].split("/").pop().replace(/\.css$/,"");const css=K.derivative_css[stem];if(css==null)return fail(`Unknown derivative style layer: ${stem}.`);dstyles.push(`<style id="gssc-derivative-${stem}">\n${css}</style>`)}
 if(dstyles.length>1)return fail("A derivative may append ONE style element (Module 10 additive rule).");
 if(dstyles.length&&dstyles[0].includes(":root"))return fail("Derivative tokens belong on a scoped class, not :root (Module 10 additive rule).");
 checks.push(["One derivative style at most",true]);
 const officers=K.kernel["02_governance"].active_officers;
 if(src.includes("{{GSSC_SIGNATORY_2:")){const key=opt.second;
  if(!officers[key])return fail(`This document needs a second signatory: one of ${Object.keys(officers).filter(k=>k!==K_PRIMARY).join(", ")}.`);
  if(key===K_PRIMARY)return fail("The second signatory must be someone other than the President.");
  body=body.split("{{GSSC_SIGNATORY_2:name}}").join(officers[key].name).split("{{GSSC_SIGNATORY_2:titles}}").join(officers[key].titles.join(" · "));
  checks.push([`Second signatory from 02_governance: ${officers[key].name}`,true])}
 const head0=master.slice(0,master.indexOf("</head>"));let masterStyles=head0.match(K_STYLE_RE)||[];
 if(dstyles.length){const css=dstyles[0].replace(/\/\*[\s\S]*?\*\//g,"");const sel=[...css.replace(/<[^>]+>/g,"").matchAll(/([^{}]+)\{/g)].map(m=>m[1]).join(" ");
  const cls=t=>new Set([...t.matchAll(/\.([A-Za-z][\w-]*)/g)].map(m=>m[1]));const mine=cls(sel),theirs=cls(masterStyles.join(" "));const clash=[...mine].filter(x=>theirs.has(x)).sort();
  if(clash.length)return fail(`The derivative style reuses master class names (${clash.join(", ")}); choose new names.`)}
 checks.push(["No master class names redefined",true]);
 const head=head0.replace(/<title>[\s\S]*?<\/title>/,`<title>${title[1].trim()}</title>`);
 const kv=K.kernel["00_meta"].kernel_identity.kernel_version,name=opt.name||"GSSC-DERIVATIVE.html";
 const prov="\n<!--GSSC DERIVATIVE PROVENANCE (Module 10 provenance_rule)\n"+`  document: ${name}\n`+`  master: GSSC Universal Quotation Master (package quotation_template_payload_base64), kernel ${kv}\n`+`  master tokenized sha256: ${ver.tokenized_template_sha256}\n`+`  verified against hydrated digest: ${ver.hydrated_template_sha256}\n`+`  carried verbatim: ${masterStyles.length} master style elements, masthead/margin-rail/watermark/stripe/colophon, A4 geometry, print rules\n`+`  substitutions: <title>; <body> element (data-* attributes and content, written in master component vocabulary)${dstyles.length?"; one appended derivative style element":""}\n`+"  assets: hydrated from package brand_assets, byte-identical to the master\n"+(opt.builder||"  builder: gssc-system/runtime/build_derivative.py -->\n");
 let out=head+prov+(dstyles.length?dstyles[0]+"\n":"")+"</head>\n"+body+"\n</html>\n";
 const payloads=new Set();
 for(const [n,a] of Object.entries(K.brand_assets)){const raw=kB64(a.base64);if(await kSha(raw)!==a.sha256_of_decoded_image)return fail(`Asset hash mismatch for ${n}.`);payloads.add(a.base64);const v=`data:${a.mime_type};base64,${a.base64}`;out=out.split(a.token).join(v);masterStyles=masterStyles.map(s=>s.split(a.token).join(v))}
 checks.push(["Brand assets hash-verified and hydrated",true]);
 if(out.includes("{{GSSC_ASSET:"))return fail("An asset token was left unresolved.");
 if(out.includes("{{GSSC_SIGNATORY_2:"))return fail("A signatory token was left unresolved.");
 checks.push(["Zero unresolved tokens",true]);
 const missing=masterStyles.filter(s=>!out.includes(s));if(missing.length)return fail("Master style elements were not carried verbatim.");
 checks.push([`${masterStyles.length} master style elements carried verbatim`,true]);
 const foreign=[...out.matchAll(/data:image\/[a-z+]+;base64,([A-Za-z0-9+/=]+)/g)].map(m=>m[1]).filter(x=>!payloads.has(x));if(foreign.length)return fail("A foreign image payload was introduced.");
 checks.push(["No foreign images",true]);
 const pages=(out.match(/<section class="page\b/g)||[]).length;
 return {ok:true,html:out,pages,checks,kernel:kv}}
if(typeof module!=="undefined")module.exports={kAssemble};
