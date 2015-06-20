<?php
$url = array_key_exists('url', $_GET) ? $_GET['url'] : "http://www.goforworld.com/_images/images/Islandia_okno.jpg";
if(filter_var($url, FILTER_VALIDATE_URL) === FALSE) {
};
$imginfo = getimagesize($url);
header("Content-type: ".$imginfo['mime']);
readfile($url);
