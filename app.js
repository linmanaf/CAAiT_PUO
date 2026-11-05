/* CAAiT SPA: one router, one submit listener, server-backed administration. */
'use strict';
const data=window.CAAIT;
// getRandomValues also works on trusted LAN HTTP, where randomUUID may be unavailable.
function randomId(){const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const h=[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);}

const routes=[['welcome','Selamat datang','◈'],['dashboard','Dashboard utama','▦'],['about','Pengenalan CAAiT','ⓘ'],['organization','Struktur organisasi','♧'],['roadmap','Roadmap','↗'],['programs','Program & pencapaian','▤'],['partners','Kerjasama & hala tuju','⇄'],['training','Latihan','▣'],['feedback','Maklum balas','✉'],['admin','Log masuk admin','♙']];
let labels=Object.fromEntries([...routes.map(r=>[r[0],r[1]]),...data.training.map(t=>[t.id,t.title])]);
const content=document.querySelector('#content');
function showSuccess(message){
 const dialog=document.querySelector('#success-dialog');
 document.querySelector('#success-message').textContent=message;
 if(!dialog.open)dialog.showModal();
}
let session=null,current='',feedbackRequest=randomId(),renderToken=0,statsRequest=0;
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const e=escapeHTML;
const num=value=>CAAITVisuals.num(value);
const list=items=>`<ul>${items.map(x=>`<li>${e(x)}</li>`).join('')}</ul>`;
const head=(title,subtitle)=>`<div class="page-head"><div class="eyebrow">CAAiT @ POLYCC</div><h1>${e(title)}</h1><p class="muted">${e(subtitle)}</p></div>`;
// Direction is carried by an arrow plus a word, never by colour alone.
function delta(change,period){
 if(change==null)return '';
 const rounded=Math.round(change);
 const way=rounded>0?'up':rounded<0?'down':'flat';
 const word={up:'naik',down:'turun',flat:'sama'}[way];
 const arrow={up:'↑',down:'↓',flat:'→'}[way];
 return `<span class="stat-delta is-${way}"><span class="delta-arrow" aria-hidden="true">${arrow}</span>${e(`${word} ${Math.abs(rounded)}% ${period}`)}</span>`;
}
function stat(value,label,options={}){
 const {count=null,suffix='',change=null,period='',spark=null,note=''}=options;
 const figure=count==null?`<strong>${e(value)}</strong>`:`<strong data-count="${Number(count)}" data-suffix="${e(suffix)}">${e(num(count)+suffix)}</strong>`;
 return `<div class="stat">${figure}<span>${e(label)}</span>${delta(change,period)}${spark?CAAITVisuals.sparkline(spark):''}${note?`<span class="stat-note">${e(note)}</span>`:''}</div>`;
}
const trainingLinks=()=>data.training.length?data.training.map((t,i)=>`<a class="training-link" href="#${t.id}"><span class="number">${String(i+1).padStart(2,'0')}</span><div><h3>${e(t.title)}</h3><p>${e(t.description)}</p></div><span aria-hidden="true">↗</span></a>`).join(''):'<p class="empty">Belum ada modul latihan.</p>';
const bars=(items,options)=>CAAITVisuals.bars(items,options);
// Admin-entered lists arrive as text: one item per line, "Tajuk :: Butiran" for pairs.
const toLines=value=>String(value??'').split('\n').map(x=>x.trim()).filter(Boolean);
const toPairs=value=>toLines(value).map(line=>{const at=line.indexOf('::');return at<0?[line,'']:[line.slice(0,at).trim(),line.slice(at+2).trim()];});
// Admin text can reach an href, so only absolute http(s) links are ever rendered as links.
const safeURL=value=>/^https?:\/\//i.test(String(value??'').trim())?String(value).trim():'';
const fromRow=row=>({id:row.slug,title:row.title,tag:row.tag,description:row.description,
 objectives:toLines(row.objectives),requirements:row.requirements,steps:toPairs(row.steps),
 prompt:row.prompt,practice:row.practice,outcome:row.outcome,sources:toPairs(row.sources),row});
const toRow=t=>t.row??{slug:t.id,title:t.title,tag:t.tag,description:t.description,
 objectives:(t.objectives||[]).join('\n'),requirements:t.requirements,
 steps:(t.steps||[]).map(([a,b])=>a+' :: '+b).join('\n'),
 prompt:t.prompt,practice:t.practice,outcome:t.outcome,
 sources:(t.sources||[]).map(([a,b])=>a+' :: '+b).join('\n')};
function rebuildLabels(){labels=Object.fromEntries([...routes.map(r=>[r[0],r[1]]),...data.training.map(t=>[t.id,t.title])]);}
// Opened straight from disk the page still renders, but the browser blocks every request to
// the API, so each one fails identically. Name that cause instead of blaming the connection.
const fromDisk=location.protocol==='file:';
const unreachable=()=>fromDisk
 ? 'Halaman ini dibuka terus daripada fail, jadi pelayan tidak boleh dihubungi. Buka http://localhost/CAAIT%20Project/ melalui XAMPP.'
 : 'Tidak dapat menghubungi pelayan. Pastikan Apache dan MySQL sedang berjalan dalam XAMPP, kemudian cuba semula.';
