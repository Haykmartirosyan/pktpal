<?php

namespace App\Contracts;

interface RecommendedPoolsRatesInterface
{
    /**
     * @param $data
     * @return mixed
     */
    public function create($data);

    /**
     * @param $date
     * @return mixed
     */
    public function getByDate($date);
}