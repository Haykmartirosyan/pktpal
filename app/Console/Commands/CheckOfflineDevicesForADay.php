<?php

namespace App\Console\Commands;

use App\Contracts\OfflineDevicesCountInterface;
use App\Contracts\PktServicesInterface;
use Carbon\Carbon;
use Illuminate\Console\Command;


class CheckOfflineDevicesForADay extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'check-offline:cubes-count';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * @var PktServicesInterface
     */
    protected $pktServicesRepository;

    /**
     * @var OfflineDevicesCountInterface
     */
    protected $offlineDevicesCountRepository;

    /**
     * @param PktServicesInterface $pktServicesRepository
     * @param OfflineDevicesCountInterface $offlineDevicesCountRepository
     */
    public function __construct(PktServicesInterface $pktServicesRepository, OfflineDevicesCountInterface $offlineDevicesCountRepository)
    {
        parent::__construct();
        $this->pktServicesRepository = $pktServicesRepository;
        $this->offlineDevicesCountRepository = $offlineDevicesCountRepository;
    }

    /**
     * @return bool
     */
    public function handle()
    {
        $services = $this->pktServicesRepository->getOfflineDevices();
        $count = 0;
        $services->chunkById(20, function ($services) use (&$count) {
            foreach ($services as $service) {
                $lastOfflineLog = $service->lastOfflineLog()->first();
                if ($lastOfflineLog) {
                    $result = Carbon::now()->diffInHours($lastOfflineLog->created_at);
                    if ($result >= 24) {
                        $count++;
                    }
                }
            }
        });

        $data = [
            'time'  => Carbon::now()->startOfHour(),
            'count' => $count
        ];
        $this->offlineDevicesCountRepository->create($data);

        $deleteData = $this->offlineDevicesCountRepository->getFirstData();
        if ($deleteData) {
            $difference = Carbon::now()->startOfHour()->diffInHours($deleteData->time);
            if ($difference >= 24) {
                $deleteData->delete();
            }
        }
        return true;
    }
}
