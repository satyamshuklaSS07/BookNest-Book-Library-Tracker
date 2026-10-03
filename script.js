const $=s=>document.querySelector(s);
const LABEL={read:'Read',reading:'Reading',want:'Want to read'};
const TABS=[['all','All'],['read','Read'],['reading','Reading'],['want','Want to read']];
const KEY='book-library-v1';
let books=[],tab='all',editId=null,newId=null,ratedId=null;

function load(){try{const r=localStorage.getItem(KEY);if(r)return JSON.parse(r)}catch(e){}return null}
function save(){try{localStorage.setItem(KEY,JSON.stringify(books))}catch(e){}}
const yr=new Date().getFullYear();
books=load()||[
 {id:1,title:'Atomic Habits',author:'James Clear',status:'read',rating:5,added:1,finished:Date.now()},
 {id:2,title:'The Pragmatic Programmer',author:'Hunt & Thomas',status:'reading',rating:0,added:2},
 {id:3,title:'Deep Work',author:'Cal Newport',status:'want',rating:0,added:3},
 {id:4,title:'Sapiens',author:'Yuval Noah Harari',status:'read',rating:4,added:4,finished:Date.now()}
];

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function hue(s){let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))%360;return h}
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),1800)}

function count(el,to){
  const from=+el.dataset.v||0;el.dataset.v=to;
  if(from===to){el.textContent=to;return}
  const t0=performance.now(),d=700;
  (function f(t){const p=Math.min(1,(t-t0)/d),e=1-Math.pow(1-p,3);
    el.textContent=Number.isInteger(to)?Math.round(from+(to-from)*e):(from+(to-from)*e).toFixed(1);
    if(p<1)requestAnimationFrame(f)})(t0);
}

function renderStats(){
  const read=books.filter(b=>b.status==='read');
  const thisYear=read.filter(b=>new Date(b.finished||b.added).getFullYear()===yr).length;
  const rated=read.filter(b=>b.rating>0);
  const avg=rated.length?rated.reduce((a,b)=>a+b.rating,0)/rated.length:0;
  const items=[
   ['Books read',read.length,'#4b3fe0'],
   [`Read in ${yr}`,thisYear,'#12b886'],
   ['Reading now',books.filter(b=>b.status==='reading').length,'#f5a623'],
   ['Want to read',books.filter(b=>b.status==='want').length,'#ff5d8f'],
   ['Average rating ★',avg,'#f5a623']
  ];
  const box=$('#stats');
  if(!box.children.length)box.innerHTML=items.map(i=>`<div class="stat" style="--c:${i[2]}"><b>0</b><small>${i[0]}</small></div>`).join('');
  [...box.children].forEach((c,i)=>{c.querySelector('small').textContent=items[i][0];count(c.querySelector('b'),items[i][1])});
}

function renderTabs(){
  const tabs=$('#tabs'),pill=$('#pill');
  [...tabs.querySelectorAll('button')].forEach(b=>b.remove());
  TABS.forEach(([k,l])=>{
    const n=k==='all'?books.length:books.filter(b=>b.status===k).length;
    const b=document.createElement('button');
    b.setAttribute('role','tab');b.className=k===tab?'on':'';
    b.innerHTML=`${l}<em>${n}</em>`;
    b.onclick=()=>{tab=k;renderTabs();renderList()};
    tabs.appendChild(b);
  });
  const on=tabs.querySelector('.on');
  pill.style.width=on.offsetWidth+'px';
  pill.style.transform=`translateX(${on.offsetLeft-5}px)`;
}

function stars(b){
  if(b.status!=='read')return `<span class="hint">Rate it after you finish</span>`;
  let h=`<div class="stars ${ratedId===b.id?'pop':''}" role="group" aria-label="Rating">`;
  for(let i=1;i<=5;i++)h+=`<button data-id="${b.id}" data-r="${i}" style="--s:${i}" class="${i<=b.rating?'f':''}" aria-label="${i} star${i>1?'s':''}">★</button>`;
  return h+'</div>';
}

