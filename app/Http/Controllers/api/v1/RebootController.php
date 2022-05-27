<?php

namespace App\Http\Controllers\api\v1;

use App\Contracts\PktServicesInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\api\v1\PkteerTokenRequest;
use App\Services\LogsService;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use function Sentry\captureException;

class RebootController extends Controller
{
    /**
     * @var LogsService
     */
    protected LogsService $logsService;

    /**
     * @var PktServicesInterface
     */
    protected PktServicesInterface $pktServicesRepository;

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
     * @return JsonResponse
     */
    public function setRebootData(PkteerTokenRequest $request): JsonResponse
    {
        try {
            $service = $this->pktServicesRepository->getByToken($request->header('pkteer-token'));

            if ($service) {
                $rebootEvent = $service->events()->where('event', 'reboot')->where('id', $request->id)->first();

                if ($rebootEvent) {
                    DB::beginTransaction();
                    $text = 'Reboot Device -> ' . Carbon::now()->toTimeString();
                    $this->logsService->addDeviceLog($service, $text, 'reboot', $rebootEvent->data);

                    $rebootEvent->delete();
                    DB::commit();

                    return response()->json([
                        "success" => true,
                    ]);
                }

                return response()->json([
                    "success" => false
                ], 404);
            }

            return response()->json([
                "success" => false
            ], 404);

        } catch (Exception $exception) {
            DB::rollBack();
            captureException($exception);
            return response()->json([
                "success" => false
            ], 500);
        }
    }
}
