/* reads the planner's JSON while it streams: the thoughts so far, and each desk as soon as its object closes */
function jstr(t,i){let o="";i++;while(i<t.length){const c=t[i];if(c==="\\"){const n=t[i+1];if(n===undefined)return [o,-1];if(n==="u"){const x=t.substr(i+2,4);if(x.length<4)return [o,-1];o+=String.fromCharCode(parseInt(x,16));i+=6;continue}o+=({n:"\n",t:"\t",r:"",b:"",f:""})[n]??n;i+=2;continue}if(c==='"')return [o,i+1];o+=c;i++}return [o,-1]}
function peekPlan(t){const r={thinking:[],partial:false,steps:[]};let m=t.indexOf('"thinking"');
 if(m>=0){let i=t.indexOf("[",m);if(i>=0){i++;while(i<t.length){while(i<t.length&&/[\s,]/.test(t[i]))i++;if(t[i]!=='"')break;const [v,e]=jstr(t,i);r.thinking.push(v);if(e<0){r.partial=true;break}i=e}}}
 m=t.indexOf('"steps"');if(m>=0){let i=t.indexOf("[",m);if(i>=0){i++;while(i<t.length){while(i<t.length&&/[\s,]/.test(t[i]))i++;if(t[i]!=="{")break;let d=0,j=i,q=false;
  for(;j<t.length;j++){const c=t[j];if(q){if(c==="\\")j++;else if(c==='"')q=false;continue}if(c==='"')q=true;else if(c==="{")d++;else if(c==="}"&&--d===0)break}
  if(j>=t.length)break;try{r.steps.push(JSON.parse(t.slice(i,j+1)))}catch(e){break}i=j+1}}}
 return r}

