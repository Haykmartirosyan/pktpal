<?php

namespace App\Http\Controllers\api\v1;

use App\Contracts\PktServicesInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\api\v1\RegisterDeviceRequest;
use App\Services\RegisterService;
use Exception;
use Illuminate\Http\JsonResponse;
use function Sentry\captureException;

/**
 * Class RegisterController
 * @package App\Http\Controllers\api\v1
 */
class RegisterController extends Controller
{
    /**
     * @var PktServicesInterface
     */
    protected PktServicesInterface $pktServicesRepository;

    /**
     * @var RegisterService
     */
    protected RegisterService $registerService;

    /**
     * @param PktServicesInterface $pktServicesRepository
     * @param RegisterService $registerService
     */
    public function __construct(PktServicesInterface $pktServicesRepository, RegisterService $registerService)
    {
        $this->pktServicesRepository = $pktServicesRepository;
        $this->registerService = $registerService;
    }

    /**
     * @param RegisterDeviceRequest $request
     * @return JsonResponse
     */
    public function registerDevice(RegisterDeviceRequest $request): JsonResponse
    {
        try {
            $service = $this->pktServicesRepository->getByMacAddress($request->header('mac-address'));
            $result = $this->registerService->registerDevice($request, $service);

            if ($result['success']) {
                return response()->json([
                    "success" => true,
                ], $result['status']);
            }
            return response()->json([
                "success" => false,
            ], $result['status']);
        } catch (Exception $exception) {
            captureException($exception);
            return response()->json([
                "error" => $exception->getMessage(),
            ], 500);
        }
    }
}
