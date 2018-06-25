<?php

// Il file results.json deve contenere all'inizio un array vuoto []
// e deve avere permessi di scrittura (777).

$data = $_POST['lancio'];

$inp = file_get_contents('./results.json');
$tempArray = json_decode($inp);
array_push($tempArray, $data);
$jsonData = json_encode($tempArray, JSON_PRETTY_PRINT | JSON_NUMERIC_CHECK);
file_put_contents('./results.json', $jsonData);

echo $jsonData;

?>