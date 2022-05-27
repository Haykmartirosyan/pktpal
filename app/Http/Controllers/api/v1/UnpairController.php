<?php

namespace App\Http\Controllers\api\v1;

use App\Contracts\PktServicesInterface;
use App\Events\DeviceUnpaired;
use App\Http\Controllers\Controller;
use App\Http\Requests\api\v1\PkteerTokenRequest;
use App\Services\LogsService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use function Sentry\captureException;

class UnpairController extends Controller
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
     * StatusReportsController constructor.
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
    public function setStatusUnpair(PkteerTokenRequest $request): JsonResponse
    {
        try {
            $service = $this->pktServicesRepository->getByToken($request->header('pkteer-token'));
            $unpairing = $service->deviceUnpairings()->where('id', $request->id)->first();

            if ($unpairing) {
                DB::beginTransaction();
                $devicePairings = $service->devicePairings()->where('device_unique_key', $unpairing->data)->first();
                $pairToken = $service->pairTokens()->where('token', $unpairing->data)->first();

                if ($devicePairings) {
                    $devicePairings->delete();
                    if ($request->status == 'success') {
                        $text = 'Device unpaired -> ' . (isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '') .
                            ', ' . $devicePairings->user_agent .
                            ', ' . $unpairing->id;

                        $this->logsService->addDeviceLog($service, $text);
                        broadcast(new DeviceUnpaired($request->status));
                    }
                }

                if ($pairToken) {
                    $pairToken->delete();
                }

                $unpairing->delete();
                DB::commit();
                return response()->json([
                    "success" => 'Device Unpaired',
                ]);
            }
            return response()->json([
                "error" => 'Not Found',
            ], 404);


        } catch (Exception $exception) {
            DB::rollBack();
            captureException($exception);
            return response()->json([
                "error" => $exception->getMessage(),
            ], 500);
        }

    }
}
