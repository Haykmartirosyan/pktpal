<?php


namespace App\Repositories;

use App\Contracts\PktServicesInterface;
use App\Models\PktService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class PktServicesRepository implements PktServicesInterface
{
    /**
     * @var PktService
     */
    protected $model;

    /**
     * PktServicesRepository constructor.
     * @param PktService $model
     */
    public function __construct(PktService $model)
    {
        $this->model = $model;
    }

    /**
     * @param $macAddress
     * @return mixed
     */
    public function getByMacAddress($macAddress)
    {
        return $this->model->where('mac_address', $macAddress)->first();
    }

    /**
     * @param $token
     * @return mixed
     */
    public function getByToken($token)
    {
        return $this->model->where('token', $token)->first();

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
     * @param array $relations
     * @return mixed
     */
    public function getByIdWithRelations($id, $relations = [])
    {
        return $this->model->where('id', $id)->with($relations)->first();
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
     * @param $filters
     * @return array
     */
    public function paginateServices($filters)
    {
        $searchQuery = $filters['q'];
        $offlineType = $filters['offlineType'];
        $skip = $filters['skip'];

        $data = $this->model
            ->with('statusReport:id,service_id,updated_at,encryptions_per_second,wallet_balance', 'alerts')
            ->whereNotNull('pkt_services.user_id')
            ->when($searchQuery, function ($q) use ($searchQuery) {
                $q->join('wp_usermeta', function ($join) {
                    $join->on('wp_usermeta.user_id', 'pkt_services.user_id')
                        ->where(function ($query) {
                            $query->where('wp_usermeta.meta_key', 'first_name');
                        });
                });

                return $q->where('wp_usermeta.meta_value', 'like', "%$searchQuery%")
                    ->orWhere('pkt_services.wallet_address', 'like', "%$searchQuery%")
                    ->orWhere('pkt_services.mac_address', 'like', "%$searchQuery%");
            })
            ->when($offlineType, function ($q) use ($offlineType) {
                $q->when($offlineType == 'more_than_a_week', function ($q) use ($offlineType) {
                    $q->whereHas('statusReport', function ($query) {
                        $query->where('updated_at', '<', Carbon::now()->subDays(7));
                    });
                });
                $q->when($offlineType == 'more_than_two_weeks', function ($q) use ($offlineType) {
                    $q->whereHas('statusReport', function ($query) {
                        $query->where('updated_at', '<', Carbon::now()->subDays(14));
                    });
                });
                $q->when($offlineType == 'a_month', function ($q) use ($offlineType) {
                    $q->whereHas('statusReport', function ($query) {
                        $query->whereDate('updated_at', '=', Carbon::now()->subMonths(1));
                    });
                });
                $q->when($offlineType == 'more_than_a_month', function ($q) use ($offlineType) {
                    $q->whereHas('statusReport', function ($query) {
                        $query->where('updated_at', '<', Carbon::now()->subMonths(1));
                    });
                });
                $q->when($offlineType == 'never_online', function ($q) use ($offlineType) {
                    $q->doesntHave('statusReport');
                });
            });


        $count = $data->count();

        if (isset($filters['orders'])) {
            $this->orderQuery($filters, $data);
        }

        $data = $data->skip($skip)->take(50)->get();

        return ['count' => $count, 'data' => $data];
    }

    /**
     * @param $filters
     * @param $data
     */
    protected function orderQuery($filters, $data)
    {
        foreach ($filters['orders'] as $order) {
            $orderItem = json_decode($order, true);
            $data->orderBy(array_key_first($orderItem), array_shift($orderItem));
        }
    }

    /**
     * @param $skip
     * @param null $searchQuery
     * @return mixed
     */
    public function getUnassignedDevices($skip, $searchQuery = null)
    {
        return $this->model->whereNull('user_id')
            ->when($searchQuery, function ($q) use ($searchQuery) {
                $q->where('pkt_services.mac_address', 'like', "%$searchQuery%")
                    ->orWhere('pkt_services.wallet_address', 'like', "%$searchQuery%");
            })
            ->skip($skip)->take(10)->get();
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
     * @param array $relations
     * @return Builder|Builder[]|Collection
     */
    public function getAllDevices(array $relations = [])
    {
        return $this->model->with($relations);
    }

    /**
     * @return Builder|Builder[]|Collection
     */
    public function getOfflineDevices()
    {
        return $this->model->where('online', 0);
    }

    /**
     * @param $id
     * @return mixed
     */
    public function getByUserId($id)
    {
        return $this->model->where('user_id', $id)->first();
    }

    /**
     * @param $type
     * @return int|mixed
     */
    public function offlineServicesCounts($type)
    {
        return $this->model
            ->with('statusReport:id,service_id,updated_at')
            ->whereNotNull('pkt_services.user_id')
            ->when($type == 'more_than_a_week', function ($q) use ($type) {
                $q->whereHas('statusReport', function ($query) {
                    $query->where('updated_at', '<', Carbon::now()->subDays(7));
                });
            })
            ->when($type == 'more_than_two_weeks', function ($q) use ($type) {
                $q->whereHas('statusReport', function ($query) {
                    $query->where('updated_at', '<', Carbon::now()->subDays(14));
                });
            })
            ->when($type == 'a_month', function ($q) use ($type) {
                $q->whereHas('statusReport', function ($query) {
                    $query->whereDate('updated_at', '=', Carbon::now()->subMonths(1));
                });
            })
            ->when($type == 'more_than_a_month', function ($q) use ($type) {
                $q->whereHas('statusReport', function ($query) {
                    $query->where('updated_at', '<', Carbon::now()->subMonths(1));
                });
            })
            ->when($type == 'never_online', function ($q) use ($type) {
                $q->doesntHave('statusReport');
            })
            ->count();
    }

    /**
     * @return Builder|Builder[]|Collection
     */
    public function getOnlineDevices()
    {
        return $this->model->where('online', 1);
    }

}
