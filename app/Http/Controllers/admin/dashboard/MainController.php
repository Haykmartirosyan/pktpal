<?php

namespace App\Http\Controllers\admin\dashboard;

use App\Contracts\PktServicesInterface;
use App\Contracts\UsersInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\AssignDeviceRequest;
use App\Services\LogsService;
use App\Services\MacAddressService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Sentry\Severity;
use Sentry\State\Scope;
use function Sentry\captureException;
use function Sentry\captureMessage;
use function Sentry\withScope;


/**
 * Class MainController
 * @package App\Http\Controllers\admin\dashboard
 */
class MainController extends Controller
{
    /**
     * @var PktServicesInterface
     */
    protected PktServicesInterface $pktServicesRepository;
    /**
     * @var UsersInterface
     */
    protected UsersInterface $userRepository;

    /**
     * @var MacAddressService
     */
    protected MacAddressService $macAddressService;

    /**
     * @var LogsService
     */
    protected LogsService $logsService;

    /**
     * @param PktServicesInterface $pktServicesRepository
     * @param LogsService $logsService
     * @param UsersInterface $userRepository
     * @param MacAddressService $macAddressService
     */
    public function __construct(PktServicesInterface $pktServicesRepository,
                                LogsService          $logsService,
                                UsersInterface       $userRepository, MacAddressService $macAddressService)
    {
        $this->pktServicesRepository = $pktServicesRepository;
        $this->userRepository = $userRepository;
        $this->macAddressService = $macAddressService;
        $this->logsService = $logsService;
    }

    /**
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $services = $this->pktServicesRepository->paginateServices($request->all());
        return response()->json([
            "services"    => $services['data'],
            "totalAmount" => $services['count'],
        ]);
    }

    /**
     * @return JsonResponse
     */
    public function getOrderedUsers(): JsonResponse
    {
        $orderedUser = DB::table('wp_postmeta')
            ->where('meta_key', '_customer_user')
            ->distinct('meta_value')
            ->pluck('meta_value')->toArray();

        $orderedUser = implode(',', $orderedUser);

        $usersQuery = "SELECT wp_users.ID, wp_users.display_name, 
                       firstmeta.meta_value as first_name, lastmeta.meta_value as last_name 
                       FROM wp_users 
                       left join wp_usermeta as firstmeta 
                       on wp_users.ID = firstmeta.user_id and firstmeta.meta_key = 'first_name' 
                       left join wp_usermeta as lastmeta
                       on wp_users.ID = lastmeta.user_id and lastmeta.meta_key = 'last_name'
                       where wp_users.ID in ($orderedUser)";

        $users = DB::select(DB::raw($usersQuery));

        return response()->json([
            "orderedUsers" => $users,
        ]);

    }

    /**
     * @param AssignDeviceRequest $request
     * @return JsonResponse
     */
    public function assignDevice(AssignDeviceRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();
            $authUser = auth()->user();

            foreach (array_unique($request->assignedDevices) as $assignedDevice) {
                $service = $this->pktServicesRepository->getById($assignedDevice['id']);
                $user = $this->userRepository->getById($assignedDevice['user_id']);
                $this->pktServicesRepository->update($assignedDevice['id'], ['user_id' => $assignedDevice['user_id']]);
                $this->macAddressService->assignToOrder($user, $service);

                $text = $authUser->user_email . ' reassigned ' . $service->mac_address . ' to ' . $user->user_email;
                $this->logsService->addDeviceLog($service, $text);
                withScope(function (Scope $scope) use ($text) {
                    $scope->setLevel(Severity::info());
                    captureMessage($text);
                });

                if (app()->environment() == 'production') {
                    Log::channel('mattermost')->info($text);
                }
            }

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
