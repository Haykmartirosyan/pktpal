<?php

namespace App\Jobs;

use App\Contracts\PktServicesInterface;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class DevicesAutoRebootJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * @var PktServicesInterface
     */
    protected $pktServicesRepository;

    /**
     * Create a new job instance.
     *
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     *
     * @param PktServicesInterface $pktServicesRepository
     * @return void
     */
    public function handle(PktServicesInterface $pktServicesRepository)
    {
        $this->pktServicesRepository = $pktServicesRepository;
        $services = $this->pktServicesRepository->getAllDevices(['statusReport']);

        $now = Carbon::now();

        $services->chunkById(20, function ($services) use ($now) {
            foreach ($services as $service) {
                if ($service->statusReport) {
                    if ($service->id != 28) {
                        RebootDeviceJob::dispatch($service)->delay($now->addMinutes(5));
                    }
                }
            }
        });
    }
}
