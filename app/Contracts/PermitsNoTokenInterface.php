<?php

namespace App\Contracts;

interface PermitsNoTokenInterface
{
    /**
     * @param $service
     * @param $skip
     * @return mixed
     */
    public function getPermitNoTokenLogs($service, $skip);

}