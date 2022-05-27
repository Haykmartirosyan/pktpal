<?php


namespace App\Repositories;

use App\Contracts\LogsInterface;
use App\Models\Log;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Tinderbox\Clickhouse\Exceptions\ClientException;

class LogsRepository implements LogsInterface
{
    /**
     * @var Log
     */
    protected $model;

    /**
     * LogsRepository constructor.
     * @param Log $model
     */
    public function __construct(Log $model)
    {
        $this->model = $model;
    }

    /**
     * @param $service
     * @param $subsystem
     * @param $skip
     * @return Collection
     * @throws ClientException
     */
    public function getByService($service, $subsystem, $skip)
    {
        if (app()->environment() == 'production') {
            $logs = $this->model->newQuery()
                ->where('mac', $service->mac_address)
                ->where('subsys', $subsystem)
                ->limit(5, (int)$skip)->orderBy('created', 'desc')->get();
        } else {
            $logs = DB::table('logs')
                ->where('service_id', $service->id)
                ->where('subsystem', $subsystem)
                ->skip($skip)->orderBy('created_at', 'desc')->take(5)->get();
        }
        return $logs;
    }

}
