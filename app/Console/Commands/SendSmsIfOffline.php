<?php

namespace App\Console\Commands;

use App\Contracts\PktServicesInterface;
use App\Services\LogsService;
use App\Services\SmsService;
use Carbon\Carbon;
use Exception;
use Illuminate\Console\Command;
use function Sentry\captureException;

class SendSmsIfOffline extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'send:offline-sms';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send sms if cube is offline for more than 24 hours';

    /**
     * @var
     */
    protected $pktServicesRepository;

    /**
     * @var LogsService
     */
    protected $logsService;

    /**
     * @var
     */
    protected $smsService;

    /**
     * Create a new command instance.
     *
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
     * @return void
     */
    public function handle()
    {
        try {
            $services = $this->pktServicesRepository->getAllDevices(['statusReport', 'options']);
            $services->chunkById(20, function ($services) {
                foreach ($services as $service) {
                    if ($service->statusReport) {

                        $totalDuration = Carbon::now()->diffInMinutes($service->statusReport->updated_at);
                        if ($totalDuration == 1470) {
                            $optionSMS = $service->options()->where('option', 'turn_on_sms_notification')->first();

                            if ($optionSMS && $optionSMS->value == 1) {

                                $user = $service->user;
                                $text = "Your PKT Cube is offline for more than 24 hours. Please check your PKT Cube or contact PKT Pal support.";
                                if ($user) {
                                    $this->smsService->sendSMS($user, $text);
                                }
                            }
                        }
                    }
                }
            });
        } catch (Exception $exception) {
            captureException($exception);
        }
    }
}
