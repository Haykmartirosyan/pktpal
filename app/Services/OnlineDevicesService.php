<?php

namespace App\Services;

use App\Contracts\PktServicesInterface;
use App\Contracts\RecommendedPoolsInterface;
use Carbon\Carbon;

class OnlineDevicesService
{
    /**
     * @var PktServicesInterface
     */
    protected PktServicesInterface $pktServicesRepository;

    /**
     * @var RecommendedPoolsInterface
     */
    protected RecommendedPoolsInterface $recommendedPoolsRepository;

    /**
     * @var RecommendedPoolsServices
     */
    protected RecommendedPoolsServices $recommendedPoolsService;

    /**
     * @param PktServicesInterface $pktServicesRepository
     * @param RecommendedPoolsInterface $recommendedPoolsRepository
     * @param RecommendedPoolsServices $recommendedPoolsService
     */
    public function __construct(PktServicesInterface      $pktServicesRepository,
                                RecommendedPoolsInterface $recommendedPoolsRepository,
                                RecommendedPoolsServices  $recommendedPoolsService)
    {
        $this->pktServicesRepository = $pktServicesRepository;
        $this->recommendedPoolsRepository = $recommendedPoolsRepository;
        $this->recommendedPoolsService = $recommendedPoolsService;
    }

    /**
     * @return array
     */
    public function getOnlinesForADay(): array
    {
        $services = $this->pktServicesRepository->getOnlineDevices();
        $levels = $this->recommendedPoolsRepository->getLevelPools()->pluck('level');
        $levelData = [];
        foreach ($levels as $level) {
            $levelData[] = [
                'level' => $level,
                'count' => 0
            ];
        }

        $services->chunkById(20, function ($services) use (&$levelData) {
            foreach ($services as $service) {
                $lastOnlineLog = $service->lastOnlineLog()->first();
                if ($lastOnlineLog) {
                    $result = Carbon::now()->diffInHours($lastOnlineLog->created_at);
                    if ($result >= 24) {
                        $serviceLevel = $this->recommendedPoolsService->setRecommendedPools($service)['level'];
                        $key = array_search($serviceLevel, array_column($levelData, 'level'));
                        $levelData[$key]['count']++;
                    }
                }
            }
        });

        return $levelData;
    }

}