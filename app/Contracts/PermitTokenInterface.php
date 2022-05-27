<?php


namespace App\Contracts;


use Bavix\LaravelClickHouse\Database\Eloquent\Builder;
use Bavix\LaravelClickHouse\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Tinderbox\Clickhouse\Exceptions\ClientException;

interface PermitTokenInterface
{

    /**
     * @param $service
     * @param $skip
     * @return array|Collection|mixed
     * @throws ClientException
     */
    public function getPermitTokenLogs($service, $skip);

    /**
     * @param $macAddress
     * @return array|Builder|Model|object|null
     */
    public function getByMacAddress($macAddress);
}