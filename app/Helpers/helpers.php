<?php


if (!function_exists('guidv4')) {
    function guidv4()
    {
        $data = random_bytes(16);
        assert(strlen($data) == 16);

        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);

        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}


if (!function_exists('pktNumber')) {
    function pktNumber($number)
    {
        $number = ($number / 2 ** 30);
        $number = $number < 1 ? ($number < 0.0001 ? $number + 0.0001 : $number + 0.00001) : $number + 0.001;

        return (float)number_format((float)$number, 2, '.', '');
    }
}