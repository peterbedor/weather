<?php

echo file_get_contents($_POST['url'] . '/' . $_POST['apiKey'] . '/' . $_POST['lat'] . ',' . $_POST['lng']);

die;