<?php

namespace App\Repositories;

use App\Contracts\BillServicesInterface;
use App\Models\BillService;

class BillServicesRepository implements BillServicesInterface
{
    /**
     * @var
     */
    protected $model;

    /**
     * @param BillService $model
     */
    public function __construct(BillService $model)
    {
        $this->model = $model;
    }

    /**
     * @param $skip
     * @param $userId
     * @param null $searchQuery
     * @return \Illuminate\Database\Eloquent\Builder[]|\Illuminate\Database\Eloquent\Collection|mixed
     */
    public function getBillServices($skip, $userId, $searchQuery = null)
    {
        return $this->model
            ->with(['userFavorite' => function ($q) use ($userId) {
                return $q->wherePivot('user_id', $userId);
            }])
            ->when($searchQuery, function ($q) use ($searchQuery) {
                return $q->where('title', 'like', "%$searchQuery%");
            })
            ->skip($skip)->take(10)->get();
    }
}