<?php
// Run once from CLI on XAMPP. Never output the generated database password.
if (PHP_SAPI!=='cli' || PHP_OS_FAMILY!=='Windows') exit("Local Windows CLI only.\n");
$target='C:/xampp/caait-config.php';
if (is_file($target)) exit("Config already exists; left unchanged.\n");
$db=new PDO('mysql:host=127.0.0.1;charset=utf8mb4','root', '',[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$password=bin2hex(random_bytes(32));
try {
    $db->exec("CREATE USER IF NOT EXISTS 'caait_app'@'localhost' IDENTIFIED BY ".$db->quote($password));
    $db->exec("ALTER USER 'caait_app'@'localhost' IDENTIFIED BY ".$db->quote($password));
    $db->exec("GRANT SELECT, INSERT, UPDATE, DELETE ON caait_dashboard.* TO 'caait_app'@'localhost'");
    $user='caait_app';
} catch (PDOException $error) {
    // Explicit local fallback; do not repair shared MariaDB system tables here.
    $user='root'; $password='';
    echo "Local grant failed; retaining existing XAMPP root access. Use a restricted user on hosting.\n";
}
$config=['dsn'=>'mysql:host=localhost;dbname=caait_dashboard;charset=utf8mb4','user'=>$user,'password'=>$password,'secure_cookie'=>false,'environment'=>'local'];
file_put_contents($target,"<?php\nreturn ".var_export($config,true).";\n");
echo "Local config saved outside htdocs.\n";
