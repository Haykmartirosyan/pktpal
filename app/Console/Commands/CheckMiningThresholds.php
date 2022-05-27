<?php

namespace App\Console\Commands;

use App\Contracts\PktServicesInterface;
use App\Services\RecommendedPoolsServices;
use Carbon\Carbon;
use GuzzleHttp\Client;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckMiningThresholds extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'check:mining-thresholds';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Notifications for mining thresholds';

    /**
     * @var PktServicesInterface
     */
    protected $pktServicesRepository;

    /**
     * @var RecommendedPoolsServices
     */
    protected $recommendedPoolsService;

    /**
     * Create a new command instance.
     *
     * @param PktServicesInterface $pktServicesRepository
     * @param RecommendedPoolsServices $recommendedPoolsService
     */
    public function __construct(PktServicesInterface $pktServicesRepository, RecommendedPoolsServices $recommendedPoolsService)
    {
        parent::__construct();
        $this->pktServicesRepository = $pktServicesRepository;
        $this->recommendedPoolsService = $recommendedPoolsService;
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $services = $this->pktServicesRepository->getOnlineDevices();
        $client = new Client();

        $services->chunkById(20, function ($services) use ($client) {
            foreach ($services as $service) {

                $lastOnlineLog = $service->lastOnlineLog()->first();
                if ($lastOnlineLog) {
                    $result = Carbon::now()->diffInHours($lastOnlineLog->created_at);
                    if ($result >= 24) {
                        $serviceLevel = $this->recommendedPoolsService->setRecommendedPools($service)['level'];

                        $endpoint = 'https://explorer.pkt.cash/api/v1/PKT/pkt/address/' . $service->wallet_address;
                        $response = $client->request('GET', $endpoint);
                        $content = json_decode($response->getBody(), true);
                        $mined24 = pktNumber((int)$content['mined24']);

                        $notify = $this->checkThresholds($mined24, $serviceLevel);

                        if ($notify) {
                            $text = "$service->mac_address running at $serviceLevel mining level, mined in last 24 hours $mined24 PKT";
                            if (app()->environment() == 'production') {
                                Log::channel('mattermost-thresholds')->info($text);
                            }
                        }
                    }
                }
            }
        });

        return true;
    }

    /**
     * @param $mined24
     * @param $level
     * @return bool
     */
    protected function checkThresholds($mined24, $level)
    {
        $notify = false;
        switch ($level) {
            case('low'):
                if ($mined24 < 50) $notify = true;
                break;
            case('medium'):
                if ($mined24 < 70) $notify = true;
                break;
            case('high'):
                if ($mined24 < 100) $notify = true;
                break;
            case('unlimited'):
                if ($mined24 < 150) $notify = true;
                break;
            default:
                $notify = false;
                break;
        }

        return $notify;
    }
}
