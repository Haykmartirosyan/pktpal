<?php

namespace App\Http\Controllers\api\v1;

use App\Contracts\PktServicesInterface;
use App\Events\RackModeResultEvent;
use App\Http\Controllers\Controller;
use App\Http\Requests\api\v1\PkteerTokenRequest;
use App\Http\Resources\PktResource;
use App\Services\LogsService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Exception;
use function Sentry\captureException;

class RackModeController extends Controller
{
    /**
     * @var PktServicesInterface
     */
    protected PktServicesInterface $pktServicesRepository;

    /**
     * @var LogsService
     */
    protected LogsService $logsService;

    /**
     * @param PktServicesInterface $pktServicesRepository
     * @param LogsService $logsService
     */
    public function __construct(PktServicesInterface $pktServicesRepository, LogsService $logsService)
    {
        $this->pktServicesRepository = $pktServicesRepository;
        $this->logsService = $logsService;
    }

    /**
     * @param PkteerTokenRequest $request
     * @return PktResource|JsonResponse|void
     */
    public function setStatusRackMode(PkteerTokenRequest $request)
    {
        try {
            $service = $this->pktServicesRepository->getByToken($request->header('pkteer-token'));

            if ($service) {
                DB::beginTransaction();
                $rackModeEvent = $service->events()->where('id', $request->id)->first();
                if ($rackModeEvent) {
                    if ($service->type == 'node') {
                        $service->type = 'rack';
                        $service->save();
                        $text = 'Device changed to Rack mode -> ' . Carbon::now()->toTimeString();
                        $this->logsService->addDeviceLog($service, $text, 'reboot', $rackModeEvent->data);
                    }
                    broadcast(new RackModeResultEvent($request->status, $service->type));
                    $rackModeEvent->delete();
                } else {
                    return response()->json([
                        "error" => 'Not Found',
                    ], 404);
                }
                DB::commit();
                return new PktResource($service);
            }
            return response()->json([
                "error" => 'Not Found',
            ], 404);
        } catch (Exception $exception) {
            DB::rollBack();
            captureException($exception);
        }

    }
}
