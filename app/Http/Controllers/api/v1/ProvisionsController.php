<?php

namespace App\Http\Controllers\api\v1;

use App\Contracts\PktServicesInterface;
use App\Contracts\ProvisionsInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\api\v1\PkteerTokenRequest;
use App\Http\Requests\api\v1\PkteerTpmIdRequest;
use App\Http\Requests\api\v1\ProvisionCreateRequest;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use function Sentry\captureException;

/**
 * Class ProvisionsController
 * @package App\Http\Controllers\api\v1
 */
class ProvisionsController extends Controller
{
    /**
     * @var PktServicesInterface
     */
    protected PktServicesInterface $pktServicesRepository;

    /**
     * @var ProvisionsInterface
     */
    protected ProvisionsInterface $provisionsRepository;

    /**
     * StatusReportsController constructor.
     * @param PktServicesInterface $pktServicesRepository
     * @param ProvisionsInterface $provisionsRepository
     */
    public function __construct(PktServicesInterface $pktServicesRepository, ProvisionsInterface $provisionsRepository)
    {
        $this->pktServicesRepository = $pktServicesRepository;
        $this->provisionsRepository = $provisionsRepository;
    }

    /**
     * @param ProvisionCreateRequest $request
     * @return JsonResponse
     */
    public function createProvision(ProvisionCreateRequest $request): JsonResponse
    {
        try {
            $service = $this->pktServicesRepository->getByToken($request->header('pkteer-token'));
            if ($service) {
                $data = array_merge($request->all(), ['service_id' => $service->id]);

                $provision = $service->provision;

                DB::beginTransaction();
                if (!$provision) {
                    $service->provision()->create($data);
                } else {
                    $provision->update($data);
                }

                DB::commit();

                return response()->json([
                    "success" => true,
                ]);
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
     * @param PkteerTokenRequest $request
     * @return JsonResponse
     */
    public function getSeed(PkteerTokenRequest $request): JsonResponse
    {
        $service = $this->pktServicesRepository->getByToken($request->header('pkteer-token'));
        if ($service) {
            if ($service->provision) {
                return response()->json([
                    "seed" => $service->provision->seed,
                ]);
            }
            return response()->json([
                "error" => 'No Content',
            ], 204);
        }
        return response()->json([
            "error" => 'Service not found',
        ], 404);
    }

    /**
     * @param PkteerTpmIdRequest $request
     * @return JsonResponse
     */
    public function getSecret(PkteerTpmIdRequest $request): JsonResponse
    {
        $provision = $this->provisionsRepository->getByTmpId($request->header('pkteer-tpm-id'));

        if ($provision) {
            return response()->json([
                "secret" => $provision->secret,
            ]);
        }

        return response()->json([
            "error" => 'Provision not found',
        ], 404);
    }

    /**
     * @param PkteerTpmIdRequest $request
     * @return JsonResponse
     */
    public function authorizeProvision(PkteerTpmIdRequest $request): JsonResponse
    {
        $provision = $this->provisionsRepository->getByTmpId($request->header('pkteer-tpm-id'));

        if ($provision) {
            return response()->json([
                "frozen"      => (boolean)$provision->service->freeze,
                "provisioned" => true,
            ]);
        }

        return response()->json([
            "frozen"      => true,
            "provisioned" => false,
        ]);
    }
}
