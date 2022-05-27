<?php

namespace App\Http\Controllers\admin\dashboard;

use App\Contracts\PktServicesInterface;
use App\Contracts\UsersInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\OrdersRequest;
use App\Http\Requests\SetAssignedDevicesRequest;
use App\Jobs\AssignOrderJob;
use App\Jobs\FactoryRackModeJob;
use App\Services\LogsService;
use App\Services\MacAddressService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Sentry\Severity;
use Sentry\State\Scope;
use function Sentry\captureException;
use Exception;
use function Sentry\captureMessage;
use function Sentry\withScope;

class OrdersController extends Controller
{
    /**
     * @var PktServicesInterface
     */
    protected PktServicesInterface $pktServicesRepository;

    /**
     * @var MacAddressService
     */
    protected MacAddressService $macAddressService;

    /**
     * @var UsersInterface
     */
    protected UsersInterface $userRepository;

    /**
     * @var LogsService
     */
    protected LogsService $logsService;

    /**
     * @param PktServicesInterface $pktServicesRepository
     * @param MacAddressService $macAddressService
     * @param UsersInterface $userRepository
     * @param LogsService $logsService
     */
    public function __construct(PktServicesInterface $pktServicesRepository, MacAddressService $macAddressService,
                                UsersInterface       $userRepository, LogsService $logsService)
    {
        $this->pktServicesRepository = $pktServicesRepository;
        $this->macAddressService = $macAddressService;
        $this->userRepository = $userRepository;
        $this->logsService = $logsService;
    }

    /**
     * @param Request $request
     * @return JsonResponse
     */
    public function unassignedDevices(Request $request): JsonResponse
    {
        try {
            $services = $this->pktServicesRepository->getUnassignedDevices($request->skip, $request->searchQuery);

            return response()->json([
                "services" => $services
            ]);

        } catch (Exception $exception) {
            captureException($exception);
            return response()->json([
                "success" => false,
            ], 500);
        }
    }

    /**
     * @param OrdersRequest $request
     * @return JsonResponse
     */
    public function getOrders(OrdersRequest $request): JsonResponse
    {
        try {
            $searchQuery = $request->searchQuery;
            $ordersQuery = DB::table('wp_posts')
                ->select(
                    DB::raw(
                        "wp_users.ID  as user_id,
                               wp_posts.post_date as order_date,
                               wp_posts.ID as order_id,
                               wp_users.user_email as email,
                               MAX(CASE WHEN wp_usermeta.meta_key = 'first_name' THEN wp_usermeta.meta_value END) as first_name,
                               MAX(CASE WHEN wp_usermeta.meta_key = 'last_name' THEN wp_usermeta.meta_value END)  as last_name,
                               MAX(CASE WHEN wp_woocommerce_order_itemmeta.meta_key = '_qty' AND wp_woocommerce_order_items.order_item_id = wp_woocommerce_order_itemmeta.order_item_id THEN wp_woocommerce_order_itemmeta.meta_value END) AS qty,
                               MAX(CASE WHEN wp_woocommerce_order_itemmeta.meta_key = '_qty_unassigned' AND wp_woocommerce_order_items.order_item_id = wp_woocommerce_order_itemmeta.order_item_id THEN wp_woocommerce_order_itemmeta.meta_value END) AS qty_unassigned"
                    )
                )
                ->join('wp_postmeta', 'wp_posts.ID', 'wp_postmeta.post_id')
                ->join('wp_users', function ($join) {
                    $join->where('wp_postmeta.meta_key', '_customer_user')
                        ->on('wp_users.ID', 'wp_postmeta.meta_value');
                })
                ->join('wp_usermeta', 'wp_usermeta.user_id', 'wp_users.ID')
                ->join('wp_woocommerce_order_items', 'wp_woocommerce_order_items.order_id', 'wp_posts.ID')
                ->join('wp_woocommerce_order_itemmeta', 'wp_woocommerce_order_itemmeta.order_item_id', 'wp_woocommerce_order_items.order_item_id')
                ->where('post_type', 'shop_order')
                ->where((function ($query) {
                    $query->where('post_status', 'wc-processing')
                        ->orWhere('post_status', 'wc-spec-assigned');
                }))
                ->groupBy(['wp_posts.ID', 'wp_users.ID']);

            $where = '';

            if ($searchQuery) {
                $where = "WHERE data.order_id like '%$searchQuery%' OR data.first_name LIKE '%$searchQuery%' OR data.last_name LIKE '%$searchQuery%' or concat(data.first_name, ' ', data.last_name)  LIKE '%$searchQuery%'";
            }

            $orders = DB::select("SELECT * FROM (" . $ordersQuery->toSql() . ") AS data $where LIMIT $request->skip, 10", $ordersQuery->getBindings());

            return response()->json([
                'orders' => $orders
            ]);
        } catch (Exception $exception) {
            captureException($exception);
            return response()->json([
                "success" => false,
            ], 500);
        }
    }


    /**
     * @param SetAssignedDevicesRequest $request
     * @return JsonResponse
     */
    public function setAssignedDevices(SetAssignedDevicesRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();
            $assignedDevices = $request->all();
            $authUser = auth()->user();
            foreach ($assignedDevices as $assignedDevice) {
                $service = $this->pktServicesRepository->getByMacAddress($assignedDevice['mac_address']);
                $this->pktServicesRepository->update($service->id, ['user_id' => $assignedDevice['user_id']]);
                $text = $authUser->user_email . ' assigned ' . $service->mac_address . ' to ' . $assignedDevice['user_email'];
                $this->logsService->addDeviceLog($service, $text);
                withScope(function (Scope $scope) use ($text) {
                    $scope->setLevel(Severity::info());
                    captureMessage($text);
                });

                if (app()->environment() == 'production') {
                    Log::channel('mattermost')->info($text);
                }
            }
            FactoryRackModeJob::dispatch($assignedDevices);
            AssignOrderJob::dispatch($assignedDevices);
            DB::commit();
            return response()->json([
                "success" => true,
            ]);
        } catch (Exception $exception) {
            DB::rollBack();
            captureException($exception);
            return response()->json([
                "success" => false,
            ], 500);
        }
    }
}
