<?php


namespace App\Contracts;

use Illuminate\Support\Collection;
use Tinderbox\Clickhouse\Exceptions\ClientException;

interface LogsInterface
{
    /**
     * @param $service
     * @param $subsystem
     * @param $skip
     * @return Collection
     * @throws ClientException
     */
    public function getByService($service, $subsystem, $skip);

}
