<?php

namespace App\Console\Commands;

use App\Contracts\PktServicesInterface;
use App\Services\LogsService;
use App\Services\SmsService;
use Carbon\Carbon;
use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use function Sentry\captureException;

class CheckDeviceStatus extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'check:status';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check and update device online status';

    /**
     * @var PktServicesInterface
     */
    protected $pktServicesRepository;

    /**
     * @var LogsService
     */
    protected $logsService;

    /**
     * @var SmsService
     */
    protected $smsService;

    /**
     * CheckDeviceStatus constructor.
     * @param PktServicesInterface $pktServicesRepository
     * @param LogsService $logsService
     * @param SmsService $smsService
     */
    public function __construct(PktServicesInterface $pktServicesRepository, LogsService $logsService, SmsService $smsService)
    {
        parent::__construct();
        $this->pktServicesRepository = $pktServicesRepository;
        $this->logsService = $logsService;
        $this->smsService = $smsService;
    }

    /**
     * Execute the console command.
     *
     */
    public function handle()
    {
        try {
            $services = $this->pktServicesRepository->getAllDevices(['statusReport']);
            $services->chunkById(20, function ($services) {
                foreach ($services as $service) {
                    if ($service->statusReport) {

                        $totalDuration = Carbon::now()->diffInMinutes($service->statusReport->updated_at);

                        if ($totalDuration > 0) {
                            if ($service->online) {
                                DB::beginTransaction();
                                $text = 'Cube offline (pending) -> ' . Carbon::now()->toTimeString();
                                $data = [
                                    'text' => $text,
                                    'type' => 'offline',
                                ];
                                $service->systemLogs()->create($data);
                                DB::commit();
                                $this->pktServicesRepository->update($service->id, ['online' => 0]);
                            }
                        } else {
                            if (!$service->online) {
                                DB::beginTransaction();
                                $text = 'Cube online -> ' . Carbon::now()->toTimeString();
                                $data = [
                                    'text' => $text,
                                    'type' => 'online',
                                ];
                                $service->systemLogs()->create($data);
                                DB::commit();
                                $this->pktServicesRepository->update($service->id, ['online' => 1]);
                            }
                        }
                    }
                }
            });
        } catch (Exception $exception) {
            captureException($exception);
            DB::rollBack();
        }

    }
}
