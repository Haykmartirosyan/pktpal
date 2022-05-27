<?php

namespace App\Repositories;

use App\Contracts\PermitsNoTokenInterface;
use App\Models\PermitsNoToken;
use Illuminate\Support\Facades\DB;

class PermitsNoTokenRepository implements PermitsNoTokenInterface
{
    /**
     * @var PermitsNoToken
     */
    protected $model;

    /**
     * @param PermitsNoToken $model
     */
    public function __construct(PermitsNoToken $model)
    {
        $this->model = $model;
    }

    /**
     * @param $service
     * @param $skip
     * @return array|\Bavix\LaravelClickHouse\Database\Eloquent\Collection|mixed
     * @throws \Tinderbox\Clickhouse\Exceptions\ClientException
     */
    public function getPermitNoTokenLogs($service, $skip)
    {
        if (app()->environment() == 'production') {
            $logs = $this->model->newQuery()
                ->where('mac', $service->mac_address)
                ->limit(5, (int)$skip)->orderBy('created', 'desc')->get();
        } else {
            $logs = [];
        }
        return $logs;
    }

    /**
     * @param $skip
     * @return array|\Bavix\LaravelClickHouse\Database\Eloquent\Collection
     * @throws \Tinderbox\Clickhouse\Exceptions\ClientException
     */
    public function getPermitNoTokenAlertsAll($skip)
    {
        if (app()->environment() == 'production') {
            $servicesMacs = DB::table('pkt_services')
                ->pluck('mac_address')->toArray();

            $permitsNoTokens = $this->model->newQuery()
                ->whereNotIn('mac', $servicesMacs)
                ->limit(10, (int)$skip)->orderBy('created', 'desc')->get();
        } else {
            $permitsNoTokens = [];
        }
        return $permitsNoTokens;
    }

}