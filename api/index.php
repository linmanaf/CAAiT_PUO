<?php
require __DIR__.'/bootstrap.php';
$action=$_GET['action']??'session';
$modules=['welcome','dashboard','about','organization','roadmap','programs','partners','training','feedback'];
// Training modules are admin-managed, so the valid module list follows the table rather than
// a hard-coded array. Before the table exists the legacy slugs keep analytics working.
try { foreach (query('SELECT slug FROM training')->fetchAll(PDO::FETCH_COLUMN) as $slug) $modules[]=$slug; }
catch (Throwable) { array_push($modules,'canva','bob','github'); }
$method=$_SERVER['REQUEST_METHOD'];
$input=[];
if ($method==='POST') {
    // Training bodies carry long-form lesson text; everything else stays small.
    $maximum = $action==='training-save' ? 60000 : 12000;
    if ((int)($_SERVER['CONTENT_LENGTH']??0)>$maximum) reply(['error'=>'Permintaan terlalu besar.'],413);
    $input=json_decode(file_get_contents('php://input'),true);
    if (!is_array($input)) reply(['error'=>'Format permintaan tidak sah.'],400);
    foreach ($input as $value) {
        if (!is_string($value) && !is_int($value) && !is_float($value) && !is_bool($value) && $value!==null) reply(['error'=>'Nilai input tidak sah.'],422);
    }
    if (!hash_equals($_SESSION['csrf'],$_SERVER['HTTP_X_CSRF_TOKEN']??'')) reply(['error'=>'Sesi tamat. Muat semula halaman.'],403);
} elseif ($method!=='GET') reply(['error'=>'Kaedah tidak dibenarkan.'],405);
$writes=['login','logout','password','feedback','event','status','testmode','training-save','training-delete'];
if (in_array($action,$writes,true) && $method!=='POST') reply(['error'=>'POST diperlukan.'],405);
if ($action==='session') {
    $user=null;
    if (isset($_SESSION['admin'])) $user=admin(true);
    $_SESSION['form_start'] ??= time();
    reply(['csrf'=>$_SESSION['csrf'],'user'=>$user,'test'=>$_SESSION['test']??false,'local'=>$config['environment']==='local']);
}
if ($action==='login') {
    limit('login-global',80,900);
    limit('login:'.strtolower(substr((string)($input['username']??''),0,80)),8,900);
    $user=query('SELECT * FROM admins WHERE username=?',[substr((string)($input['username']??''),0,80)])->fetch();
    if (!$user || !password_verify((string)($input['password']??''),$user['password_hash'])) reply(['error'=>'Username atau kata laluan tidak betul.'],401);
    session_regenerate_id(true); $_SESSION['admin']=$user['id']; $_SESSION['version']=$user['session_version'];
    $_SESSION['csrf']=bin2hex(random_bytes(32)); reply(['ok'=>true,'csrf'=>$_SESSION['csrf'],'must_change'=>(bool)$user['must_change']]);
}
if ($action==='logout') {
    $test=$_SESSION['test']??false;
    $_SESSION=['test'=>$test,'csrf'=>bin2hex(random_bytes(32)),'form_start'=>time(),'last'=>time()];
    session_regenerate_id(true); reply(['ok'=>true]);
}
if ($action==='password') {
    $user=admin(true); limit('password',8,900);
    $old=query('SELECT password_hash FROM admins WHERE id=?',[$user['id']])->fetchColumn();
    $new=(string)($input['new_password']??'');
    if (!password_verify((string)($input['current_password']??''),$old)) reply(['error'=>'Kata laluan semasa tidak betul.'],400);
    if (strlen($new)<12 || strlen($new)>72 || password_verify($new,$old)) reply(['error'=>'Gunakan kata laluan baharu sekurang-kurangnya 12 aksara, maksimum 72 bait UTF-8, yang berbeza.'],422);
    query('UPDATE admins SET password_hash=?,must_change=0,session_version=session_version+1 WHERE id=?',[password_hash($new,PASSWORD_DEFAULT),$user['id']]);
    $_SESSION['version']=(int)$user['session_version']+1; session_regenerate_id(true); reply(['ok'=>true]);
}
if ($action==='testmode') {
    if ($config['environment']!=='local') reply(['error'=>'Tidak tersedia.'],403);
    $_SESSION['test']=($input['enabled']??true)===true; reply(['ok'=>true]);
}
if ($action==='feedback') {
    $rid=$input['request_id']??'';
    if (!uuid($rid)) reply(['error'=>'ID permintaan tidak sah.'],422);
    if (query('SELECT id FROM feedback WHERE request_id=?',[$rid])->fetch()) reply(['ok'=>true]);
    limit('feedback',5,600);
    $name=trim((string)($input['name']??'')); $email=trim((string)($input['email']??''));
    $message=trim((string)($input['message']??'')); $module=$input['module']??'';
    $rating=filter_var($input['rating']??null,FILTER_VALIDATE_INT);
    if (($input['website']??'')!=='' || time()-($_SESSION['form_start']??time())<2) reply(['error'=>'Sila tunggu sebentar sebelum menghantar.'],422);
    if (strlen($name)>120 || strlen($email)>254 || ($email!==''&&!filter_var($email,FILTER_VALIDATE_EMAIL)) || strlen($message)<5 || strlen($message)>5000 || !in_array($module,$modules,true) || $rating<1 || $rating>5) reply(['error'=>'Semak kategori, rating (1–5), e-mel dan mesej (5–5000 aksara).'],422);
    query('INSERT INTO feedback(request_id,name,email,module,rating,message,is_test) VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE request_id=VALUES(request_id)',[$rid,$name?:null,$email?:null,$module,$rating,$message,(int)($_SESSION['test']??false)]);
    reply(['ok'=>true],201);
}
if ($action==='event') {
    if (isset($_SESSION['admin'])) reply(['ok'=>true,'ignored'=>true]);
    if (!uuid($input['event_id']??null) || !uuid($input['visitor_id']??null) || !in_array($input['module']??'',$modules,true)) reply(['error'=>'Acara tidak sah.'],422);
    limit('events',240,60);
    query('INSERT IGNORE INTO events(event_id,visitor_id,module,is_test) VALUES (?,?,?,?)',[$input['event_id'],hash('sha256',$input['visitor_id']),$input['module'],(int)($_SESSION['test']??false)]);
    reply(['ok'=>true]);
}
// Public: the training catalogue the dashboard renders.
if ($action==='training-list') {
    reply(['items'=>query('SELECT slug,title,tag,description,objectives,requirements,steps,prompt,practice,outcome,sources FROM training ORDER BY position,id')->fetchAll()]);
}
if ($action==='training-save') {
    admin();
    $slug=strtolower(trim((string)($input['slug']??'')));
    $isNew=($input['is_new']??false)===true;
    if (!preg_match('/^[a-z0-9][a-z0-9-]{1,39}$/D',$slug)) reply(['error'=>'Gunakan pengecam 2–40 aksara: huruf kecil, nombor dan sengkang sahaja.'],422);
    // A slug is an analytics key and a bookmarkable address, so it is set once and then frozen.
    if (in_array($slug,['welcome','dashboard','about','organization','roadmap','programs','partners','training','feedback','admin'],true)) reply(['error'=>'Pengecam itu digunakan oleh modul sistem. Pilih yang lain.'],422);
    $fields=['title'=>160,'tag'=>120,'description'=>400];
    $values=[];
    foreach ($fields as $name=>$limit) {
        $values[$name]=trim((string)($input[$name]??''));
        if ($values[$name]==='' || mb_strlen($values[$name])>$limit) reply(['error'=>"Medan $name wajib diisi dan tidak melebihi $limit aksara."],422);
    }
    foreach (['objectives','requirements','steps','prompt','practice','outcome','sources'] as $name) {
        $values[$name]=trim((string)($input[$name]??''));
        if (mb_strlen($values[$name])>8000) reply(['error'=>"Medan $name melebihi 8000 aksara."],422);
    }
    $existing=query('SELECT id FROM training WHERE slug=?',[$slug])->fetch();
    if ($isNew && $existing) reply(['error'=>'Pengecam itu sudah wujud. Pilih yang lain.'],409);
    if (!$isNew && !$existing) reply(['error'=>'Modul itu tidak ditemui.'],404);
    $args=[$values['title'],$values['tag'],$values['description'],$values['objectives'],$values['requirements'],$values['steps'],$values['prompt'],$values['practice'],$values['outcome'],$values['sources']];
    if ($existing) {
        query('UPDATE training SET title=?,tag=?,description=?,objectives=?,requirements=?,steps=?,prompt=?,practice=?,outcome=?,sources=? WHERE slug=?',[...$args,$slug]);
    } else {
        $next=(int)query('SELECT COALESCE(MAX(position),0)+1 FROM training')->fetchColumn();
        query('INSERT INTO training(slug,title,tag,description,objectives,requirements,steps,prompt,practice,outcome,sources,position) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',[$slug,...$args,$next]);
    }
    reply(['ok'=>true,'slug'=>$slug],$existing?200:201);
}
if ($action==='training-delete') {
    admin();
    $slug=(string)($input['slug']??'');
    if (!query('SELECT id FROM training WHERE slug=?',[$slug])->fetch()) reply(['error'=>'Modul itu tidak ditemui.'],404);
    // Analytics rows keep their module slug on purpose: deleting a module must not erase history.
    query('DELETE FROM training WHERE slug=?',[$slug]);
    reply(['ok'=>true]);
}
if (in_array($action,['stats','feedback-list','status'],true)) {
    admin();
    if ($action==='status') {
        if (!in_array($input['status']??'',['new','read','resolved'],true) || !filter_var($input['id']??null,FILTER_VALIDATE_INT)) reply(['error'=>'Status tidak sah.'],422);
        query('UPDATE feedback SET status=? WHERE id=?',[$input['status'],$input['id']]); reply(['ok'=>true]);
    }
    $end=$_GET['end']??date('Y-m-d');
    $start=$_GET['start']??date('Y-m-d',strtotime('-29 days'));
    foreach([$start,$end] as $date) { $d=DateTimeImmutable::createFromFormat('!Y-m-d',$date); if (!$d || $d->format('Y-m-d')!==$date) reply(['error'=>'Tarikh tidak sah.'],422); }
    if ($start>$end || (strtotime($end)-strtotime($start))>366*86400) reply(['error'=>'Pilih julat sehingga 366 hari.'],422);
    $until=date('Y-m-d',strtotime($end.' +1 day'));
    // Test records are visible only in explicitly marked local QA mode.
    $test=($config['environment']==='local'&&!empty($_SESSION['test']))?1:0;
    $args=[$start,$until,$test];
    if ($action==='feedback-list') reply(['items'=>query('SELECT id,name,email,module,rating,message,status,created_at FROM feedback WHERE created_at>=? AND created_at<? AND is_test=? ORDER BY id DESC LIMIT 500',$args)->fetchAll(),'test'=>(bool)$test]);
    reply([
        'views'=>query('SELECT COUNT(*) FROM events WHERE created_at>=? AND created_at<? AND is_test=?',$args)->fetchColumn(),
        'unique'=>query('SELECT COUNT(DISTINCT visitor_id) FROM events WHERE created_at>=? AND created_at<? AND is_test=?',$args)->fetchColumn(),
        'daily'=>query('SELECT DATE(created_at) day,COUNT(*) views FROM events WHERE created_at>=? AND created_at<? AND is_test=? GROUP BY DATE(created_at) ORDER BY day',$args)->fetchAll(),
        'modules'=>query('SELECT module,COUNT(*) views FROM events WHERE created_at>=? AND created_at<? AND is_test=? GROUP BY module ORDER BY views DESC',$args)->fetchAll(),
        'feedback'=>query('SELECT COUNT(*) total,AVG(rating) average FROM feedback WHERE created_at>=? AND created_at<? AND is_test=?',$args)->fetch(),
        'feedback_status'=>query('SELECT status,COUNT(*) total FROM feedback WHERE created_at>=? AND created_at<? AND is_test=? GROUP BY status',$args)->fetchAll(),
        'ratings'=>query('SELECT rating,COUNT(*) total FROM feedback WHERE created_at>=? AND created_at<? AND is_test=? GROUP BY rating ORDER BY rating DESC',$args)->fetchAll(),
        'start'=>$start,'end'=>$end,'test'=>(bool)$test
    ]);
}
reply(['error'=>'Tidak ditemui.'],404);
