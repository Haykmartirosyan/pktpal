<?php

namespace App\Http\Controllers\api\v1;

use App\Contracts\PktServicesInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\api\v1\PkteerTokenRequest;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

/**
 * Class EventsController
 * @package App\Http\Controllers\api\v1
 */
class EventsController extends Controller
{
    /**
     * @var PktServicesInterface
     */
    protected PktServicesInterface $pktServicesRepository;

    /**
     * OptionsController constructor.
     * @param PktServicesInterface $pktServicesRepository
     */
    public function __construct(PktServicesInterface $pktServicesRepository)
    {
        $this->pktServicesRepository = $pktServicesRepository;
    }

    /**
     * @param PkteerTokenRequest $request
     * @return array|JsonResponse
     */
    public function getEvents(PkteerTokenRequest $request)
    {
        $service = $this->pktServicesRepository->getByToken($request->header('pkteer-token'));
        if ($service) {
            $transactionsData = $this->transactions($service);
            $unpairedData = $this->unpair($service);
            $enabledRackModeData = $this->enabledRackMode($service);
            $disabledRackModeData = $this->disabledRackMode($service);
            $seedExportData = $this->seedExport($service);
            $rebootData = $this->reboot($service);
            $shutDownData = $this->shutDown($service);
            $switchEnvData = $this->switchEnv($service);
            $addDirectDebitData = $this->addDirectDebit($service);
            $factoryRackModeData = $this->factoryRackMode($service);
            $removeDirectDebitData = $this->removeDirectDebit($service);
            $spendDirectDebitData = $this->spendDirectDebit($service);
            $alterDirectDebitData = $this->alterDirectDebit($service);

            return array_merge($transactionsData, $unpairedData, $enabledRackModeData, $disabledRackModeData, $seedExportData, $rebootData,
                $shutDownData, $switchEnvData, $addDirectDebitData, $factoryRackModeData, $removeDirectDebitData, $spendDirectDebitData, $alterDirectDebitData);
        }
        return response()->json([
            "error" => 'Not Found',
        ], 404);

    }

    /**
     * @param $service
     * @return array
     */
    protected function transactions($service): array
    {
        $data = [];
        $transactions = $service->pendingTransactions()->select(['msg', 'sign_req', 'id', 'event'])->get();

        foreach ($transactions as $transaction) {
            $data[] = [
                'id'         => $transaction->id,
                'event_type' => $transaction->event,
                'timestamp'  => Carbon::now()->getPreciseTimestamp(3),
                'data'       => [
                    'msg' => $transaction->msg,
                    'sig' => $transaction->sign_req,
                ],
            ];
        }

        return $data;
    }

    /**
     * @param $service
     * @return array
     */
    protected function unpair($service): array
    {
        $data = [];
        $unpaired = $service->deviceUnpairings()->select(['data', 'id', 'event'])->get();

        foreach ($unpaired as $unpair) {
            $data[] = [
                'id'         => $unpair->id,
                'timestamp'  => Carbon::now()->getPreciseTimestamp(3),
                'event_type' => $unpair->event,
                'data'       => [
                    'device_unique_key' => $unpair->data,
                ],
            ];
        }

        return $data;
    }

    /**
     * @param $service
     * @return array
     */
    protected function enabledRackMode($service): array
    {
        $data = [];
        $enabledRackMode = $service->enableRackMode()->select(['msg', 'sign_req', 'id', 'event'])->first();

        if ($enabledRackMode) {
            $data[] = [
                'id'         => $enabledRackMode->id,
                'event_type' => $enabledRackMode->event,
                'timestamp'  => Carbon::now()->getPreciseTimestamp(3),
                'data'       => [
                    'msg' => $enabledRackMode->msg,
                    'sig' => $enabledRackMode->sign_req,
                ]
            ];
        }

        return $data;
    }

    /**
     * @param $service
     * @return array
     */
    protected function disabledRackMode($service): array
    {
        $data = [];
        $disabledRackMode = $service->disableRackMode()->select(['wallet_address', 'id', 'event'])->first();

        if ($disabledRackMode) {
            $data[] = [
                'id'         => $disabledRackMode->id,
                'event_type' => $disabledRackMode->event,
                'timestamp'  => Carbon::now()->getPreciseTimestamp(3),
                'data'       => [
                    'wallet_address' => $disabledRackMode->wallet_address,
                ]
            ];
        }

        return $data;
    }

    /**
     * @param $service
     * @return array
     */
    protected function seedExport($service): array
    {
        $data = [];
        $exportPassphrases = $service->seedExportPassphrases()->select(['data', 'id', 'event'])->get();

        foreach ($exportPassphrases as $exportPassphrase) {
            $data[] = [
                'id'         => $exportPassphrase->id,
                'event_type' => $exportPassphrase->event,
                'timestamp'  => Carbon::now()->getPreciseTimestamp(3),
                'data'       => [
                    'passphrase' => $exportPassphrase->data,
                ]
            ];
        }
        return $data;
    }


