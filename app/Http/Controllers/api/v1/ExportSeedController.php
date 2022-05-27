<?php

namespace App\Http\Controllers\api\v1;

use App\Contracts\PktServicesInterface;
use App\Events\SeedExported;
use App\Http\Controllers\Controller;
use App\Http\Requests\api\v1\PkteerTokenRequest;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use function Sentry\captureException;

/**
 * Class ExportSeedController
 * @package App\Http\Controllers\api\v1
 */
class ExportSeedController extends Controller
{
    /**
     * @var PktServicesInterface
     */
    protected PktServicesInterface $pktServicesRepository;

    /**
     * @param PktServicesInterface $pktServicesRepository
     */
    public function __construct(PktServicesInterface $pktServicesRepository)
    {
        $this->pktServicesRepository = $pktServicesRepository;
    }

    /**
     * @param PkteerTokenRequest $request
     * @return JsonResponse
     */
    public function setSeedData(PkteerTokenRequest $request): JsonResponse
    {
        try {
            $service = $this->pktServicesRepository->getByToken($request->header('pkteer-token'));

            if ($service) {
                $seedExportPassphrase = $service->events()->where('event', 'export_seed')->where('id', $request->id)->first();

                if ($seedExportPassphrase) {
                    $url = $request->detail;
                    broadcast(new SeedExported($request->id, str_replace('"', '', $url)));
                    DB::beginTransaction();
                    $seedExportPassphrase->delete();
                    DB::commit();

                    return response()->json([
                        "success" => true,
                    ]);
                }
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
