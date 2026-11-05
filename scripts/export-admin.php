<?php
// Offline alternative for cPanel plans without Terminal; no database connection.
if (PHP_SAPI!=='cli') { http_response_code(404); exit; }
$username=$argv[1]??'';
$name=$argv[2]??'';
if (!preg_match('/^[a-zA-Z0-9_.-]{3,80}$/D',$username) || $name==='' || strlen($name)>120) {
    fwrite(STDERR,"Usage: php export-admin.php username \"Display name\" < password-input\n"); exit(1);
}
$password=rtrim(fgets(STDIN)?:'',"\r\n");
if (strlen($password)<12 || strlen($password)>72) {
    fwrite(STDERR,"Use 12 to 72 UTF-8 bytes for the production password.\n"); exit(1);
}
$hash=password_hash($password,PASSWORD_DEFAULT);
$hex=fn(string $value): string => "CONVERT(0x".bin2hex($value)." USING utf8mb4)";
echo "-- Private one-time admin import. Import through phpMyAdmin, never into public_html.\n";
echo "-- An existing username is intentionally not overwritten.\n";
echo "INSERT INTO admins(username,display_name,password_hash,must_change) VALUES (".$hex($username).",".$hex($name).",".$hex($hash).",0);\n";
