<?php

namespace App\Http\Controllers\api\v1;

use App\Contracts\PktServicesInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\api\v1\PkteerTokenRequest;
use App\Services\LogsService;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\JsonResponse;
use function Sentry\captureException;

class SwitchEnvController extends Controller
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
    public function setSwitchEnvData(PkteerTokenRequest $request): JsonResponse
    {
        try {
            $service = $this->pktServicesRepository->getByToken($request->header('pkteer-token'));

            if ($service) {
                $switchEnvEvent = $service->events()->where('event', 'switch_env')->where('id', $request->id)->first();

                if ($switchEnvEvent) {
                    if ($request->status == 'success') {
                        $text = 'Switch Device env -> ' . $request->detail . Carbon::now()->toTimeString();
                        $this->logsService->addDeviceLog($service, $text, 'switch_env', $switchEnvEvent->data);
                    }
                    $switchEnvEvent->delete();

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
            captureException($exception);
            return response()->json([
                "success" => false
            ], 500);
        }
    }
}
