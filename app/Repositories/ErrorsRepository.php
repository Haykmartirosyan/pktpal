<?php

namespace App\Repositories;

use App\Contracts\ErrorsInterface;
use App\Models\Error;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Tinderbox\Clickhouse\Exceptions\ClientException;

class ErrorsRepository implements ErrorsInterface
{
    /**
     * @var Error
     */
    protected $model;

    /**
     * ErrorsRepository constructor.
     * @param Error $model
     */
    public function __construct(Error $model)
    {
        $this->model = $model;
    }

    /**
     * @param $service
     * @param $skip
     * @return Collection
     * @throws ClientException
     */
    public function getByService($service, $skip)
    {
        if (app()->environment() == 'production') {
            return $this->model->newQuery()
                ->where('mac', $service->mac_address)
                ->limit(5, (int)$skip)->orderBy('created', 'desc')->get();
        } else {
            return DB::table('errors')
                ->where('service_id', $service->id)
                ->skip($skip)->orderBy('created_at', 'desc')->take(5)->get();
        }
    }

}
