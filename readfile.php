<?php

// Il file results.json deve contenere all'inizio un array vuoto []
// e deve avere permessi di scrittura (777).

$inp = file_get_contents('./results.json');

echo $inp;

?>