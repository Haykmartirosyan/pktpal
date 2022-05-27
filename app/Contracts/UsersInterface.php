<?php


namespace App\Contracts;

interface UsersInterface
{
    /**
     * @param $email
     * @return mixed
     */
    public function getByEmail($email);

    /**
     * @param $id
     * @return mixed
     */
    public function getById($id);

    /**
     * @param $ids
     * @return mixed
     */
    public function getByIds($ids);
}
