<?php


namespace App\Contracts;

interface ProvisionsInterface
{

    /**
     * @param $tmpId
     * @return mixed
     */
    public function getByTmpId($tmpId);

}
