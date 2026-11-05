<?php
// Copy OUTSIDE public_html. Set CAAIT_CONFIG to the absolute filename in Apache,
// Default: /home/ACCOUNT/caait-config.php when the app root is public_html.
return [
    'dsn' => 'mysql:host=localhost;dbname=caait_dashboard;charset=utf8mb4',
    'user' => 'caait_user',
    'password' => '',
    'secure_cookie' => true,
    'environment' => 'production',
];
