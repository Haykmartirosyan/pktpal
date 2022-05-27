<?php

namespace App\Http\Controllers\api\v2;

use App\Contracts\PktServicesInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\api\v2\RegisterDeviceRequest;
use App\Services\RegisterService;
use Exception;
use Illuminate\Http\JsonResponse;
use function Sentry\captureException;

/**
 * Class RegisterController
 * @package App\Http\Controllers\api\v2
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
            if (!$service) {
                $service = $result['service'];
            }
            $this->setDevicePairingOption($service, $request->pair_url, $request->header('mac-address'));

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

    /**
     * @param $service
     * @param $url
     * @param $macAddress
     */
    protected function setDevicePairingOption($service, $url, $macAddress)
    {
        $option = $service->devicePairingOption;

        if ($option) {
            $option->update(['url' => $url]);
        } else {
            $data = [
                'mac_address' => $macAddress,
                'url'         => $url
            ];
            $service->devicePairingOption()->create($data);
        }
    }
}