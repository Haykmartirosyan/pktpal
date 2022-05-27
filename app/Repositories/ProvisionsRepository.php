<?php


namespace App\Repositories;

use App\Contracts\ProvisionsInterface;
use App\Models\Provision;

class ProvisionsRepository implements ProvisionsInterface
{
    /**
     * @var Provision
     */
    protected $model;

    /**
     * ProvisionsRepository constructor.
     * @param Provision $model
     */
    public function __construct(Provision $model)
    {
        $this->model = $model;
    }

    /**
     * @param $tmpId
     * @return mixed
     */
    public function getByTmpId($tmpId)
    {
        return $this->model->where('tpm_id', $tmpId)->first();
    }

}
