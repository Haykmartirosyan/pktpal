<?php

namespace App\Contracts;

interface OfflineDevicesCountInterface
{
    /**
     * @param $data
     * @return mixed
     */
    public function create($data);

    /**
     * @return mixed
     */
    public function getFirstData();

    /**
     * @return mixed
     */
    public function getAll();

}