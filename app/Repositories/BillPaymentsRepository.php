<?php

namespace App\Repositories;

use App\Contracts\BillPaymentsInterface;
use App\Models\BillPayment;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class BillPaymentsRepository implements BillPaymentsInterface
{
    /**
     * @var BillPayment
     */
    protected $model;

    /**
     * @param BillPayment $model
     */
    public function __construct(BillPayment $model)
    {
        $this->model = $model;
    }

    /**
     * @param $id
     * @return mixed
     */
    public function getById($id)
    {
        return $this->model->where('id', $id)->first();
    }

    /**
     * @param $id
     * @param $relations
     * @return mixed
     */
    public function getByIdWithRelations($id, $relations)
    {
        return $this->model->where('id', $id)->with($relations)->first();
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
     * @param $skip
     * @param $type
     * @param null $date
     * @return Builder[]|Collection
     */
    public function getPayments($skip, $type, $date = null)
    {
        $now = Carbon::now();

        return $this->model->with('user', 'billService', 'pktService')
            ->when($type == 'upcoming', function ($q) use ($now) {
                $q->whereDate('payment_date', '>=', $now);
            })
            ->when($type == 'previous', function ($q) use ($now) {
                $q->whereDate('payment_date', '<', $now);
            })
            ->when($date, function ($q) use ($date) {
                $q->whereDate('payment_date', '=', $date);
            })
            ->orderBy('payment_date', 'asc')
            ->skip($skip)->take(10)->get();
    }

    /**
     * @param $id
     * @param $data
     * @return mixed
     */
    public function update($id, $data)
    {
        return $this->model->where('id', $id)->update($data);
    }

    /**
     * @param $data
     * @return mixed
     */
    public function delete($data)
    {
        return $this->model->where($data)->delete();
    }

    /**
     * @param $userId
     * @param $skip
     * @return mixed
     */
    public function getUpcomingPaymentsByUserId($userId, $skip)
    {
        return $this->model->where('user_id', $userId)
            ->where('completed', 0)
            ->with(['billServiceWithFavorite' => function ($q) use ($userId) {
                $q->with(['userFavorite' => function ($qb) use ($userId) {
                    return $qb->wherePivot('user_id', $userId);
                }]);
            }])
            ->with('pktService')
            ->skip($skip)->take(6)
            ->get();
    }

    /**
     * @param $userId
     * @param $skip
     * @return mixed
     */
    public function getRecentPaymentsByUserId($userId, $skip)
    {
        return $this->model->where('user_id', $userId)
            ->where('completed', 1)
            ->with(['billServiceWithFavorite' => function ($q) use ($userId) {
                $q->with(['userFavorite' => function ($qb) use ($userId) {
                    return $qb->wherePivot('user_id', $userId);
                }]);
            }])
            ->with('pktService')
            ->skip($skip)->take(6)
            ->get();
    }

    /**
     * @param $id
     * @return mixed
     */
    public function getByDirectDebitId($id)
    {
        return $this->model->where('direct_debit_id', $id)->first();
    }

}
