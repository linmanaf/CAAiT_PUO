import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {randomUUID,randomBytes} from 'node:crypto';
const base=process.env.CAAIT_TEST_URL||'http://localhost/CAAIT%20Project/api/index.php';
if(!new URL(base).hostname.match(/^(localhost|127\.0\.0\.1)$/))throw Error('Local tests only');
const username='qa_'+randomBytes(6).toString('hex');
const password=randomBytes(24).toString('base64url');
const newPassword=randomBytes(24).toString('base64url');
const php='C:/xampp/php/php.exe';
const create=spawnSync(php,['scripts/create-admin.php',username,'Temporary QA','--require-password-change'],{input:password+'\n',encoding:'utf8'});
assert.equal(create.status,0);assert.match(create.stdout,/Admin created/);
const results=[];
const visitor=randomUUID(),request_id=randomUUID();
function client(){let cookie='',csrf='';return async(action,body,expected=200,override)=>{
 const response=await fetch(base+'?action='+action,{method:body?'POST':'GET',headers:{Cookie:cookie,...(body?{'Content-Type':'application/json','X-CSRF-Token':override??csrf}:{})},body:body?JSON.stringify(body):undefined});
 const set=response.headers.getSetCookie();if(set.length)cookie=set[0].split(';')[0];
 const data=await response.json();assert.equal(response.status,expected,action+': '+JSON.stringify(data));
 if(data.csrf)csrf=data.csrf;return data;
};}
const publicClient=client(),a=client(),b=client();
try{
 await publicClient('session');await publicClient('testmode',{});
 await publicClient('stats',null,401);await publicClient('feedback-list',null,401);
 await publicClient('status',{id:1,status:'read'},401);
 results.push('Unauthenticated admin APIs return 401');
 await a('session');await a('testmode',{});
 await a('login',{username,password:'incorrect'},401);
 await a('login',{username,password});await a('stats',null,403);
 await a('password',{current_password:password,new_password:newPassword},403,'invalid-csrf');
 await a('password',{current_password:password,new_password:newPassword});
 results.push('Wrong login rejected; correct login works; first password change enforced; CSRF rejected');
 const before=await a('stats');
 const event=randomUUID();
 await publicClient('event',{event_id:event,visitor_id:visitor,module:'canva'});
 await publicClient('event',{event_id:event,visitor_id:visitor,module:'canva'});
 await publicClient('event',{event_id:randomUUID(),visitor_id:visitor,module:'bob'});
 await publicClient('event',{event_id:randomUUID(),visitor_id:visitor,module:'github'});
 await a('event',{event_id:randomUUID(),visitor_id:visitor,module:'dashboard'});
 const after=await a('stats');assert.equal(Number(after.views)-Number(before.views),3);assert.equal(Number(after.unique)-Number(before.unique),1);
 results.push('Event retry deduplicated; 3 module opens = 3 views and 1 unique; admin view excluded');
 await new Promise(r=>setTimeout(r,2100));
 const payload={request_id,name:'QA <script>alert(1)</script>',email:'',module:'bob',rating:4,message:request_id+' QA <img src=x onerror=alert(1)> SQL \'; DROP TABLE admins; --',website:''};
 await publicClient('feedback',payload,201);await publicClient('feedback',payload);
 let rows=(await a('feedback-list')).items;let item=rows.find(x=>x.message===payload.message);assert.ok(item);assert.equal(rows.filter(x=>x.message===payload.message).length,1);
 await a('status',{id:item.id,status:'read'});await a('status',{id:item.id,status:'resolved'});
 await b('session');await b('testmode',{});await b('login',{username,password:newPassword});
 assert.equal((await b('feedback-list')).items.find(x=>x.id===item.id).status,'resolved');
 assert.equal((await b('stats')).views,(await a('stats')).views);
 results.push('Feedback stored once, exact unsafe text preserved as data, status and stats persist across sessions');
 await b('password',{current_password:newPassword,new_password:password});
 await a('stats',null,401);results.push('Password change invalidates other logged-in sessions');
 await b('logout',{});await b('stats',null,401);results.push('Logout revokes admin access');
 await publicClient('event',{event_id:randomUUID(),visitor_id:visitor,module:'admin'},422);
 await publicClient('feedback',{...payload,request_id:randomUUID(),rating:9},422);
 const normal=client();await normal('session');await normal('login',{username,password});
 const normalStats=await normal('stats');assert.equal(normalStats.test,false);
 assert.ok(!(await normal('feedback-list')).items.some(x=>x.id===item.id));
 results.push('Invalid inputs rejected; test feedback excluded from ordinary reports');
 const limited=client();await limited('session');await limited('testmode',{});
 const limitName=username+'_limit';
 for(let i=0;i<8;i++)await limited('login',{username:limitName,password:'wrong'},401);
 await limited('login',{username:limitName,password:'wrong'},429);
 results.push('Ninth login attempt within the rate window returns 429');
 console.log(JSON.stringify({passed:results.length,results,qaUsername:username},null,2));
} finally {
 // Only the temporary account created by this run; no real admin is touched.
 const cleanup=spawnSync('C:/xampp/mysql/bin/mysql.exe',['-u','root','caait_dashboard','-e',`DELETE FROM admins WHERE username='${username}'; DELETE FROM events WHERE is_test=1 AND visitor_id=SHA2('${visitor}',256); DELETE FROM feedback WHERE is_test=1 AND request_id='${request_id}'`],{encoding:'utf8'});
 assert.equal(cleanup.status,0);
}
