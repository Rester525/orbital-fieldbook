export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeUrl(value) { try {const u=new URL(value); return ['https:','http:'].includes(u.protocol)?u.href:'#';} catch {return '#';} }
export const link = (url,label) => `<a href="${esc(safeUrl(url))}" target="_blank" rel="noopener noreferrer">${esc(label)} <span aria-label="opens online">↗</span></a>`;
export function sourceList(refs=[]) {return `<ol class="sources">${refs.map(s=>`<li>${link(s.url,s.title||s.url)}<br><small>${esc(s.locator)} · ${esc(s.checked_at||'Date not supplied')} · ${esc(s.status||'Source review needed')}</small></li>`).join('')}</ol>`;}
export const badge = (text,cls='') => `<span class="badge ${cls}">${esc(text)}</span>`;
export function heading(kicker,title,description=''){return `<header class="page-heading"><p class="eyebrow">${esc(kicker)}</p><h1>${esc(title)}</h1>${description?`<p class="lede">${esc(description)}</p>`:''}</header>`;}
export function download(name,content,type='application/json'){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function table(headers,rows,caption='Study data'){return `<div class="table-wrap"><table><caption>${esc(caption)}</caption><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
export function notify(text,error=false){const el=document.getElementById('notice');if(!el)return;el.textContent=text;el.classList.toggle('error',error);el.hidden=false;}
export function go(route){location.hash=route;}
export function paragraphs(text){return String(text??'').split('\n\n').map(t=>`<p>${esc(t)}</p>`).join('');}
