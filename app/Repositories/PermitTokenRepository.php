<?php


namespace App\Repositories;


use App\Contracts\PermitTokenInterface;
use App\Models\PermitToken;
use Bavix\LaravelClickHouse\Database\Eloquent\Builder;
use Bavix\LaravelClickHouse\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Tinderbox\Clickhouse\Exceptions\ClientException;

class PermitTokenRepository implements PermitTokenInterface
{
    /**
     * @var PermitToken
     */
    protected $model;

    /**
     * PermitTokenRepository constructor.
     * @param PermitToken $model
     */
    public function __construct(PermitToken $model)
    {
        $this->model = $model;
    }

    /**
     * @param $service
     * @param $skip
     * @return array|Collection|mixed
     * @throws ClientException
     */
    public function getPermitTokenLogs($service, $skip)
    {
        return app()->environment() == 'production' ? $this->model->newQuery()
            ->where('mac', $service->mac_address)
            ->limit(5, (int)$skip)->orderBy('created', 'desc')->get() : [];
    }

    /**
     * @param $macAddress
     * @return array|Builder|Model|object|null
     */
    public function getByMacAddress($macAddress)
    {
        return app()->environment() == 'production' ? $this->model->newQuery()
            ->where('mac', $macAddress)->orderBy('created', 'desc')->first() : [];
    }

}