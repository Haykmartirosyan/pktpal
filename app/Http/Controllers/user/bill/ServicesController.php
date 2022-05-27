<?php

namespace App\Http\Controllers\user\bill;

use App\Contracts\BillPaymentsInterface;
use App\Contracts\BillServicesInterface;
use App\Contracts\PktServicesInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\CreatePaymentRequest;
use App\Http\Requests\UpdatePaymentRequest;
use App\Http\Resources\BillPaymentResource;
use App\Http\Resources\BillServiceCollection;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use function Sentry\captureException;

class ServicesController extends Controller
{
    /**
     * @var BillServicesInterface
     */
    protected BillServicesInterface $billServicesRepository;

    /**
     * @var BillPaymentsInterface
     */
    protected BillPaymentsInterface $billPaymentsRepository;

    /**
     * @var PktServicesInterface
     */
    protected PktServicesInterface $pktServicesRepository;

    /**
     * @param BillServicesInterface $billServicesRepository
     * @param BillPaymentsInterface $billPaymentsRepository
     * @param PktServicesInterface $pktServicesRepository
     */
    public function __construct(BillServicesInterface $billServicesRepository,
                                BillPaymentsInterface $billPaymentsRepository,
                                PktServicesInterface  $pktServicesRepository)
    {
        $this->billServicesRepository = $billServicesRepository;
        $this->billPaymentsRepository = $billPaymentsRepository;
        $this->pktServicesRepository = $pktServicesRepository;
    }

    /**
     * @param Request $request
     * @return BillServiceCollection
     */
    public function index(Request $request): BillServiceCollection
    {
        $user = auth()->user();
        $services = $this->billServicesRepository->getBillServices($request->skip, $user->ID, $request->searchQuery);
        return new BillServiceCollection($services);
    }

    /**
     * @param CreatePaymentRequest $request
     * @return BillPaymentResource|JsonResponse
     */
    public function createBillPayment(CreatePaymentRequest $request)
    {
        try {
            DB::beginTransaction();

            $paymentData = [
                'bill_service_id' => isset($request->bill_service_id) ? $request->bill_service_id : null,
                'service_id'      => $request->service_id,
                'user_id'         => $request->user_id,
                'address'         => $request->address,
                'phone'           => $request->phone,
                'amount'          => $request->amount,
                'recurring'       => $request->recurring,
                'holder_name'     => $request->holder_name,
                'account_number'  => $request->account_number,
                'apartment'       => $request->apartment,
                'city'            => $request->city,
                'country'         => $request->country,
                'state'           => $request->state,
                'zip_code'        => $request->zip_code,
                'service_name'    => isset($request->service_name) ? $request->service_name : null,
                'description'     => isset($request->description) ? $request->description : null,
                'payment_date'    => Carbon::parse($request->payment_date)->toDateString(),
                'direct_debit_id' => $request->direct_debit_id
            ];
            $billPayment = $this->billPaymentsRepository->create($paymentData);

            DB::commit();
            return new BillPaymentResource($billPayment);

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
     * @param Request $request
     * @return JsonResponse
     */
    public function getTransactionsHistory($id, Request $request): JsonResponse
    {
        $service = $this->pktServicesRepository->getById($id);

        if ($service) {
            $user = auth()->user();
            $transactions = $service->billTransactionsHistories()
                ->where('user_id', $user->ID)
                ->with('billService')
                ->orderBy('created_at', 'desc')
                ->skip($request->skip)->take(5)->get();
            return response()->json([
                "transactions" => $transactions,
            ]);
        }

        return response()->json([
            "transactions" => [],
        ], 404);

    }

    /**
     * @param $id
     * @param Request $request
     * @return JsonResponse
     */
    public function getTransactionsNotifications($id, Request $request): JsonResponse
    {
        $service = $this->pktServicesRepository->getById($id);

        if ($service) {
            $user = auth()->user();
            $notifications = $service->billTransactionsNotifications()
                ->where('user_id', $user->ID)
                ->with('billService')
                ->orderBy('created_at', 'desc')
                ->skip($request->skip)->take(5)->get();

            return response()->json([
                "notifications" => $notifications,
            ]);
        }

        return response()->json([
            "notifications" => [],
        ], 404);

    }

    /**
     * @param Request $request
     * @return JsonResponse
     */
    public function getUpcomingPayments(Request $request): JsonResponse
    {
        $upcoming = $this->billPaymentsRepository->getUpcomingPaymentsByUserId(auth()->id(), $request->skipUpcoming);
        return response()->json([
            "upcoming" => $upcoming,
        ]);
    }

    /**
     * @param Request $request
     * @return JsonResponse
     */
    public function getRecentPayments(Request $request): JsonResponse
    {
        $recent = $this->billPaymentsRepository->getRecentPaymentsByUserId(auth()->id(), $request->skipRecent);
        return response()->json([
            "recent" => $recent,
        ]);
    }

    /**
     * @param Request $request
     * @return JsonResponse
     */
    public function toggleServiceFavorite(Request $request): JsonResponse
    {
        $user = auth()->user();
        $user->billFavoriteServices()->toggle(['bill_service_id' => $request->billService]);

        return response()->json([
            "success" => true,
        ]);

    }

    /**
     * @param Request $request
     * @return JsonResponse
     */
    public function getUserFavoriteServices(Request $request): JsonResponse
    {
        $favorites = auth()->user()->billFavoriteServices()->skip($request->skipFavorite)->take(6)->get();
        $onlineService = auth()->user()->pktServices()->where('type', 'node')->where('online', 1)->where('freeze', 0)->select('id', 'wallet_address', 'mac_address')->first();

        return response()->json([
            "favorites"     => $favorites,
            'onlineService' => $onlineService
        ]);
    }

    /**
     * @param Request $request
     * @return JsonResponse
     */
    public function discardBillPayment(Request $request): JsonResponse
    {
        try {
            DB::beginTransaction();
            $data = ['id' => $request->paymentId];
            $this->billPaymentsRepository->delete($data);
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
     * @param UpdatePaymentRequest $request
     * @return BillPaymentResource|JsonResponse
     */
    public function updateBillPayment(UpdatePaymentRequest $request)
    {
        try {
            $billPayment = $this->billPaymentsRepository->getByDirectDebitId($request->direct_debit_id);

            if ($billPayment) {
                DB::beginTransaction();
                $paymentData = [
                    'bill_service_id' => isset($request->bill_service_id) ? $request->bill_service_id : null,
                    'service_id'      => $request->service_id,
                    'user_id'         => $request->user_id,
                    'address'         => $request->address,
                    'phone'           => $request->phone,
                    'amount'          => $request->amount,
                    'recurring'       => $request->recurring,
                    'holder_name'     => $request->holder_name,
                    'account_number'  => $request->account_number,
                    'apartment'       => $request->apartment,
                    'city'            => $request->city,
                    'country'         => $request->country,
                    'state'           => $request->state,
                    'zip_code'        => $request->zip_code,
                    'service_name'    => isset($request->service_name) ? $request->service_name : null,
                    'description'     => isset($request->description) ? $request->description : null,
                    'payment_date'    => Carbon::parse($request->payment_date)->toDateString(),
                ];
                $billPayment->update($paymentData);
                DB::commit();
            }
            return new BillPaymentResource($billPayment);

        } catch (Exception $exception) {
            DB::rollBack();
            captureException($exception);
            return response()->json([
                "success" => false,
            ]);
        }
    }
}
