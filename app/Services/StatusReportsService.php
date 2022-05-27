<?php

namespace App\Services;

use App\Contracts\PktServicesInterface;
use App\Events\DevicePaired;
use App\Jobs\DevicesAutoRebootJob;
use Carbon\Carbon;

class StatusReportsService
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
     * @var PairingInfoService
     */
    protected PairingInfoService $pairingInfoService;

    /**
     * @param PktServicesInterface $pktServicesRepository
     * @param LogsService $logsService
     * @param PairingInfoService $pairingInfoService
     */
    public function __construct(PktServicesInterface $pktServicesRepository, LogsService $logsService, PairingInfoService $pairingInfoService)
    {
        $this->pktServicesRepository = $pktServicesRepository;
        $this->logsService = $logsService;
        $this->pairingInfoService = $pairingInfoService;
    }

    /**
     * @param $request
     * @param $service
     * @return array
     */
    public function setStatusReport($request, $service): array
    {
        $reportData = [
            'bandwidth_used'              => $request->bandwidth_used,
            'bandwidth_used_kbps'         => $request->bandwidth_used_kbps,
            'bandwidth_available'         => $request->bandwidth_available,
            'encryptions_per_second'      => $request->encryptions_per_second,
            'kilo_encryptions_per_second' => $request->kilo_encryptions_per_second,
            'wallet_balance'              => $request->wallet_balance,
            'spendable'                   => $request->spendable,
            'immaturereward'              => $request->immaturereward,
            'unconfirmed'                 => $request->unconfirmed,
            'outputcount'                 => $request->outputcount,
            'device_clock_ms'             => $request->device_clock_ms,
            'wallet_block_height'         => $request->wallet_block_height,
            'wallet_block_hash'           => $request->wallet_block_hash,
            'last_event_timestamp'        => $request->last_event_timestamp,
            'version'                     => $request->version,
            'rack_mode_recipient'         => $request->rack_mode_recipient,
            'pools_info'                  => $request->pools_info ? json_encode($request->pools_info) : null,
            'updated_at'                  => Carbon::now()->toDateTimeString()
        ];

        if ($request->paired_devices) {
            $this->setDevicePairings($request->paired_devices, $service, $request->ip());
        }
        $this->recordIPs($service, $request->ip());

        $pkteerSession = $request->header('pkteer-session');

        if ($pkteerSession) {
            $this->updateOfflineReason($service, $pkteerSession);
        }


        $lastEncryption = $service->encryptions()->orderBy('created_at', 'desc')->first();
        if ($lastEncryption) {
            if (Carbon::now()->subHour() >= $lastEncryption->created_at) {
                $this->createEncryptionData($service, $request->encryptions_per_second);
            }
        } else {
            $this->createEncryptionData($service, $request->encryptions_per_second);
        }

        $data = ['wallet_address' => $request->wallet_address];
        $this->pktServicesRepository->update($service->id, $data);

        $statusReport = $service->statusReport;

        if (!$statusReport) {
            $statusReport = $service->statusReport()->create($reportData);
        } else {
            if ($service->id == 28 && $service->statusReport->version != $reportData['version']) {
                DevicesAutoRebootJob::dispatch();
            }

            $statusReport->update($reportData);
        }
        return [
            'statusReport' => $statusReport
        ];
    }

    /**
     * @param $service
     * @param $encryption
     */
    public function createEncryptionData($service, $encryption)
    {
        $encryptionData = [
            'encryptions_per_second' => $encryption,
            'created_at'             => Carbon::now()->startOfHour()->toDateTimeString()
        ];
        $service->encryptions()->create($encryptionData);
    }

    /**
     * @param $service
     * @param $pkteerSession
     */
    protected function updateOfflineReason($service, $pkteerSession)
    {
        $oldSession = $service->pkteer_session;
        $this->pktServicesRepository->update($service->id, ['pkteer_session' => $pkteerSession]);
        $lastOffline = $service->systemLogs()->where('type', 'offline')->orderBy('created_at', 'desc')->first();
        if ($lastOffline) {
            $reason = $oldSession != $pkteerSession ? 'reboot' : 'inaccessible';
            $text = str_replace("pending", $reason, $lastOffline->text);
            $lastOffline->text = $text;
            $lastOffline->save();
        }
    }

    /**
     * @param $service
     * @param $ip
     */
    protected function recordIPs($service, $ip)
    {
        $usedIp = $service->ipAddresses()->where('ip', $ip)->first();
        if (!$usedIp) {
            $service->ipAddresses()->create(['ip' => $ip]);
        } else {
            $usedIp->update(['updated_at' => Carbon::now()->toDateTimeString()]);
        }
    }

    /**
     * @param $pairedDevices
     * @param $service
     * @param $ip
     */
    protected function setDevicePairings($pairedDevices, $service, $ip)
    {
        $service->devicePairings()->whereNotIn('device_unique_key', $pairedDevices)->delete();
        foreach ($pairedDevices as $token) {

            $pairToken = $service->pairTokens()->where('token', $token)->first();

            if ($pairToken) {

                $paired = $service->devicePairings()
                    ->where('device_unique_key', $token)
                    ->first();

                if (!$paired) {
                    $pairingInfo = $this->pairingInfoService->setPairedDeviceInfo($ip, $pairToken->user_agent);
                    $data = [
                        'device_unique_key' => $token,
                        'service_id'        => $service->id,
                        'last_login'        => Carbon::now()->toDateTimeString(),
                        'user_agent'        => $pairToken->user_agent,
                        'country'           => $pairingInfo['country'],
                        'logo'              => $pairingInfo['logo'],
                    ];
                    $devicePairing = $service->devicePairings()->create($data);

                    $text = 'Device paired -> ' . (isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '') .
                        ', ' . $pairToken->user_agent .
                        ', ' . $devicePairing->id;

                    $this->logsService->addDeviceLog($service, $text);
                    broadcast(new DevicePaired($devicePairing, 'success'));
                }
            }
        }

        $paired = $service->devicePairings()->whereIn('device_unique_key', $pairedDevices)->pluck('device_unique_key')->toArray();
        $unpairUniqueKeys = array_diff($pairedDevices, $paired);
        $this->setDeviceUnPairings($unpairUniqueKeys, $service);
    }

    /**
     * @param $unpairedDevices
     * @param $service
     */
    protected function setDeviceUnPairings($unpairedDevices, $service)
    {
        foreach ($unpairedDevices as $key) {
            $unpair = $service->deviceUnpairings()->where('data', $key)->first();
            if (!$unpair) {
                $data = [
                    'data'         => $key,
                    'event'        => 'unpair',
                    'pkteer_token' => $service->token
                ];
                $service->events()->create($data);
            }
        }
    }
}