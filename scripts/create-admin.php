<?php
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__).'/api/bootstrap.php';
$username=$argv[1]??''; $name=$argv[2]??'';
if (!preg_match('/^[a-zA-Z0-9_.-]{3,80}$/D',$username) || $name==='') exit("Usage: php scripts/create-admin.php username \"Display Name\" < password-input\n");
// Read from stdin: never put a password in arguments or a committed file.
$password=rtrim(fgets(STDIN),"\r\n");
if (strlen($password)<12 && $config['environment']!=='local') exit("Use at least 12 characters in production.\n");
if (strlen($password)<8) exit("Use at least 8 characters locally.\n");
if (strlen($password)>72) exit("Use no more than 72 UTF-8 bytes.\n");
if (query('SELECT id FROM admins WHERE username=?',[$username])->fetch()) exit("Account already exists; no changes made.\n");
$mustChange=in_array('--require-password-change',$argv,true)?1:0;
query('INSERT INTO admins(username,display_name,password_hash,must_change) VALUES (?,?,?,?)',[$username,$name,password_hash($password,PASSWORD_DEFAULT),$mustChange]);
echo "Admin created.\n";
