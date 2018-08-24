<?php

// La cartella $dir deve avere permessi di scrittura (777).

$data = $_POST;

#$dir = "svg/";

$myfile = fopen($data["filename"], "w") or die("Unable to open file!");
fwrite($myfile, $data['image']);
fclose($myfile);

echo  json_encode("ok");

?>