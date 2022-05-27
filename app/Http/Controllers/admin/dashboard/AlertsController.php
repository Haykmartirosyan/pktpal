<?php

namespace App\Http\Controllers\admin\dashboard;

use App\Contracts\PktServicesInterface;
use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use function Sentry\captureException;

class AlertsController extends Controller
{

    /**
     * @var PktServicesInterface
     */
    protected PktServicesInterface $pktServicesRepository;

    /**
     * OptionsController constructor.
     * @param PktServicesInterface $pktServicesRepository
     */
    public function __construct(PktServicesInterface $pktServicesRepository)
    {
        $this->pktServicesRepository = $pktServicesRepository;
    }

    /**
     * @param Request $request
     * @param $id
     * @return JsonResponse
     */
    public function create(Request $request, $id): JsonResponse
    {
        try {
            $service = $this->pktServicesRepository->getById($id);

            DB::beginTransaction();
            $service->alerts()->create($request->all());
            DB::commit();

            return response()->json([
                "success" => true,
            ]);
        } catch (Exception $exception) {
            DB::rollBack();
            captureException($exception);
            return response()->json([
                "success" => false,
            ]);
        }

    }

    /**
     * @param $id
     * @return JsonResponse
     */
    public function clear($id): JsonResponse
    {
        try {
            $service = $this->pktServicesRepository->getById($id);

            DB::beginTransaction();
            $service->alerts()->delete();
            DB::commit();

            return response()->json([
                "success" => true,
            ]);
        } catch (Exception $exception) {
            DB::rollBack();
            captureException($exception);
            return response()->json([
                "success" => false,
            ]);
        }
    }
}
