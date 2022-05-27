<?php

namespace App\Repositories;

use App\Contracts\RecommendedPoolsInterface;
use App\Models\RecommendedPool;

class RecommendedPoolsRepository implements RecommendedPoolsInterface
{
    /**
     * @var RecommendedPool
     */
    protected $model;

    /**
     * @param RecommendedPool $model
     */
    public function __construct(RecommendedPool $model)
    {
        $this->model = $model;
    }

    /**
     * @return mixed
     */
    public function getLevelPools()
    {
        return $this->model->where('level', '!=', 'all_pools')->select('level', 'pools')->get();
    }

    /**
     * @param $level
     * @return mixed
     */
    public function getByParams($level)
    {
        return $this->model->select('level', 'pools')->where('level', $level)->first();
    }

    /**
     * @param $level
     * @param $data
     * @return mixed
     */
    public function updateByParams($level, $data)
    {
        return $this->model->where('level', $level)->update($data);
    }
}