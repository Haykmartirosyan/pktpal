<?php


namespace App\Repositories;

use App\Contracts\UsersInterface;
use App\Models\User;

class UsersRepository implements UsersInterface
{
    /**
     * @var User
     */
    protected $model;

    /**
     * UsersRepository constructor.
     * @param User $model
     */
    public function __construct(User $model)
    {
        $this->model = $model;
    }

    /**
     * @param $email
     * @return mixed
     */
    public function getByEmail($email)
    {
        return $this->model->where('user_email', $email)->first();
    }

    /**
     * @param $id
     * @return mixed
     */
    public function getById($id)
    {
        return $this->model->where('ID', $id)->first();

    }

    /**
     * @param $ids
     * @return mixed
     */
    public function getByIds($ids)
    {
        return $this->model->whereIn('ID', $ids)->get();

    }

}
