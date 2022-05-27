<?php


namespace App\Contracts;

interface ErrorsInterface
{
    /**
     * @param $service
     * @param $skip
     */
    public function getByService($service, $skip);

}
