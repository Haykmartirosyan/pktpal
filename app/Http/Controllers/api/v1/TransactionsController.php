<?php

namespace App\Http\Controllers\api\v1;

use App\Contracts\PktServicesInterface;
use App\Events\TransactionCompleted;
use App\Http\Controllers\Controller;
use App\Http\Requests\api\v1\UpdateTransactionRequest;
use App\Http\Resources\TransactionResource;
use App\Services\LogsService;
use Exception;
use Illuminate\Http\JsonResponse;
use function Sentry\captureException;

/**
 * Class TransactionsController
 * @package App\Http\Controllers\api\v1
 */
class TransactionsController extends Controller
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
     * @param UpdateTransactionRequest $request
     * @return TransactionResource|JsonResponse
     */
    public function updateTransactionStatus(UpdateTransactionRequest $request)
    {
        try {
            $service = $this->pktServicesRepository->getByToken($request->header('pkteer-token'));

            if ($service) {
                $transaction = $service->events()->where('event', 'transaction')->where('id', $request->id)->first();
                if ($transaction) {

                    if ($request->status == 'success') {
                        if ($request->detail) {
                            $text = 'PKT is sent -> ' . $request->detail;
                            $this->logsService->addDeviceLog($service, $text);
                        } else {
                            $text = 'PKT send fail -> The transaction is not made';
                            $this->logsService->addDeviceLog($service, $text);
                        }
                    } else {
                        $text = 'PKT send fail ->  ' . $transaction->sign_req . ', ' . $transaction->msg;
                        $this->logsService->addDeviceLog($service, $text);
                    }

                    broadcast(new TransactionCompleted($transaction, $request->detail, $request->amount, $request->all()));

                    $transaction->delete();

                    return new TransactionResource($transaction);
                }
            }
            return response()->json([
                "error" => 'Not Found',
            ], 404);
        } catch (Exception $exception) {
            captureException($exception);
            return response()->json([
                "error" => $exception->getMessage(),
            ], 500);
        }

    }
}