async function api(action,body,params='',allowRetry=true){
 let response;try{response=await fetch(`api/index.php?action=${action}${params}`,{method:body?'POST':'GET',credentials:'same-origin',headers:body?{'Content-Type':'application/json','X-CSRF-Token':session?.csrf??''}:{},body:body?JSON.stringify(body):undefined});}catch{throw Error(unreachable());}
 let result;try{result=await response.json();}catch{throw Error('Pelayan tidak memberi respons yang sah. Semak sambungan dan cuba semula.');}
 if(response.ok)return result;
 // A tab left open outlives its server session: PHP drops the old session and issues a new
 // CSRF token, so the cached one is rejected. Fetch the current token and replay the write
 // once, instead of making the user reload and retype. must_change is a real 403, not a stale token.
 if(response.status===403&&body&&allowRetry&&action!=='session'&&!result.must_change){
  session=await api('session');
  // The replacement session also resets the server's "form opened at" baseline, which the
  // feedback endpoint uses to reject instant submissions. Let that baseline age past the
  // guard before replaying, so recovering a stale token cannot trip the anti-bot check.
  if(body.request_id)await new Promise(done=>setTimeout(done,2200));
  return api(action,body,params,false);
 }
 throw Error(result.error||'Permintaan gagal.');
}
function programCard(p){const status={reported:'Direkodkan',mixed:'LOI & perancangan',future:'Kerjasama masa hadapan'};return `<article class="program" data-status="${p.status}">${p.image?`<img src="assets/${p.image}" alt="${e(p.title)}" loading="lazy">`:`<span class="number">${String(p.id).padStart(2,'0')}</span>`}<div><span class="badge ${p.status==='reported'?'':'future'}">${status[p.status]}</span><h3>${e(p.title)}</h3><p class="muted">${e(p.date)}</p><p>${e(p.text)}</p>${p.audience?`<strong>${p.audienceLabel} active streaming</strong>`:''}${p.image?`<a href="assets/${p.image}" target="_blank" rel="noopener">Lihat imej penuh ↗</a>`:''}</div></article>`;}
function welcome(){
 const audiences=data.programs.filter(p=>p.audience!=null);
 const reach=audiences.reduce((sum,p)=>sum+p.audience,0);
 const marks=[[data.programs.length,'entri rekod'],[num(reach)+'++','jangkauan dilaporkan'],[data.roadmap.length,'peringkat hala tuju'],[data.training.length,'modul latihan']];
 return `<section class="welcome">${CAAITVisuals.neural({density:0.00017,max:95,link:155})}<div class="welcome-inner"><img class="welcome-logo" src="assets/caait.png" alt="CAAiT — Centre for Applied Artificial Intelligence Technology"><p class="welcome-eyebrow">Politeknik Ungku Omar · POLYCC</p><h1>Pengetahuan.<br>Aplikasi. Impak.</h1><p class="welcome-lead">${e(data.intro)}</p><div class="actions"><a class="btn" href="#dashboard">Buka dashboard ↗</a><a class="btn secondary" href="#about">Kenali CAAiT</a></div><div class="welcome-marks">${marks.map(([value,label])=>`<div><strong>${e(value)}</strong><span>${e(label)}</span></div>`).join('')}</div></div></section>`;
}
// Setiap angka di bawah dikira daripada rekod dalam content.js; tiada yang dianggarkan.
function byYear(){
 // Entri yang belum bertarikh tidak menjadi lajur; ia masih dikira dalam jumlah rekod.
 const order=['2024','2025','2025–2026','2026'];
 return order.map(year=>({label:year,value:data.programs.filter(p=>p.year===year).length}));
}
function dashboard(){
 const audiences=data.programs.filter(p=>p.audience!=null);
 const reach=audiences.reduce((sum,p)=>sum+p.audience,0);
 const years=byYear();
 const dated=years.reduce((sum,y)=>sum+y.value,0);
 const busiest=years.reduce((best,y)=>y.value>best.value?y:best,years[0]);
 const top=audiences.reduce((best,p)=>p.audience>best.audience?p:best,audiences[0]);
 return `<div class="intro-grid"><section class="hero"><div class="eyebrow">Politeknik Ungku Omar</div><h1>AI gunaan untuk<br>pendidikan TVET.</h1><p>${e(data.intro)}</p><div class="actions"><a class="btn" href="#about">Kenali CAAiT ↗</a><a class="btn secondary" href="#training">Teroka latihan</a></div><div class="hero-mesh" aria-hidden="true"></div>${CAAITVisuals.neural({density:0.00013,max:58,link:128})}</section><section class="feature"><span class="badge">Titik mula</span><strong>Ogos 2024</strong><h2>Penubuhan CAAiT</h2><p>Pembangunan bakat, perkongsian ilmu, pembangunan kurikulum dan etika AI.</p><a href="#roadmap">Lihat roadmap ↗</a></section></div>
<div class="stats">${stat(null,'Entri program, pencapaian & perancangan',{count:data.programs.length})}${stat(null,'Jumlah asas active streaming dilaporkan',{count:reach,suffix:'++',note:'3 program berangka'})}${stat(null,'Tahun paling aktif dalam rekod',{count:busiest.value,note:busiest.label+' · entri terbanyak'})}${stat(null,'Modul pembelajaran tambahan',{count:data.training.length,note:'Bukan pensijilan rasmi'})}</div>
<div class="chart-row"><section class="panel chart-main"><div class="chart-card-title"><div><span class="chart-kicker">Garis masa rekod</span><h2>Aktiviti mengikut tahun</h2></div><span class="chart-period">${dated} entri bertarikh</span></div><p class="muted">Setiap entri dikira sekali mengikut tarikhnya. Entri yang merentas dua tahun dikekalkan sebagai kategori tersendiri.</p>${CAAITVisuals.columns(years,{unit:'entri',caption:'Bilangan entri',emphasis:busiest.label})}${dated<data.programs.length?`<p class="source">${e(data.programs.length-dated)} entri belum bertarikh dan tidak dipaparkan sebagai lajur.</p>`:''}</section>${CAAITVisuals.composition(data.programs)}</div>
<div class="grid-2"><section class="panel"><div class="chart-card-title"><div><span class="chart-kicker">Jangkauan</span><h2>Perkongsian AI</h2></div></div><p class="muted">Active streaming yang dilaporkan.</p>${bars(audiences.map(p=>({label:p.title,value:p.audience,display:p.audienceLabel})),{unit:'active streaming',caption:'Active streaming',emphasis:top.title,summary:'Lihat jadual jangkauan'})}<p class="source">Panjang bar menggunakan nilai asas. “++” bermaksud melebihi angka tersebut. Ini bukan jumlah pelawat unik website; program lain tidak dianggap sifar.</p><p>${e(top.title)} merekodkan angka asas penonton tertinggi antara tiga program yang mempunyai data.</p></section><section class="panel"><div class="chart-card-title"><div><span class="chart-kicker">Belajar</span><h2>Ruang latihan</h2></div></div><p class="muted">Belajar menghasilkan, membina dan menerbitkan dashboard.</p>${trainingLinks()}<p class="source">Kandungan latihan tambahan; bukan rekod program atau pensijilan rasmi CAAiT.</p></section></div>
<section class="panel"><div class="chart-card-title"><div><span class="chart-kicker">Hala tuju</span><h2>Roadmap CAAiT</h2></div><a class="btn secondary" href="#roadmap">Perincian penuh ↗</a></div><p class="muted">Enam peringkat hala tuju CAAiT. Warna semakin pekat mengikut urutan peringkat, bukan peratus siap.</p>${CAAITVisuals.stages(data.roadmap.map(([title,date,body])=>({title,date,body})))}</section>
<section class="panel"><div class="chart-card-title"><div><span class="chart-kicker">Sorotan</span><h2>Pencapaian dalam fokus</h2></div></div>${programCard(data.programs.find(p=>p.id===10))}<a href="#programs">Semua program dan pencapaian ↗</a></section>`;}
function about(){return head('Pengenalan CAAiT','Center for Applied Artificial Intelligence Technology')+`<div class="grid-2"><section class="panel"><h2>Peranan CAAiT</h2><p>${e(data.intro)}</p><h2 class="section-gap">Misi</h2>${list(data.missions)}<p class="note">Pensijilan ialah aspirasi dalam misi. Ia tidak bermaksud tiga modul latihan dashboard ini menawarkan sijil atau pengiktirafan rasmi.</p></section><section class="panel"><a href="assets/pengenalan.png" target="_blank" rel="noopener"><img class="full-image" src="assets/pengenalan.png" alt="Poster asal pengenalan dan empat misi CAAiT"></a></section></div>`;}
function organization(){
 const chain=data.organization.map(([name,role,photo],index)=>`<li class="org-node" style="--i:${index}"><span class="org-link" aria-hidden="true"></span><span class="org-rank" aria-hidden="true">${String(index+1).padStart(2,'0')}</span><span class="org-portrait"><img class="org-face" src="assets/people/${photo}.png" alt="" loading="lazy" width="74" height="74"></span><div class="org-id"><strong>${e(name)}</strong><span>${e(role)}</span></div></li>`).join('');
 const depts=data.coordinators.map((code,index)=>`<article class="org-dept" style="--i:${index}"><span class="org-dept-code">${e(code)}</span><span class="org-dept-label">Koordinator jabatan</span></article>`).join('');
 return head('Struktur organisasi','Rantaian tanggungjawab CAAiT, daripada JPPKK hingga koordinator jabatan.')+`<section class="panel org-panel"><ol class="org-chain">${chain}</ol><div class="org-branch"><span class="org-branch-line" aria-hidden="true"></span><h3>Koordinator jabatan</h3><p class="muted">Tujuh jabatan menyelaraskan pelaksanaan AI di peringkat program.</p><div class="org-grid">${depts}</div></div></section>`;
}
function roadmap(){return head('Roadmap CAAiT','Daripada penubuhan kepada pengembangan ekosistem AI gunaan.')+`<section class="panel">${CAAITVisuals.stages(data.roadmap.map(([title,date,body])=>({title,date,body})))}<p>Rujukan strategik: POLI DIGITAL, POLYCC Artificial Intelligence Reform Agenda (PAIR), serta Hala Tuju Transformasi Politeknik 2023–2030.</p></section>`;}
function programs(){return head('Program & pencapaian','Rekod aktiviti dan rancangan dipisahkan mengikut status pengesahan.')+`<div class="filter"><label>Tapis rekod<select id="program-filter"><option value="all">Semua ${data.programs.length} entri</option><option value="reported">Direkodkan</option><option value="mixed">LOI & perancangan</option><option value="future">Kerjasama masa hadapan</option></select></label></div><section class="panel">${data.programs.map(programCard).join('')}</section>`;}
function partners(){return head('Kerjasama & hala tuju','Hubungan yang disebut dalam aktiviti dibezakan daripada peluang dan rancangan masa hadapan.')+`<div class="grid-2"><section class="panel"><h2>Hubungan dalam program</h2>${list(['Benchmarking 2024: MDEC, CAIRO UTM dan HEJIM UKM; foto La Trobe University.','AI Awareness: CAAiT × CAIRO.','AI Project in Action: AIBiG, Korea Selatan dan Indonesia. Poster menamakan Dongyang Mirae University, Politeknik Bandung dan C-TECH.','Latihan pensyarah: DTex MDEC, SOLS dan AI Integration Design Program, University of New South Wales, Sydney.'])}<p class="source">Penglibatan dalam program bukan bukti bahawa semua hubungan mempunyai MoU.</p></section><section class="panel"><h2>Kerjasama dalam perancangan</h2>${programCard(data.programs[5])}${programCard(data.programs[11])}</section></div><section class="panel"><h2>Arah pengembangan</h2>${list(['Program akan datang seperti Polytechnic AI dan Diploma in Applied AI; penawaran diploma disasarkan pada 2027.','Keutamaan penyelidikan dan pengembangan peringkat serantau, nasional serta antarabangsa.','Hubungan industri dan peluang pengkomersialan inovasi.','Peluang kolaborasi bersama industri, akademik dan agensi kerajaan; universiti, MDEC dan HRD Corp disebut sebagai contoh.','Mengalu-alukan kerjasama atau MoU dengan industri.'])}</section>`;}
function training(id){const t=data.training.find(t=>t.id===id);if(!t)return head('Latihan','Tiga modul pembelajaran tambahan untuk membina kemahiran menghasilkan dashboard.')+`<section class="panel">${trainingLinks()}</section>`;return head(t.title,t.description)+`<p><a href="#training">← Semua latihan</a></p><p class="note">Kandungan latihan tambahan berdasarkan dokumentasi produk rasmi. Semua contoh angka ialah data latihan, bukan fakta CAAiT.</p><div class="grid-2"><section class="panel"><h2>Objektif pembelajaran</h2>${list(t.objectives)}</section><section class="panel"><h2>Keperluan asas</h2><p>${e(t.requirements)}</p></section></div><section class="panel"><h2>Langkah pembelajaran</h2>${t.steps.map(([title,body],i)=>`<article class="step"><h3>${i+1}. ${e(title)}</h3><p>${e(body)}</p></article>`).join('')}</section><div class="grid-2"><section class="panel"><h2>${id==='github'?'Contoh arahan Git':'Contoh arahan AI'}</h2><pre>${e(t.prompt)}</pre></section><section class="panel"><h2>Latihan praktikal</h2><p>${e(t.practice)}</p><h3>Hasil yang boleh dicapai</h3><p>${e(t.outcome)}</p></section></div><section class="panel"><h2>Rujukan rasmi</h2><ul>${t.sources.map(([n,u])=>{const href=safeURL(u);return `<li>${href?`<a href="${e(href)}" target="_blank" rel="noopener">${e(n)} ↗</a>`:e(n)}</li>`;}).join('')}</ul><p class="source">Disemak pada 4 November 2026. Antara muka dan akses ciri boleh berubah mengikut versi atau pelan.</p></section>`;}
function feedback(){return head('Maklum balas','Bantu kami menambah baik kandungan dan pengalaman dashboard.')+`<section class="panel form-panel"><p class="muted">Nama dan e-mel adalah pilihan. Maklum balas hanya boleh dibaca oleh admin. Elakkan maklumat sulit dalam mesej.</p><form id="feedback-form"><div class="grid-2"><label>Nama (pilihan)<input name="name" maxlength="120" autocomplete="name"></label><label>E-mel (pilihan)<input name="email" type="email" maxlength="254" autocomplete="email"></label></div><div class="grid-2"><label>Modul berkaitan<select name="module">${Object.entries(labels).filter(([k])=>k!=='admin').map(([k,v])=>`<option value="${k}">${e(v)}</option>`).join('')}</select></label><label>Rating<select name="rating" required><option value="">Pilih rating</option>${[5,4,3,2,1].map(n=>`<option value="${n}">${n} / 5</option>`).join('')}</select></label></div><label>Mesej<textarea name="message" rows="5" minlength="5" maxlength="5000" required></textarea></label><label class="honeypot" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label><button class="btn" type="submit">Hantar maklum balas</button><p class="form-message" role="status" aria-live="polite"></p></form></section><p class="source">Analytics menggunakan pengecam rawak pelayar untuk menganggarkan pelawat unik, tanpa fingerprinting. Mengosongkan storan atau menggunakan peranti lain menghasilkan pengecam baharu.</p>`;}
function passwordForm(){return `<section class="panel form-panel"><h2>Tukar kata laluan</h2><p>Gunakan kata laluan baharu sekurang-kurangnya 12 aksara.</p><form id="password-form"><label>Kata laluan semasa<input type="password" name="current_password" required autocomplete="current-password"></label><label>Kata laluan baharu<input type="password" name="new_password" minlength="12" maxlength="72" required autocomplete="new-password"></label><label>Sahkan kata laluan baharu<input type="password" name="confirm_password" minlength="12" required autocomplete="new-password"></label><button class="btn">Simpan kata laluan</button><p class="form-message" role="status"></p></form></section>`;}
let trainingEditing=null;
function trainingPanel(){
 const rows=data.training.length?data.training.map(t=>`<div class="training-row${trainingEditing===t.id?' is-editing':''}"><div class="training-row-id"><strong>${e(t.title)}</strong><span>${e(t.id)} · ${e(t.tag)}</span></div><div class="training-row-actions"><button type="button" class="btn secondary" data-train-edit="${e(t.id)}">Edit</button><button type="button" class="btn secondary is-danger" data-train-delete="${e(t.id)}">Buang</button></div></div>`).join(''):'<p class="empty">Belum ada modul latihan. Tambah satu di bawah.</p>';
 const current=trainingEditing?data.training.find(x=>x.id===trainingEditing):null;
 const r=current?toRow(current):{};
 const text=(name,label,hint)=>`<label>${e(label)}<input name="${name}" value="${e(r[name]??'')}" maxlength="400" required>${hint?`<span class="field-hint">${e(hint)}</span>`:''}</label>`;
 const area=(name,label,hint,rows)=>`<label>${e(label)}<textarea name="${name}" rows="${rows}" maxlength="8000">${e(r[name]??'')}</textarea><span class="field-hint">${e(hint)}</span></label>`;
 return `<div class="training-list">${rows}</div>
<form id="training-form" class="training-form section-gap"><h3>${current?'Kemas kini modul: '+e(current.title):'Tambah modul baharu'}</h3>
<div class="grid-2"><label>Pengecam (URL)<input name="slug" value="${e(r.slug??'')}" maxlength="40" required pattern="[a-z0-9]([a-z0-9]|-){1,39}" ${current?'readonly':''}><span class="field-hint">${current?'Pengecam dikunci selepas modul dicipta.':'Huruf kecil, nombor dan sengkang. Contoh: power-bi'}</span></label>${text('title','Tajuk')}</div>
<div class="grid-2">${text('tag','Kategori','Contoh: Reka bentuk & komunikasi')}${text('description','Penerangan ringkas')}</div>
${area('objectives','Objektif pembelajaran','Satu objektif setiap baris.',4)}
${area('requirements','Keperluan asas','Satu perenggan.',3)}
${area('steps','Langkah pembelajaran','Satu langkah setiap baris, format: Tajuk :: Butiran',6)}
${area('prompt','Contoh arahan','Dipaparkan dalam blok kod.',4)}
${area('practice','Latihan praktikal','Satu perenggan.',3)}
${area('outcome','Hasil yang boleh dicapai','Satu perenggan.',3)}
${area('sources','Rujukan rasmi','Satu rujukan setiap baris, format: Nama :: https://pautan',4)}
<input type="hidden" name="is_new" value="${current?'':'1'}">
<div class="actions"><button class="btn" type="submit">${current?'Simpan perubahan':'Tambah modul'}</button>${current?'<button type="button" class="btn secondary" id="training-cancel">Batal</button>':''}</div>
<p class="form-message" role="status"></p></form>`;
}
function renderTrainingPanel(){const host=document.querySelector('#training-admin');if(host)host.innerHTML=trainingPanel();}
async function reloadTraining(){
 const result=await api('training-list');
 data.training=result.items.map(fromRow);
 rebuildLabels();
}
async function adminPage(token){if(!session?.user){content.innerHTML=head('Log masuk admin','Akses pengurusan untuk pentadbir CAAiT.')+`<section class="panel form-panel"><form id="login-form"><label>Username<input name="username" required maxlength="80" autocomplete="username"></label><label>Kata laluan<input name="password" type="password" required maxlength="128" autocomplete="current-password"></label><button class="btn">Log masuk</button><p class="form-message" role="status"></p></form></section>`;return;}
 content.innerHTML=`<header class="admin-welcome"><div><p class="eyebrow">CAAiT · Ruang pentadbiran</p><h1>Selamat datang, ${e(session.user.username)}.</h1><p>Pantau lawatan, latihan dan suara pengunjung dalam satu paparan.</p></div><div class="admin-actions"><a class="btn secondary" href="#dashboard">Lihat website ↗</a><button class="btn secondary" id="logout">Log keluar</button></div></header>${session.user.must_change?'<p class="note">Pertukaran kata laluan wajib sebelum mengakses statistik dan maklum balas.</p>':`<section class="panel section-gap"><h2>Statistik penggunaan</h2><form class="filter" id="range-form"><label>Tempoh<select id="range"><option value="7">7 hari</option><option value="30" selected>30 hari</option><option value="custom">Julat tarikh</option></select></label><label>Dari<input type="date" name="start" required></label><label>Hingga<input type="date" name="end" required></label><button class="btn">Terapkan</button><p class="form-message" role="status"></p></form><div id="analytics" aria-live="polite">Memuatkan statistik…</div></section><section class="panel"><h2>Modul latihan</h2><p class="muted">Tambah, kemas kini atau buang modul yang dipaparkan dalam ruang latihan.</p><div id="training-admin"></div></section><section class="panel"><h2>Maklum balas diterima</h2><p class="muted">Mengikut julat tarikh dipilih. Maksimum 500 rekod terkini.</p><div id="feedback-list">Memuatkan maklum balas…</div></section>`}${session.user.must_change?passwordForm():''}`;
 if(session.user.must_change){CAAITVisuals.enhance(content);return;}
 trainingEditing=null;renderTrainingPanel();
 setRange(30);await loadStats(token);}
