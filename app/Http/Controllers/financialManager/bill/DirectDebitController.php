<?php

namespace App\Http\Controllers\financialManager\bill;

use App\Contracts\PktServicesInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\AlterDirectDebitRequest;
use App\Http\Requests\SpendDirectDebitRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use function Sentry\captureException;
use Exception;


class DirectDebitController extends Controller
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
     * @param SpendDirectDebitRequest $request
     * @param $id
     * @return JsonResponse
     */
    public function spendDirectDebit(SpendDirectDebitRequest $request, $id): JsonResponse
    {
        try {
            $service = $this->pktServicesRepository->getById($id);
            if ($service) {
                DB::beginTransaction();
                $data = [
                    'event'        => $request->event,
                    'data'         => json_encode(['id' => $request->directDebitId, 'amount' => $request->amount]),
                    'pkteer_token' => $service->token
                ];
                $service->events()->create($data);
                DB::commit();
                return response()->json([
                    "success" => true
                ]);
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

    /**
     * @param AlterDirectDebitRequest $request
     * @param $id
     * @return JsonResponse
     */
    public function alterDirectDebit(AlterDirectDebitRequest $request, $id): JsonResponse
    {
        try {
            $service = $this->pktServicesRepository->getById($id);
            if ($service) {
                DB::beginTransaction();
                $eventData = json_encode([
                    'id'    => $request->directDebitId,
                    'day'   => $request->amount,
                    'week'  => $request->amount,
                    'month' => $request->amount
                ]);

                $data = [
                    'event'        => $request->event,
                    'data'         => $eventData,
                    'pkteer_token' => $service->token
                ];
                $service->events()->create($data);
                DB::commit();
                return response()->json([
                    "success" => true
                ]);
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
