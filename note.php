<?php
$text = $_POST['data'];

$open = fopen('note.txt', 'w');
fwrite($open, $text);
fclose($open);

echo '1';
?>