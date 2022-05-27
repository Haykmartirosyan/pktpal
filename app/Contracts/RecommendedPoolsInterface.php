<?php

namespace App\Contracts;

interface RecommendedPoolsInterface
{
    /**
     * @return mixed
     */
    public function getLevelPools();

    /**
     * @param $level
     * @return mixed
     */
    public function getByParams($level);

    /**
     * @param $level
     * @param $data
     * @return mixed
     */
    public function updateByParams($level, $data);
}