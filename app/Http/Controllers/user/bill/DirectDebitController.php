<?php

namespace App\Http\Controllers\user\bill;

use App\Contracts\PktServicesInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\AddDirectDebitRequest;
use App\Http\Requests\RemovePaymentRequest;
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
     * @param AddDirectDebitRequest $request
     * @param $id
     * @return JsonResponse
     */
    public function addDirectDebit(AddDirectDebitRequest $request, $id): JsonResponse
    {
        try {
            $service = $this->pktServicesRepository->getById($id);
            if ($service) {
                DB::beginTransaction();
                $data = [
                    "event"        => $request->event,
                    "data"         => $request->msg,
                    'sign_req'     => $request->sig,
                    'msg'          => $request->msg,
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
     * @param RemovePaymentRequest $request
     * @param $id
     * @return JsonResponse
     */
    public function removeDirectDebit(RemovePaymentRequest $request, $id): JsonResponse
    {
        try {
            $service = $this->pktServicesRepository->getById($id);
            if ($service) {
                DB::beginTransaction();
                $data = [
                    'event'        => $request->event,
                    'data'         => $request->directDebitId,
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
