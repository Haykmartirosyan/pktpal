<?php

namespace App\Http\Controllers\api\v1;

use App\Contracts\PktServicesInterface;
use App\Events\AddDirectDebit;
use App\Events\AlterDirectDebit;
use App\Events\RemoveDirectDebit;
use App\Events\SpendDirectDebit;
use App\Http\Controllers\Controller;
use App\Http\Requests\api\v1\PkteerTokenRequest;
use Illuminate\Http\JsonResponse;
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
     * @param PkteerTokenRequest $request
     * @return JsonResponse
     */
    public function setAddDirectDebitData(PkteerTokenRequest $request): JsonResponse
    {
        try {
            $service = $this->pktServicesRepository->getByToken($request->header('pkteer-token'));

            if ($service) {
                $addDirectDebitEvent = $service->events()->where('event', 'add_direct_debit')->where('id', $request->id)->first();

                if ($addDirectDebitEvent) {

                    broadcast(new AddDirectDebit($request->status, $request->detail));
                    $addDirectDebitEvent->delete();

                    return response()->json([
                        "success" => true,
                    ]);
                }

                return response()->json([
                    "success" => false
                ]);
            }

            return response()->json([
                "success" => false
            ]);

        } catch (Exception $exception) {
            captureException($exception);
            return response()->json([
                "success" => false
            ], 500);
        }
    }

    /**
     * @param PkteerTokenRequest $request
     * @return JsonResponse
     */
    public function setRemoveDirectDebitData(PkteerTokenRequest $request): JsonResponse
    {
        try {
            $service = $this->pktServicesRepository->getByToken($request->header('pkteer_token'));
            if ($service) {
                $removeDirectDebitEvent = $service->events()->where('event', 'remove_direct_debit')->where('id', $request->id)->first();

                if ($removeDirectDebitEvent) {
                    broadcast(new RemoveDirectDebit($request->status));
                    $removeDirectDebitEvent->delete();

                    return response()->json([
                        "success" => true,
                    ]);
                }
                return response()->json([
                    "success" => false
                ]);
            }
            return response()->json([
                "success" => false
            ]);
        } catch (Exception $exception) {
            captureException($exception);
            return response()->json([
                "success" => false
            ], 500);
        }
    }

    /**
     * @param PkteerTokenRequest $request
     * @return JsonResponse
     */
    public function setSpendDirectDebitData(PkteerTokenRequest $request): JsonResponse
    {
        try {
            $service = $this->pktServicesRepository->getByToken($request->header('pkteer_token'));
            if ($service) {
                $spendDirectDebitEvent = $service->events()->where('event', 'spend_direct_debit')->where('id', $request->id)->first();

                if ($spendDirectDebitEvent) {
                    $directDebitId = json_decode($spendDirectDebitEvent->data)->id;
                    broadcast(new SpendDirectDebit($request->status, $request->detail, $directDebitId));
                    $spendDirectDebitEvent->delete();

                    return response()->json([
                        "success" => true,
                    ]);
                }
                return response()->json([
                    "success" => false
                ]);
            }
            return response()->json([
                "success" => false
            ]);

        } catch (Exception $exception) {
            captureException($exception);
            return response()->json([
                "success" => false
            ], 500);
        }
    }

    /**
     * @param PkteerTokenRequest $request
     * @return JsonResponse
     */
    public function setAlterDirectDebitData(PkteerTokenRequest $request): JsonResponse
    {
        try {
            $service = $this->pktServicesRepository->getByToken($request->header('pkteer_token'));
            if ($service) {
                $alterDirectDebitEvent = $service->events()->where('event', 'alter_spending_limits')->where('id', $request->id)->first();

                if ($alterDirectDebitEvent) {
                    $directDebitId = json_decode($alterDirectDebitEvent->data)->id;
                    broadcast(new AlterDirectDebit($request->status, $directDebitId));
                    $alterDirectDebitEvent->delete();

                    return response()->json([
                        "success" => true,
                    ]);
                }
                return response()->json([
                    "success" => false
                ]);
            }
            return response()->json([
                "success" => false
            ]);

        } catch (Exception $exception) {
            captureException($exception);
            return response()->json([
                "success" => false
            ], 500);
        }
    }
}
