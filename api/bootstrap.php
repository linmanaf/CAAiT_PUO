<?php
declare(strict_types=1);
date_default_timezone_set('Asia/Kuala_Lumpur');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function reply(array $data, int $status = 200): never {
    http_response_code($status); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit;
}
set_exception_handler(function(Throwable $error) {
    error_log('CAAiT: ' . $error->getMessage());
    // A signed-in admin sees the real cause, so a database problem is diagnosable without
    // server log access. Everyone else keeps the generic line.
    $detail = (PHP_SAPI !== 'cli' && isset($_SESSION) && isset($_SESSION['admin']))
        ? ['detail' => $error->getMessage()] : [];
    reply(['error'=>'Perkhidmatan belum tersedia. Cuba semula atau hubungi pentadbir.'] + $detail, 503);
});
$defaultConfig = PHP_OS_FAMILY === 'Windows' ? 'C:/xampp/caait-config.php' : dirname(__DIR__, 2) . '/caait-config.php';
$configPath = getenv('CAAIT_CONFIG') ?: $defaultConfig;
// Fail closed on hosting: never silently use a local/root database fallback.
if (!is_file($configPath)) reply(['error'=>'Konfigurasi pelayan diperlukan.'],503);
$config = require $configPath;
if (!is_array($config) || !isset($config['dsn'],$config['user'],$config['password'],$config['secure_cookie'],$config['environment'])) reply(['error'=>'Konfigurasi pelayan tidak lengkap.'],503);
if ($config['environment']==='production' && $config['secure_cookie']!==true) reply(['error'=>'Production memerlukan secure_cookie=true dan HTTPS.'],503);
$db = new PDO($config['dsn'],$config['user'],$config['password'],[
    PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES=>false
]);
$db->exec("SET time_zone = '+08:00'");
if (PHP_SAPI !== 'cli') {
    ini_set('session.use_strict_mode','1'); ini_set('session.use_only_cookies','1');
    // Keep the garbage collector from dropping a session before the idle rule below does.
    // A shorter default (PHP ships 1440s) silently issues a new CSRF token mid-visit, which
    // rejects the next login or form post for no reason the user can see.
    if ((int)ini_get('session.gc_maxlifetime') < 1800) ini_set('session.gc_maxlifetime','1800');
    session_name('caait_session');
    session_set_cookie_params(['httponly'=>true,'secure'=>$config['secure_cookie'],'samesite'=>'Lax','path'=>'/']);
    session_start();
    if (isset($_SESSION['last']) && time()-$_SESSION['last']>1800) { $_SESSION=[]; session_regenerate_id(true); }
    $_SESSION['last']=time();
    $_SESSION['csrf'] ??= bin2hex(random_bytes(32));
}
function query(string $sql, array $args=[]): PDOStatement {
    global $db; $statement=$db->prepare($sql); $statement->execute($args); return $statement;
}
function admin(bool $allowChange=false): array {
    $row=query('SELECT id,username,display_name,must_change,session_version FROM admins WHERE id=?',[$_SESSION['admin']??0])->fetch();
    if (!$row || $row['session_version']!==($_SESSION['version']??null)) {
        unset($_SESSION['admin'],$_SESSION['version']);
        reply(['error'=>'Sila log masuk.'],401);
    }
    if (!$allowChange && $row['must_change']) reply(['error'=>'Tukar kata laluan sebelum meneruskan.','must_change'=>true],403);
    return $row;
}
function limit(string $kind,int $maximum,int $seconds): void {
    // Expired buckets are dead weight; sweep them occasionally so the table stays small.
    if (random_int(1,50)===1) query('DELETE FROM rate_limits WHERE expires_at < DATE_SUB(NOW(),INTERVAL 1 DAY)');
    if (!empty($_SESSION['test'])) $kind.=':test';
    $key=hash('sha256',$kind.'|'.($_SERVER['REMOTE_ADDR']??'cli'));
    query('INSERT INTO rate_limits(bucket,hits,expires_at) VALUES (?,1,DATE_ADD(NOW(),INTERVAL ? SECOND)) ON DUPLICATE KEY UPDATE hits=IF(expires_at<NOW(),1,hits+1),expires_at=IF(expires_at<NOW(),VALUES(expires_at),expires_at)',[$key,$seconds]);
    if ((int)query('SELECT hits FROM rate_limits WHERE bucket=?',[$key])->fetchColumn()>$maximum) { header('Retry-After: '.$seconds); reply(['error'=>'Terlalu banyak cubaan. Sila tunggu sebelum mencuba lagi.'],429); }
}
function uuid(mixed $value): bool { return is_string($value) && preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/D',$value)===1; }