function dateString(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function setRange(days){let end=new Date(),start=new Date();start.setDate(end.getDate()-days+1);const f=document.querySelector('#range-form');f.elements.start.value=dateString(start);f.elements.end.value=dateString(end);}
// Percentage change needs a non-zero base; otherwise the tile simply shows no delta.
const shiftDate=(day,by)=>{const d=new Date(day+'T12:00:00');d.setDate(d.getDate()+by);return dateString(d);};
const pct=(now,before)=>Number(before)>0?(Number(now)-Number(before))/Number(before)*100:null;
async function loadStats(token=renderToken){const f=document.querySelector('#range-form');if(!f)return;const request=++statsRequest;
 const start=f.elements.start.value,end=f.elements.end.value;
 const p='&'+new URLSearchParams({start,end});
 const length=Math.round((new Date(end+'T12:00:00')-new Date(start+'T12:00:00'))/86400000)+1;
 const prevParams='&'+new URLSearchParams({start:shiftDate(start,-length),end:shiftDate(start,-1)});
 // A failed comparison must never hide the current period, so the previous window degrades to null.
 const [s,inbox,previous]=await Promise.all([api('stats',null,p),api('feedback-list',null,p),api('stats',null,prevParams).catch(()=>null)]);
 if(current!=='admin'||token!==renderToken||request!==statsRequest)return;
 const days=[];for(let d=new Date(s.start+'T12:00:00');dateString(d)<=s.end;d.setDate(d.getDate()+1)){const day=dateString(d);days.push({label:day,value:Number(s.daily.find(x=>x.day===day)?.views??0)});}
 const period=`vs ${length} hari sebelum`;
 const average=s.feedback.average==null?null:Number(s.feedback.average);
 const prevAverage=previous?.feedback?.average==null?null:Number(previous.feedback.average);
 const statusRows=[['new','Baharu'],['read','Sudah dibaca'],['resolved','Selesai']].map(([key,label])=>({label,value:s.feedback_status.find(x=>x.status===key)?.total??0}));
 const ratingRows=[5,4,3,2,1].map(r=>({label:r+' bintang',value:s.ratings.find(x=>Number(x.rating)===r)?.total??0}));
document.querySelector('#analytics').innerHTML=`${s.test?'<p class="note">MOD UJIAN LOKAL: data ujian sahaja.</p>':''}<div class="stats">${stat(null,'Jumlah paparan modul',{count:s.views,change:pct(s.views,previous?.views),period,spark:days.length>2?days.map(d=>d.value):null})}${stat(null,'Anggaran pelawat unik',{count:s.unique,change:pct(s.unique,previous?.unique),period})}${stat(null,'Maklum balas',{count:s.feedback.total,change:pct(s.feedback.total,previous?.feedback?.total),period})}${stat(average==null?'—':average.toFixed(2)+'/5','Purata rating',{change:average==null?null:pct(average,prevAverage),period})}</div><div class="admin-chart-grid"><section class="chart-card trend-card"><div class="chart-card-title"><div><span class="chart-kicker">Trafik website</span><h3>Trend lawatan</h3></div><span class="chart-period">${e(s.start)} — ${e(s.end)}</span></div>${Number(s.views)?'':'<p class="source">Belum ada lawatan. Graf menunjukkan sifar sebenar bagi tempoh ini.</p>'}${CAAITVisuals.trend(days)}</section><section class="chart-card"><div class="chart-card-title"><div><span class="chart-kicker">Peti masuk</span><h3>Status maklum balas</h3></div></div>${CAAITVisuals.distribution(statusRows,'maklum balas')}<p class="source">Warna semakin pekat bagi status yang masih memerlukan perhatian.</p></section><section class="chart-card"><div class="chart-card-title"><div><span class="chart-kicker">Pengalaman pengguna</span><h3>Taburan rating</h3></div></div>${bars(ratingRows,{unit:'maklum balas',caption:'Bilangan',ordinal:true,summary:'Lihat jadual rating'})}<p class="source">${Number(s.feedback.total)?'Bilangan maklum balas mengikut rating; warna semakin pekat mengikut rating tinggi.':'Tiada rating diterima setakat ini.'}</p></section><section class="chart-card modules-card"><div class="chart-card-title"><div><span class="chart-kicker">Kandungan pilihan</span><h3>Modul paling banyak dibuka</h3></div><span class="chart-period">${e(num(s.views))} paparan</span></div>${bars(s.modules.map(x=>({label:labels[x.module]??x.module,value:x.views})),{unit:'paparan',caption:'Paparan',emphasis:labels[s.modules[0]?.module]??null,summary:'Lihat jadual modul'})}</section></div><div class="training-metrics">${data.training.map((t,i)=>`<a href="#${t.id}" class="training-metric"><span class="training-number">${String(i+1).padStart(2,'0')}</span><div><h3>${e(t.title)}</h3><span>Lawatan modul latihan</span></div><strong>${e(num(s.modules.find(x=>x.module===t.id)?.views??0))}</strong><span class="metric-arrow" aria-hidden="true">↗</span></a>`).join('')}</div><details class="analytics-definition"><summary>Cara statistik dikira</summary><p class="source">Satu paparan bagi setiap pembukaan atau refresh modul awam. Pengecam rawak pelayar dikira sekali dalam julat dipilih; peranti berlainan boleh dikira berasingan. Aktiviti admin dan data ujian dikecualikan dalam laporan biasa. Perubahan peratus membandingkan julat dipilih dengan ${length} hari sebelum julat itu; ia disembunyikan apabila tempoh sebelum bernilai sifar. Masa: Asia/Kuala_Lumpur. Dikemas kini apabila penapis diterapkan, bukan siaran langsung.</p></details>`;
document.querySelector('#feedback-list').innerHTML=inbox.items.length?inbox.items.map(x=>`<details class="feedback-item"><summary>#${x.id} · ${e(labels[x.module])} · ${x.rating}/5 · ${e({new:'Baharu',read:'Sudah dibaca',resolved:'Selesai'}[x.status])}</summary><p class="source">${e(x.created_at)} · ${e(x.name||'Tanpa nama')} · ${e(x.email||'Tiada e-mel')}</p><p class="feedback-message">${e(x.message)}</p><label>Status<select name="feedback-status-${x.id}" data-feedback-id="${x.id}">${[['new','Baharu'],['read','Sudah dibaca'],['resolved','Selesai']].map(([k,v])=>`<option value="${k}" ${k===x.status?'selected':''}>${v}</option>`).join('')}</select></label><p class="form-message" role="status"></p></details>`).join(''):'<p class="empty">Belum ada maklum balas dalam tempoh ini.</p>';
CAAITVisuals.enhance(content);
}
async function recordView(module){if(session?.user||module==='admin')return;let id;try{id=localStorage.getItem('caait-visitor');if(!id){id=randomId();localStorage.setItem('caait-visitor',id);}}catch{id=randomId();}try{await api('event',{module,event_id:randomId(),visitor_id:id});}catch{/* Analytics must never block public navigation. */}}
function closeMenu(){document.querySelector('#sidebar').inert=innerWidth<=760;document.querySelector('#sidebar').classList.remove('open');document.querySelector('#sidebar-overlay').hidden=true;document.querySelector('#sidebar-toggle').setAttribute('aria-expanded',String(innerWidth>760&&!document.body.classList.contains('collapsed')));}
async function render(){await ready;const id=location.hash.slice(1)||'welcome';current=labels[id]?id:'welcome';const token=++renderToken;closeMenu();document.querySelectorAll('nav a').forEach(a=>{const active=a.hash==='#'+(data.training.some(t=>t.id===current)?'training':current);a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});document.title=`${labels[current]} | CAAiT`;const views={welcome,dashboard,about,organization,roadmap,programs,partners,feedback};if(current==='admin'){content.innerHTML='<p role="status">Memuatkan sesi admin…</p>';try{await ready;session=await api('session');if(token===renderToken)await adminPage(token);}catch(err){if(token===renderToken)content.innerHTML=`<p class="note">${e(err.message)}</p><button class="btn" id="retry">Cuba semula</button>`;}if(token===renderToken)window.scrollTo(0,0);return;}
 content.innerHTML=views[current]?views[current]():training(current);await ready;if(token===renderToken)await recordView(current);if(token===renderToken){window.scrollTo(0,0);CAAITVisuals.enhance(content);}}
document.querySelector('#nav').innerHTML=routes.map(([id,title,icon])=>`<a href="#${id}" title="${e(title)}"><span class="nav-icon" aria-hidden="true">${icon}</span><span class="nav-label">${e(title)}</span></a>`).join('');
document.querySelector('#sidebar-toggle').addEventListener('click',()=>{if(innerWidth<=760){const open=document.querySelector('#sidebar').classList.toggle('open');document.querySelector('#sidebar').inert=!open;document.querySelector('#sidebar-overlay').hidden=!open;document.querySelector('#sidebar-toggle').setAttribute('aria-expanded',String(open));}else{document.body.classList.toggle('collapsed');closeMenu();}});
document.querySelector('#sidebar-overlay').addEventListener('click',closeMenu);
document.addEventListener('keydown',ev=>{if(ev.key==='Escape')closeMenu();});
content.addEventListener('click',async ev=>{if(ev.target.id==='retry')render();
 const edit=ev.target.dataset?.trainEdit;
 if(edit){trainingEditing=edit;renderTrainingPanel();document.querySelector('#training-form')?.scrollIntoView({block:'center'});return;}
 if(ev.target.id==='training-cancel'){trainingEditing=null;renderTrainingPanel();return;}
 const remove=ev.target.dataset?.trainDelete;
 if(remove){
  const button=ev.target;
  // Two taps instead of a modal: a browser dialog would block the page.
  if(button.dataset.confirm!=='1'){
   document.querySelectorAll('[data-train-delete]').forEach(b=>{delete b.dataset.confirm;b.textContent='Buang';});
   button.dataset.confirm='1';button.textContent='Sahkan buang?';return;
  }
  button.disabled=true;
  try{
   await api('training-delete',{slug:remove});
   if(trainingEditing===remove)trainingEditing=null;
   await reloadTraining();renderTrainingPanel();
   showSuccess('Modul latihan berjaya dibuang.');
  }catch(err){
   button.disabled=false;delete button.dataset.confirm;button.textContent='Buang';
   const notice=document.createElement('p');notice.className='inline-error';notice.setAttribute('role','alert');notice.textContent=err.message;
   document.querySelector('#training-admin')?.prepend(notice);
  }
  return;
 }if(ev.target.id==='logout'){try{await api('logout',{});session=await api('session');render();}catch(err){const notice=document.createElement('p');notice.className='inline-error';notice.setAttribute('role','alert');notice.textContent=err.message;content.prepend(notice);}}});
content.addEventListener('change',async ev=>{const target=ev.target;if(target.id==='program-filter')document.querySelectorAll('.program').forEach(p=>p.hidden=target.value!=='all'&&p.dataset.status!==target.value);if(target.id==='range'&&target.value!=='custom')setRange(Number(target.value));if(target.dataset.feedbackId){const msg=target.closest('details').querySelector('.form-message');target.disabled=true;try{await api('status',{id:Number(target.dataset.feedbackId),status:target.value});msg.textContent='Status disimpan.';msg.classList.remove('error');showSuccess('Status maklum balas berjaya disimpan.');const summary=target.closest('details').querySelector('summary');summary.textContent=summary.textContent.replace(/ · (Baharu|Sudah dibaca|Selesai)$/,` · ${target.selectedOptions[0].text}`);await loadStats();}catch(err){msg.textContent=err.message;msg.classList.add('error');}finally{target.disabled=false;}}});
content.addEventListener('submit',async ev=>{ev.preventDefault();const form=ev.target,button=form.querySelector('button'),msg=form.querySelector('.form-message');if(button.disabled)return;button.disabled=true;msg.textContent='Sedang diproses…';msg.classList.remove('error');const values=Object.fromEntries(new FormData(form));try{if(!session)session=await api('session');if(form.id==='login-form'){await api('login',values);session=await api('session');await render();showSuccess('Log masuk berjaya. Selamat datang ke panel admin.');}else if(form.id==='feedback-form'){await api('feedback',{...values,request_id:feedbackRequest});form.reset();feedbackRequest=randomId();msg.textContent='Terima kasih. Maklum balas berjaya disimpan.';showSuccess(msg.textContent);}else if(form.id==='password-form'){if(values.new_password!==values.confirm_password)throw Error('Pengesahan kata laluan tidak sepadan.');await api('password',values);session=await api('session');await render();const notice=document.querySelector('#password-form .form-message');if(notice)notice.textContent='Kata laluan berjaya ditukar.';showSuccess('Kata laluan berjaya ditukar.');}else if(form.id==='training-form'){
   const isNew=values.is_new==='1';
   await api('training-save',{...values,is_new:isNew});
   await reloadTraining();
   trainingEditing=null;renderTrainingPanel();
   showSuccess(isNew?'Modul latihan berjaya ditambah.':'Modul latihan berjaya dikemas kini.');
   return;
  }else if(form.id==='range-form'){await loadStats();msg.textContent='Paparan dikemas kini.';showSuccess('Penapis diterapkan. Statistik berjaya dikemas kini.');}}catch(err){msg.textContent=err.message;msg.classList.add('error');}finally{button.disabled=false;}});
window.addEventListener('resize',closeMenu);
window.addEventListener('hashchange',render);
document.querySelector('.skip').addEventListener('click',ev=>{ev.preventDefault();document.querySelector('#main').focus();});
// Warn up front, not only when a form fails: the whole dashboard looks healthy from disk.
if(fromDisk){
 const notice=document.createElement('p');
 notice.className='note offline-note';
 notice.setAttribute('role','alert');
 notice.textContent='Halaman ini dibuka terus daripada fail. Log masuk admin, maklum balas dan statistik memerlukan pelayan — buka http://localhost/CAAIT%20Project/ selepas Apache dan MySQL dihidupkan dalam XAMPP.';
 document.querySelector('#main').prepend(notice);
}
const ready=api('session').then(async s=>{
 session=s;
 if(s.local){await api('testmode',{enabled:new URLSearchParams(location.search).get('test')==='1'});session=await api('session');}
}).catch(()=>{}).then(async()=>{
 // A failed fetch keeps the seed modules rather than emptying the training space.
 try{const result=await api('training-list');data.training=result.items.map(fromRow);}catch{}
 rebuildLabels();
});
render();
