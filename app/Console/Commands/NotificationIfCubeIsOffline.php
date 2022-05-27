<?php

namespace App\Console\Commands;

use App\Contracts\PktServicesInterface;
use Carbon\Carbon;
use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Sentry\Severity;
use Sentry\State\Scope;
use function Sentry\captureException;
use function Sentry\captureMessage;
use function Sentry\withScope;

class NotificationIfCubeIsOffline extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notify:when-offline';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = "Send a notification in case if the cube won't come online for more than 30min";

    /**
     * @var PktServicesInterface
     */
    protected $pktServicesRepository;

    /**
     * @param PktServicesInterface $pktServicesRepository
     */
    public function __construct(PktServicesInterface $pktServicesRepository)
    {
        parent::__construct();
        $this->pktServicesRepository = $pktServicesRepository;
    }

    /**
     * Execute the console command.
     *
     * @return void
     */
    public function handle()
    {
        try {
            $services = $this->pktServicesRepository->getAllDevices(['statusReport']);
            $services->chunkById(20, function ($services) {
                foreach ($services as $service) {
                    if (!$service->statusReport) {
                        $totalDuration = Carbon::now()->diffInMinutes($service->created_at);
                        if ($totalDuration == 33) {
                            $text = $service->mac_address . " won't come online for more than 30min";
                            $data = [
                                'text' => $text,
                            ];
                            $service->alerts()->create($data);

                            withScope(function (Scope $scope) use ($text) {
                                $scope->setLevel(Severity::info());
                                captureMessage($text);
                            });

                            if (app()->environment() == 'production') {
                                Log::channel('mattermost')->info($text);
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
