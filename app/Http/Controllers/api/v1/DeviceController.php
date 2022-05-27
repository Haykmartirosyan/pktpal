<?php

namespace App\Http\Controllers\api\v1;

use App\Contracts\PktServicesInterface;
use App\Events\ShutDownResultEvent;
use App\Http\Controllers\Controller;
use App\Http\Requests\api\v1\PkteerTokenRequest;
use App\Services\LogsService;
use App\Services\RecommendedPoolsServices;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

/**
 * Class DeviceController
 * @package App\Http\Controllers\api\v1
 */
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
     * @var LogsService
     */
    protected LogsService $logsService;

    /**
     * OptionsController constructor.
     * @param PktServicesInterface $pktServicesRepository
     * @param RecommendedPoolsServices $recommendedPoolsService
     * @param LogsService $logsService
     */
    public function __construct(PktServicesInterface $pktServicesRepository, RecommendedPoolsServices $recommendedPoolsService, LogsService $logsService)
    {
        $this->pktServicesRepository = $pktServicesRepository;
        $this->recommendedPoolsService = $recommendedPoolsService;
        $this->logsService = $logsService;
    }

    /**
     * @param PkteerTokenRequest $request
     * @return JsonResponse
     */
    public function setShutDownData(PkteerTokenRequest $request): JsonResponse
    {
        $service = $this->pktServicesRepository->getByToken($request->header('pkteer-token'));

        if ($service) {

            $shutDownEvent = $service->shutDownEvent()->where('id', $request->id)->first();

            if ($shutDownEvent) {
                if ($request->status == 'success') {
                    $text = 'Shut down device -> ' . Carbon::now()->toTimeString();
                    $this->logsService->addDeviceLog($service, $text, 'shut_down', $shutDownEvent->data);
                }
                broadcast(new ShutDownResultEvent($request->status, $service->id));
                $shutDownEvent->delete();
                return response()->json([
                    "success" => true,
                ]);
            }
            return response()->json([
                "error" => 'Event not found',
            ], 404);
        }
        return response()->json([
            "error" => 'Service not found',
        ], 404);
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
            return response()->json($recommendedPools['pools']);
        }

        return response()->json([], 404);
    }
}
