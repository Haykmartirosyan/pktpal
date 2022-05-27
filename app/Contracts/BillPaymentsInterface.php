<?php

namespace App\Contracts;

interface BillPaymentsInterface
{
    /**
     * @param $id
     * @return mixed
     */
    public function getById($id);

    /**
     * @param $id
     * @param $relations
     * @return mixed
     */
    public function getByIdWithRelations($id, $relations);

    /**
     * @param $data
     * @return mixed
     */
    public function create($data);

    /**
     * @param $skip
     * @param $type
     * @param null $date
     * @return mixed
     */
    public function getPayments($skip, $type, $date = null);

    /**
     * @param $id
     * @param $data
     * @return mixed
     */
    public function update($id, $data);

    /**
     * @param $data
     * @return mixed
     */
    public function delete($data);

    /**
     * @param $userId
     * @param $skip
     * @return mixed
     */
    public function getUpcomingPaymentsByUserId($userId, $skip);

    /**
     * @param $userId
     * @param $skip
     * @return mixed
     */
    public function getRecentPaymentsByUserId($userId, $skip);

    /**
     * @param $id
     * @return mixed
     */
    public function getByDirectDebitId($id);

}
