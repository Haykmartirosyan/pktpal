<?php

namespace App\Http\Controllers\api\v1;

use App\Contracts\PktServicesInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\api\v1\StatusReportRequest;
use App\Http\Resources\StatusReportResource;
use App\Services\StatusReportsService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use function Sentry\captureException;

/**
 * Class StatusReportsController
 * @package App\Http\Controllers\api\v1
 */
class StatusReportsController extends Controller
{
    /**
     * @var PktServicesInterface
     */
    protected PktServicesInterface $pktServicesRepository;

    /**
     * @var StatusReportsService
     */
    protected StatusReportsService $statusReportsService;

    /**
     * @param PktServicesInterface $pktServicesRepository
     * @param StatusReportsService $statusReportsService
     */
    public function __construct(PktServicesInterface $pktServicesRepository,
                                StatusReportsService $statusReportsService)
    {
        $this->pktServicesRepository = $pktServicesRepository;
        $this->statusReportsService = $statusReportsService;
    }

    /**
     * @param StatusReportRequest $request
     * @return StatusReportResource|JsonResponse
     */
    public function setStatusReport(StatusReportRequest $request)
    {
        try {
            $service = $this->pktServicesRepository->getByToken($request->header('pkteer-token'));

            if ($service) {

                $response = $this->statusReportsService->setStatusReport($request, $service);
                $this->setDevicePairingOption($service, $request->pair_url, $request->header('mac-address'));

                return new StatusReportResource($response['statusReport']);

            }
            return response()->json([
                "error" => 'Service not found',
            ], 404);

        } catch (Exception $exception) {
            DB::rollBack();
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