    /**
     * @param $service
     * @return array
     */
    protected function reboot($service): array
    {
        $data = [];
        $reboot = $service->rebootEvent()->select(['id', 'event', 'data'])->first();

        if ($reboot) {
            $data[] = [
                'id'         => $reboot->id,
                'event_type' => $reboot->event,
                'timestamp'  => Carbon::now()->getPreciseTimestamp(3),
            ];
        }

        return $data;
    }

    /**
     * @param $service
     * @return array
     */
    protected function shutDown($service): array
    {
        $data = [];
        $shutDown = $service->shutDownEvent()->select(['id', 'event'])->first();

        if ($shutDown) {
            $data[] = [
                'id'         => $shutDown->id,
                'event_type' => $shutDown->event,
                'timestamp'  => Carbon::now()->getPreciseTimestamp(3),
            ];
        }

        return $data;
    }

    /**
     * @param $service
     * @return array
     */
    protected function factoryRackMode($service): array
    {
        $data = [];
        $factoryRackMode = $service->factoryRackModeEvent()->select(['wallet_address', 'id', 'event'])->first();

        if ($factoryRackMode) {
            $data[] = [
                'id'         => $factoryRackMode->id,
                'event_type' => $factoryRackMode->event,
                'timestamp'  => Carbon::now()->getPreciseTimestamp(3),
                'data'       => [
                    'beneficiary' => $factoryRackMode->wallet_address,
                ]
            ];
        }

        return $data;
    }

    /**
     * @param $service
     * @return array
     */
    protected function switchEnv($service): array
    {
        $data = [];
        $switchEnv = $service->switchEnvEvent()->select(['id', 'event'])->first();

        if ($switchEnv) {
            $data[] = [
                'id'         => $switchEnv->id,
                'event_type' => $switchEnv->event,
                'timestamp'  => Carbon::now()->getPreciseTimestamp(3),
            ];
        }

        return $data;
    }

    /**
     * @param $service
     * @return array
     */
    protected function addDirectDebit($service): array
    {
        $data = [];
        $directDebits = $service->addDirectDebitEvent()->select(['id', 'event', 'data', 'sign_req'])->get();

        foreach ($directDebits as $directDebit) {
            $data[] = [
                'id'         => $directDebit->id,
                'event_type' => $directDebit->event,
                'timestamp'  => Carbon::now()->getPreciseTimestamp(3),
                'data'       =>
                    [
                        "msg" => $directDebit->data,
                        "sig" => $directDebit->sign_req
                    ]
            ];
        }

        return $data;
    }

    /**
     * @param $service
     * @return array
     */
    protected function removeDirectDebit($service): array
    {
        $data = [];
        $removeDirectDebits = $service->removeDirectDebitEvent()->select(['id', 'event', 'data'])->get();

        foreach ($removeDirectDebits as $removeDirectDebit) {
            $data[] = [
                'id'         => $removeDirectDebit->id,
                'event_type' => $removeDirectDebit->event,
                'timestamp'  => Carbon::now()->getPreciseTimestamp(3),
                'data'       => [
                    'id' => $removeDirectDebit->data,
                ]
            ];
        }

        return $data;
    }

    /**
     * @param $service
     * @return array
     */
    protected function spendDirectDebit($service): array
    {
        $data = [];
        $spendDirectDebits = $service->spendDirectDebitEvent()->select(['id', 'event', 'data'])->get();

        foreach ($spendDirectDebits as $spendDirectDebit) {
            $data[] = [
                'id'         => $spendDirectDebit->id,
                'event_type' => $spendDirectDebit->event,
                'timestamp'  => Carbon::now()->getPreciseTimestamp(3),
                'data'       => [
                    'id'     => json_decode($spendDirectDebit->data)->id,
                    'amount' => json_decode($spendDirectDebit->data)->amount
                ]
            ];
        }

        return $data;
    }

    /**
     * @param $service
     * @return array
     */
    protected function alterDirectDebit($service): array
    {
        $data = [];
        $alterDirectDebits = $service->alterDirectDebitEvent()->select(['id', 'event', 'data'])->get();

        foreach ($alterDirectDebits as $alterDirectDebit) {
            $data[] = [
                'id'         => $alterDirectDebit->id,
                'event_type' => $alterDirectDebit->event,
                'timestamp'  => Carbon::now()->getPreciseTimestamp(3),
                'data'       => [
                    'id'    => json_decode($alterDirectDebit->data)->id,
                    'day'   => json_decode($alterDirectDebit->data)->day,
                    'week'  => json_decode($alterDirectDebit->data)->week,
                    'month' => json_decode($alterDirectDebit->data)->month
                ]
            ];
        }

        return $data;
    }

}