function renderList(){
  const q=$('#q').value.trim().toLowerCase(),sort=$('#sort').value;
  let list=books.filter(b=>(tab==='all'||b.status===tab)&&(b.title+b.author).toLowerCase().includes(q));
  list.sort((a,b)=>sort==='title'?a.title.localeCompare(b.title):sort==='rating'?b.rating-a.rating:b.added-a.added);
  const g=$('#grid');
  if(!list.length){g.innerHTML=`<div class="empty"><b>📖</b>${books.length?'No books match here.':'Your shelf is empty.'} Add a book above to get started.</div>`;return}
  g.innerHTML=list.map((b,i)=>{
    const h=hue(b.title);
    return `<article class="book ${b.id===newId?'new':''}" style="--i:${i}" data-id="${b.id}">
      <div class="cover" style="background:linear-gradient(160deg,hsl(${h} 70% 55%),hsl(${(h+40)%360} 65% 35%))">${esc(b.title)}</div>
      <div class="info">
        <h3>${esc(b.title)}</h3><p>${esc(b.author)}</p>
        ${stars(b)}
        <div class="acts">
          <select data-act="status" data-id="${b.id}" aria-label="Change status">
            ${Object.entries(LABEL).map(([k,v])=>`<option value="${k}" ${k===b.status?'selected':''}>${v}</option>`).join('')}
          </select>
          <button data-act="edit" data-id="${b.id}" aria-label="Edit">✏️</button>
          <button data-act="del" data-id="${b.id}" aria-label="Delete">🗑️</button>
        </div>
      </div>
    </article>`}).join('');
  newId=null;ratedId=null;
}

function render(){renderStats();renderTabs();renderList()}

$('#form').onsubmit=e=>{
  e.preventDefault();
  const title=$('#title').value.trim(),author=$('#author').value.trim(),status=$('#status').value;
  if(!title||!author)return;
  if(editId){
    const b=books.find(x=>x.id===editId);
    if(b.status!==status&&status==='read')b.finished=Date.now();
    Object.assign(b,{title,author,status});
    if(status!=='read')b.rating=0;
    editId=null;$('#submit').textContent='Add book';toast('Book updated');
  }else{
    const id=Date.now();
    books.push({id,title,author,status,rating:0,added:id,finished:status==='read'?id:null});
    newId=id;toast('Book added');
  }
  save();e.target.reset();render();
};

$('#grid').addEventListener('click',e=>{
  const r=e.target.closest('[data-r]');
  if(r){const b=books.find(x=>x.id==r.dataset.id);b.rating=b.rating==r.dataset.r?0:+r.dataset.r;ratedId=b.id;save();render();return}
  const a=e.target.closest('[data-act]');if(!a)return;
  const id=+a.dataset.id,b=books.find(x=>x.id===id);
  if(a.dataset.act==='del'){
    const card=a.closest('.book');card.classList.add('out');
    setTimeout(()=>{books=books.filter(x=>x.id!==id);save();render();toast('Book deleted')},280);
  }
  if(a.dataset.act==='edit'){
    editId=id;$('#title').value=b.title;$('#author').value=b.author;$('#status').value=b.status;
    $('#submit').textContent='Save changes';$('#title').focus();window.scrollTo({top:0,behavior:'smooth'});
  }
});
$('#grid').addEventListener('change',e=>{
  if(e.target.dataset.act!=='status')return;
  const b=books.find(x=>x.id==e.target.dataset.id);
  b.status=e.target.value;
  if(b.status==='read')b.finished=Date.now();else b.rating=0;
  save();render();toast('Moved to '+LABEL[b.status]);
});
$('#q').oninput=renderList;$('#sort').onchange=renderList;
$('#theme').onclick=()=>{
  const r=document.documentElement,dark=getComputedStyle(r).getPropertyValue('--bg').trim()==='#10122b';
  r.dataset.theme=dark?'light':'dark';
};
window.addEventListener('resize',renderTabs);
document.fonts&&document.fonts.ready.then(renderTabs);
render();
