<?php


namespace App\Contracts;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

interface PktServicesInterface
{

    /**
     * @param $macAddress
     * @return mixed
     */
    public function getByMacAddress($macAddress);

    /**
     * @param $token
     * @return mixed
     */
    public function getByToken($token);

    /**
     * @param $id
     * @return mixed
     */
    public function getById($id);

    /**
     * @param $id
     * @param array $relations
     * @return mixed
     */
    public function getByIdWithRelations($id, $relations = []);

    /**
     * @param $id
     * @param $data
     * @return mixed
     */
    public function update($id, $data);

    /**
     * @param $filters
     * @return mixed
     */
    public function paginateServices($filters);

    /**
     * @param $data
     * @return mixed
     */
    public function create($data);

    /**
     * @param array $relations
     * @return Builder|Builder[]|Collection
     */
    public function getAllDevices(array $relations = []);

    /**
     * @return Builder|Builder[]|Collection
     */
    public function getOfflineDevices();

    /**
     * @param $skip
     * @param null $searchQuery
     * @return mixed
     */
    public function getUnassignedDevices($skip, $searchQuery = null);

    /**
     * @param $id
     * @return mixed
     */
    public function getByUserId($id);

    /**
     * @param $type
     * @return mixed
     */
    public function offlineServicesCounts($type);

    /**
     * @return mixed
     */
    public function getOnlineDevices();

}
