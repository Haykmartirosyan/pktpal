<?php

namespace App\Repositories;

use App\Contracts\OfflineDevicesCountInterface;
use App\Models\OfflineDevicesCount;

class OfflineDevicesCountRepository implements OfflineDevicesCountInterface
{
    /**
     * @var OfflineDevicesCount
     */
    protected $model;

    /**
     * @param OfflineDevicesCount $model
     */
    public function __construct(OfflineDevicesCount $model)
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
     * @return mixed
     */
    public function getFirstData()
    {
        return $this->model->orderBy('created_at', 'asc')->first();
    }

    /**
     * @return mixed
     */
    public function getAll()
    {
        return $this->model->get();
    }

}