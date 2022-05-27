<?php

namespace App\Http\Controllers\financialManager\bill;

use App\Contracts\BillPaymentsInterface;
use App\Http\Controllers\Controller;
use App\Http\Resources\BillPaymentsCollection;
use App\Services\LogsService;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use function Sentry\captureException;

class PaymentsController extends Controller
{
    /**
     * @var BillPaymentsInterface
     */
    protected BillPaymentsInterface $billPaymentsRepository;
    /**
     * @var LogsService
     */
    protected LogsService $logsService;

    /**
     * @param BillPaymentsInterface $billPaymentsRepository
     * @param LogsService $logsService
     */
    public function __construct(BillPaymentsInterface $billPaymentsRepository, LogsService $logsService)
    {
        $this->billPaymentsRepository = $billPaymentsRepository;
        $this->logsService = $logsService;
    }

    /**
     * @param Request $request
     * @return BillPaymentsCollection
     */
    public function index(Request $request): BillPaymentsCollection
    {
        $payments = $this->billPaymentsRepository->getPayments($request->skip, $request->type, $request->date);

        return new BillPaymentsCollection($payments);
    }

    /**
     * @param $id
     * @return JsonResponse
     */
    public function getPaymentDetails($id): JsonResponse
    {
        $payment = $this->billPaymentsRepository->getByIdWithRelations($id, ['user', 'billService', 'pktService']);
        if ($payment) {
            return response()->json([
                "data" => $payment,
            ]);
        }
        return response()->json([
            "success" => false,
        ], 404);
    }

    /**
     * @param $id
     * @param Request $request
     * @return JsonResponse
     */
    public function updatePaymentStatus($id, Request $request): JsonResponse
    {
        try {
            $payment = $this->billPaymentsRepository->getById($id);
            if ($payment) {
                DB::beginTransaction();
                $service = $payment->pktService;
                if ($request->enough_funds) {
                    $this->billPaymentsRepository->update($payment->id, ['completed' => $request->completed]);
                    $billService = $payment->billService;
                    if ($request->completed) {
                        $transactionData = [
                            'bill_payment_id' => $payment->id,
                            'user_id'         => $payment->user_id,
                            'bill_service_id' => $billService ? $billService->id : null,
                            'service_name'    => $payment->service_name,
                            'amount'          => $payment->amount,
                        ];
                        $service->billTransactionsHistories()->create($transactionData);

                        $notificationData = [
                            'user_id'         => $payment->user_id,
                            'bill_service_id' => $billService ? $billService->id : null,
                            'amount'          => $payment->amount,
                            'service_name'    => $payment->service_name,
                            'type'            => 'payment_succeeded',
                            'payment_date'    => Carbon::now()->toDateString()
                        ];
                        $service->billTransactionsNotifications()->create($notificationData);


                        if ($payment->recurring) {
                            $this->generateUpcomingPayment($service, $billService, $payment, $payment->service_name);
                        }
                        $text = 'The payment has been made for ' . $billService->title;
                        $this->logsService->addDeviceLog($service, $text, 'bill_payment', auth()->id(), $payment->id);

                    } else {
                        $nextPaymentDate = Carbon::parse($payment->payment_date)->addMonth();
                        $data = [
                            'payment_date'    => $nextPaymentDate->toDateString(),
                            'bill_service_id' => $billService ? $billService->id : null,
                            'user_id'         => $payment->user_id
                        ];
                        $this->billPaymentsRepository->delete($data);
                        $serviceName = $payment->service_name;
                        $service->billTransactionsNotifications()
                            ->where('payment_date', $nextPaymentDate->toDateString())
                            ->where('user_id', $payment->user_id)
                            ->when($billService, function ($q) use ($billService) {
                                $q->where('bill_service_id', $billService->id);
                            })
                            ->when(!$billService, function ($q) use ($serviceName) {
                                $q->where('service_name', $serviceName);
                            })->delete();
                    }
                } else {
                    $text = 'There is no enough funds on this account';
                    $this->logsService->addDeviceLog($service, $text, null, null, $payment->id);

                    $billService = $payment->billService;
                    $notificationData = [
                        'user_id'         => $payment->user_id,
                        'bill_service_id' => $billService ? $billService->id : null,
                        'amount'          => $payment->amount,
                        'service_name'    => $payment->service_name,
                        'type'            => 'payment_failed',
                        'payment_date'    => Carbon::now()->toDateString()
                    ];
                    $service->billTransactionsNotifications()->create($notificationData);
                }

                DB::commit();
                return response()->json([
                    "success" => true,
                ]);
            }
            return response()->json([
                "success" => false,
            ], 404);

        } catch (Exception $exception) {
            DB::rollBack();
            captureException($exception);
            return response()->json([
                "success" => false,
            ], 500);
        }
    }

    /**
     * @param Request $request
     * @return JsonResponse
     */
    protected function addFailedLog(Request $request): JsonResponse
    {
        $text = $request->reason;

        $payment = $this->billPaymentsRepository->getById($request->payment_id);
        if ($payment) {
            $this->logsService->addDeviceLog($payment->pktService, $text, null, null, $request->payment_id);
        }
        return response()->json([
            "success" => true,
        ]);
    }


    /**
     * @param $service
     * @param $billService
     * @param $payment
     * @param null $serviceName
     */
    protected function generateUpcomingPayment($service, $billService, $payment, $serviceName = null)
    {

        $nextPaymentDate = Carbon::parse($payment->payment_date)->addMonth();
        $nextPayment = $service->billTransactionsNotifications()
            ->where('payment_date', $nextPaymentDate->toDateString())
            ->where('user_id', $payment->user_id)
            ->when($billService, function ($q) use ($billService) {
                $q->where('bill_service_id', $billService->id);
            })
            ->when(!$billService, function ($q) use ($serviceName) {
                $q->where('service_name', $serviceName);
            })->first();

        if (!$nextPayment) {
            $newPayment = $payment->replicate();
            $newPayment->payment_date = $nextPaymentDate->toDateString();
            $newPayment->save();
            $notificationData = [
                'user_id'         => $payment->user_id,
                'bill_service_id' => $billService ? $billService->id : null,
                'amount'          => $payment->amount,
                'payment_date'    => $nextPaymentDate->toDateString(),
                'service_name'    => $serviceName,
            ];
            $service->billTransactionsNotifications()->create($notificationData);
        }

    }

    /**
     * @param Request $request
     * @return JsonResponse
     */
    protected function getPaymentLogs(Request $request): JsonResponse
    {
        $payment = $this->billPaymentsRepository->getById($request->billPaymentId);
        $service = $payment->pktService;
        $logs = $service->systemLogs()->where('bill_payment_id', $payment->id)
            ->orderBy('created_at', 'desc')
            ->with('user')->skip($request->skip)
            ->take(5)->get();

        return response()->json([
            'logs' => $logs
        ]);
    }
}
