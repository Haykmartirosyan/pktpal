<?php

namespace App\Http\Controllers\user;

use App\Contracts\PktServicesInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\EnableRackModeRequest;
use App\Http\Requests\SendPktRequest;
use App\Http\Resources\PktResource;
use App\Http\Resources\SeedExportPassphraseResource;
use App\Http\Resources\TransactionResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use function Sentry\captureException;
use Exception;

class EventsController extends Controller
{
    /**
     * @var PktServicesInterface
     */
    protected PktServicesInterface $pktServicesRepository;

    /**
     * StatusReportsController constructor.
     * @param PktServicesInterface $pktServicesRepository
     */
    public function __construct(PktServicesInterface $pktServicesRepository)
    {
        $this->pktServicesRepository = $pktServicesRepository;
    }

    /**
     * @param Request $request
     * @return SeedExportPassphraseResource|array
     */
    public function exportSeed(Request $request)
    {
        try {
            $service = $this->pktServicesRepository->getByMacAddress($request->macAddress);

            DB::beginTransaction();
            $data = [
                'data'         => $request->exportPassphrase,
                'event'        => 'export_seed',
                'pkteer_token' => $service->token
            ];
            $exportPassphrase = $service->events()->create($data);

            DB::commit();
            return new SeedExportPassphraseResource($exportPassphrase);
        } catch (Exception $exception) {
            DB::rollBack();
            captureException($exception);
            return [];
        }
    }

    /**
     * @param SendPktRequest $request
     * @return TransactionResource|array
     */
    public function sendPkt(SendPktRequest $request)
    {
        try {
            $service = $this->pktServicesRepository->getByMacAddress($request->macAddress);

            $transactionData = [
                'event'        => 'transaction',
                'data'         => $request->transactionData['description'],
                'sign_req'     => $request->transactionData['sign_req'],
                'msg'          => $request->transactionData['msg'],
                'mac_address'  => $request->macAddress,
                'pkteer_token' => $service->token
            ];

            DB::beginTransaction();
            $transaction = $service->events()->create($transactionData);
            DB::commit();
            return new TransactionResource($transaction);
        } catch (Exception $exception) {
            captureException($exception);
            return [];
        }
    }

    /**
     * @param Request $request
     * @return JsonResponse
     */
    public function unPairDevice(Request $request): JsonResponse
    {
        try {
            $service = $this->pktServicesRepository->getById($request->serviceId);
            $deviceUnpairings = $service->deviceUnpairings()->where('data', $request->token)->first();

            if (!$deviceUnpairings) {
                DB::beginTransaction();

                $data = [
                    "event"        => 'unpair',
                    "data"         => $request->token,
                    'pkteer_token' => $service->token
                ];

                $service->events()->create($data);

                DB::commit();
            }

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
     * @param EnableRackModeRequest $request
     * @return PktResource|array
     */
    public function enableRackMode(EnableRackModeRequest $request)
    {
        try {
            $service = $this->pktServicesRepository->getById($request->service_id);

            $enabledRackMode = $service->enableRackMode()->first();

            if ($service->type == 'node' && !$enabledRackMode) {
                DB::beginTransaction();
                $eventData = [
                    'event'          => 'enable_rack_mode',
                    'mac_address'    => $request->mac_address,
                    'sign_req'       => $request->sign_req,
                    'msg'            => $request->msg,
                    'wallet_address' => $request->wallet_address,
                    'pkteer_token'   => $service->token
                ];

                $service->events()->create($eventData);
                DB::commit();
            }

            return new PktResource($service);
        } catch (Exception $exception) {
            DB::rollBack();
            captureException($exception);
            return [];
        }
    }

    /**
     * @param Request $request
     * @return JsonResponse
     */
    public function disableRackMode(Request $request): JsonResponse
    {
        try {
            $service = $this->pktServicesRepository->getById($request->service_id);
            $disabledRackMode = $service->disableRackMode()->first();

            if ($service->type == 'rack' && !$disabledRackMode) {
                DB::beginTransaction();
                $eventData = [
                    'event'          => 'disable_rack_mode',
                    'wallet_address' => $service->wallet_address,
                    'pkteer_token'   => $service->token
                ];

                $service->events()->create($eventData);
                DB::commit();
            }
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
}
