<?php

namespace App\Http\Controllers\api\v1;

use App\Contracts\RecommendedPoolsInterface;
use App\Http\Controllers\Controller;

class RecommendedPoolsController extends Controller
{
    /**
     * @var RecommendedPoolsInterface
     */
    protected RecommendedPoolsInterface $recommendedPoolsRepo;

    /**
     * RecommendedPoolsController constructor.
     * @param RecommendedPoolsInterface $recommendedPoolsRepo
     */
    public function __construct(RecommendedPoolsInterface $recommendedPoolsRepo)
    {
        $this->recommendedPoolsRepo = $recommendedPoolsRepo;
    }

    /**
     * @return mixed
     */
    public function getAllPools()
    {
        $allPools = $this->recommendedPoolsRepo->getByParams('all_pools');

        return json_decode($allPools->pools);
    }
}
