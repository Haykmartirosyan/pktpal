<?php

namespace App\Http\Controllers\admin\dashboard;

use App\Contracts\OfflineDevicesCountInterface;
use App\Contracts\PktServicesInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\OfflineServicesCountRequest;
use App\Http\Resources\OfflineServicesCountCollection;
use App\Jobs\GetOnlineServicesJob;
use App\Services\OnlineDevicesService;
use Exception;
use Illuminate\Http\JsonResponse;
use function Sentry\captureException;

class AnalyticsController extends Controller
{
    /**
     * @var PktServicesInterface
     */
    protected PktServicesInterface $pktServicesRepository;

    /**
     * @var OnlineDevicesService
     */
    protected OnlineDevicesService $onlineDevicesService;

    /**
     * @var OfflineDevicesCountInterface
     */
    protected OfflineDevicesCountInterface $offlineDevicesCountRepository;

    /**
     * @param PktServicesInterface $pktServicesRepository
     * @param OfflineDevicesCountInterface $offlineDevicesCountRepository
     * @param OnlineDevicesService $onlineDevicesService
     */
    public function __construct(PktServicesInterface         $pktServicesRepository,
                                OfflineDevicesCountInterface $offlineDevicesCountRepository,
                                OnlineDevicesService         $onlineDevicesService)
    {
        $this->pktServicesRepository = $pktServicesRepository;
        $this->offlineDevicesCountRepository = $offlineDevicesCountRepository;
        $this->onlineDevicesService = $onlineDevicesService;
    }

    /**
     * @param OfflineServicesCountRequest $request
     * @return JsonResponse
     */
    public function getOfflineServicesCount(OfflineServicesCountRequest $request): JsonResponse
    {
        try {
            $types = $request->types;
            $offlineCounts = [];
            foreach ($types as $type) {
                $count = $this->pktServicesRepository->offlineServicesCounts($type);
                $data = [
                    'type'  => $type,
                    'count' => $count
                ];
                $offlineCounts[] = $data;
            }
            return response()->json([
                'offlineCounts' => $offlineCounts
            ]);
        } catch (Exception $exception) {
            captureException($exception);
            return response()->json([
                'success' => false,
            ], 500);
        }
    }

    /**
     * @return OfflineServicesCountCollection
     */
    public function getOfflineServicesByHours(): OfflineServicesCountCollection
    {
        $data = $this->offlineDevicesCountRepository->getAll();
        return new OfflineServicesCountCollection($data);
    }

    /**
     * @return JsonResponse
     */
    public function getOnlineServicesCount(): JsonResponse
    {
        GetOnlineServicesJob::dispatch($this->onlineDevicesService);

        return response()->json([
            'success' => true
        ]);
    }
}
