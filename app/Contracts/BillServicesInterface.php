<?php

namespace App\Contracts;

interface BillServicesInterface
{
    /**
     * @param $skip
     * @param $userId
     * @param null $searchQuery
     * @return mixed
     */
    public function getBillServices($skip, $userId, $searchQuery = null);

}