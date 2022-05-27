<?php

namespace App\Repositories;

use App\Contracts\RecommendedPoolsRatesInterface;
use App\Models\RecommendedPoolsRate;

class RecommendedPoolsRatesRepository implements RecommendedPoolsRatesInterface
{
    /**
     * @var
     */
    protected $model;

    /**
     * @param RecommendedPoolsRate $model
     */
    public function __construct(RecommendedPoolsRate $model)
    {
        $this->model = $model;
    }

    /**
     * @param $data
     * @return mixed
     */
    public function create($data)
    {
        return $this->model->create($data);
    }

    /**
     * @param $date
     * @return mixed
     */
    public function getByDate($date)
    {
        return $this->model->whereDate('created_at', '>', $date)->orderByDesc('created_at')->get();
    }
}