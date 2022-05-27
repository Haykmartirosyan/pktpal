<?php

namespace App\Http\Controllers\api\v2;

use App\Contracts\PktServicesInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\api\v1\PkteerTokenRequest;
use App\Services\RecommendedPoolsServices;
use Illuminate\Http\JsonResponse;

class DeviceController extends Controller
{
    /**
     * @var PktServicesInterface
     */
    protected PktServicesInterface $pktServicesRepository;

    /**
     * @var RecommendedPoolsServices
     */
    protected RecommendedPoolsServices $recommendedPoolsService;

    /**
     * OptionsController constructor.
     * @param PktServicesInterface $pktServicesRepository
     * @param RecommendedPoolsServices $recommendedPoolsService
     */
    public function __construct(PktServicesInterface $pktServicesRepository, RecommendedPoolsServices $recommendedPoolsService)
    {
        $this->pktServicesRepository = $pktServicesRepository;
        $this->recommendedPoolsService = $recommendedPoolsService;
    }

    /**
     * @param PkteerTokenRequest $request
     * @return JsonResponse
     */
    public function recommendedPools(PkteerTokenRequest $request): JsonResponse
    {
        $service = $this->pktServicesRepository->getByToken($request->header('pkteer-token'));

        if ($service) {
            $recommendedPools = $this->recommendedPoolsService->setRecommendedPools($service);
            return response()->json($recommendedPools);
        }

        return response()->json([], 404);
    }
}
