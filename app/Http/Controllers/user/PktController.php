<?php

namespace App\Http\Controllers\user;

use App\Contracts\PktServicesInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateUserAgentDataRequest;
use App\Http\Resources\DevicePairingOptionResoucre;
use App\Http\Resources\DevicePairingResource;
use App\Http\Resources\DevicePairingsCollection;
use App\Http\Resources\PairTokenResource;
use App\Http\Resources\PktResource;
use App\Services\PairingInfoService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Sentry\Severity;
use Sentry\State\Scope;
use function Sentry\captureException;
use function Sentry\captureMessage;
use function Sentry\withScope;

class PktController extends Controller
{
    /**
     * @var PktServicesInterface
     */
    protected PktServicesInterface $pktServicesRepository;

    /**
     * @var PairingInfoService
     */
    protected PairingInfoService $pairingInfoService;

    /**
     * @param PktServicesInterface $pktServicesRepository
     * @param PairingInfoService $pairingInfoService
     */
    public function __construct(PktServicesInterface $pktServicesRepository, PairingInfoService $pairingInfoService)
    {
        $this->pktServicesRepository = $pktServicesRepository;
        $this->pairingInfoService = $pairingInfoService;
    }

    /**
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();
        if (isset($request->skip)) {
            $services = $user->pktServices()->with('statusReport')->skip($request->skip)->take(10)->get();
            $count = $user->pktServices()->count();
        } else {
            $services = $user->pktServices()->with('statusReport')->get();
        }

        return response()->json([
            "pkt_services" => $services,
            "count"        => isset($count) ? $count : null
        ]);
    }

    /**
     * @param $id
     * @return PktResource|JsonResponse
     */
    public function getService($id)
    {
        if (is_numeric($id)) {
            $user = auth()->user();

            $service = $user->pktServices()->where('id', $id)->first();
            if ($service) {
                return new PktResource($service);
            }
            return response()->json([
                "error" => 'Not Found',
            ], 404);
        }
        return response()->json([
            "error" => 'Not Found',
        ], 422);
    }

    /**
     * @param $id
     * @return DevicePairingOptionResoucre|array
     */
    public function getServicePairOption($id)
    {
        $service = $this->pktServicesRepository->getById($id);

        $option = $service->devicePairingOption;

        if ($option) {
            return new DevicePairingOptionResoucre($option);
        }

        return [];
    }

    /**
     * @param $id
     * @return DevicePairingsCollection
     */
    public function getPairedDevices($id): DevicePairingsCollection
    {
        $service = $this->pktServicesRepository->getById($id);

        $devices = $service->devicePairings()->orderByDesc('last_login')->get();

        return new DevicePairingsCollection($devices);
    }

    /**
     * @param Request $request
     * @param $id
     * @return JsonResponse
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $user = auth()->user();
            $user->pktServices()->where('id', $id)->update($request->all());

            return response()->json([
                "success" => true,
            ]);
        } catch (Exception $exception) {
            captureException($exception);
            return response()->json([
                "success" => false,
            ]);
        }
    }

    /**
     * @param Request $request
     * @return PairTokenResource|JsonResponse
     */
    public function setDevicePairToken(Request $request)
    {
        try {
            $service = $this->pktServicesRepository->getByMacAddress($request->mac_address);

            if ($service && $request->user_agent) {
                $pairToken = $service->pairTokens()->where('user_agent', $request->user_agent)->first();

                DB::beginTransaction();
                if ($pairToken) {
                    $pairToken->update(['token' => $request->token]);
                } else {
                    $pairToken = $service->pairTokens()->create($request->all());
                }
                DB::commit();
                return new PairTokenResource($pairToken);
            }

            return response()->json([
                "success" => false,
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
     * @param UpdateUserAgentDataRequest $request
     * @return DevicePairingResource|array
     */
    public function updateUserAgentData(UpdateUserAgentDataRequest $request)
    {
        try {
            $service = $this->pktServicesRepository->getByMacAddress($request->mac_address);
            $devicePairing = $service->devicePairings()->where('device_unique_key', $request->device_unique_key)->first();

            if ($devicePairing) {
                $pairToken = $service->pairTokens()->where('token', $devicePairing->device_unique_key)->first();
                if ($pairToken && $pairToken->user_agent != $devicePairing->user_agent) {
                    $pairToken->update(['user_agent' => $devicePairing->user_agent]);
                }

                $pairingInfo = $this->pairingInfoService->setPairedDeviceInfo($request->ip(), $request->user_agent);

                DB::beginTransaction();
                $data = [
                    'last_login' => $request->last_login,
                    'country'    => $pairingInfo['country'],
                    'logo'       => $pairingInfo['logo'],
                    'user_agent' => $request->user_agent['userAgent']
                ];
                $devicePairing->update($data);
                DB::commit();
                return new DevicePairingResource($devicePairing);
            }
            return [];
        } catch (Exception $exception) {
            captureException($exception);
            return [];
        }
    }

    /**
     * @param Request $request
     * @return bool
     */
    public function errorPairing(Request $request): bool
    {
        $email = $request->email;
        $agent = $request->user_agent;
        $macAddress = $request->mac_address;
        withScope(function (Scope $scope) use ($email, $agent, $macAddress) {
            $scope->setLevel(Severity::error());
            captureMessage('Long pairing ' . $email . ' ' . $agent . ' ' . $macAddress);
        });

        return true;
    }

    /**
     * @return JsonResponse
     */
    public function getServicesWallets(): JsonResponse
    {
        $user = auth()->user();
        $servicesWallets = $user->pktServices()->pluck('wallet_address')->toArray();

        return response()->json([
            "wallet_addresses" => $servicesWallets,
        ]);
    }
}
