const KEY='ss-story-ai-v1';
export function load(){try{return JSON.parse(localStorage.getItem(KEY))||{projects:[]}}catch{return{projects:[]}}}
export function save(db){localStorage.setItem(KEY,JSON.stringify(db))}
export function projectId(){return new URLSearchParams(location.search).get('project')}
export function getProject(){const db=load();return db.projects.find(p=>p.id===projectId())}
export function ensureProjectShape(p){p.characters??=[];p.world??=[];p.memory??=[];p.plot??=[];p.chapters??=[];p.chats??=[];return p}
export function newId(prefix='id'){return prefix+'_'+crypto.randomUUID()}
export function go(page,id=projectId()){location.href=`${page}?project=${encodeURIComponent(id)}`}
export function esc(s=''){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}