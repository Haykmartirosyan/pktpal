<?php

namespace App\Jobs;

use App\Contracts\PktServicesInterface;
use App\Contracts\UsersInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use function Sentry\captureException;
use Exception;

class FactoryRackModeJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * @var
     */
    public $assignedDevices;

    /**
     * @var
     */
    public $userRepository;

    /**
     * @var
     */
    public $pktServicesRepository;

    /**
     * @param $assignedDevices
     */
    public function __construct($assignedDevices)
    {
        $this->assignedDevices = $assignedDevices;
    }

    /**
     * @param UsersInterface $userRepository
     * @param PktServicesInterface $pktServicesRepository
     */
    public function handle(UsersInterface $userRepository, PktServicesInterface $pktServicesRepository)
    {
        $this->userRepository = $userRepository;
        $this->pktServicesRepository = $pktServicesRepository;

        foreach ($this->assignedDevices as $assignedDevice) {
            $user = $this->userRepository->getById($assignedDevice['user_id']);
            $service = $this->pktServicesRepository->getByMacAddress($assignedDevice['mac_address']);
            $enterpriseClient = $this->checkEnterprise($user);
            if ($enterpriseClient['success'] && $enterpriseClient['enterpriseClient'] && $enterpriseClient['defaultService']) {
                $this->factoryRackModeEvent($service, $enterpriseClient['defaultService']);
            }
        }
    }

    /**
     * @param $user
     * @return array|false[]
     */
    protected function checkEnterprise($user)
    {
        try {
            $enterpriseClient = DB::table('wp_usermeta')->where('user_id', $user->ID)
                ->where('meta_key', 'enterprise_client')->where('meta_value', 1)->first();
            if ($enterpriseClient) {
                $defaultService = $user->pktServices()->where('type', 'node')->orderByDesc('created_at')->first();
                return [
                    'success'          => true,
                    'enterpriseClient' => true,
                    'defaultService'   => isset($defaultService) ? $defaultService : null
                ];
            } else {
                return [
                    'success'          => true,
                    "enterpriseClient" => false,
                    "defaultService"   => null,
                ];
            }
        } catch (Exception $exception) {
            captureException($exception);
            return [
                "success" => false,
            ];
        }
    }

    /**
     * @param $service
     * @param $defaultService
     */
    protected function factoryRackModeEvent($service, $defaultService)
    {
        $factoryRackModeEvent = $service->events()->where('event', 'factory_rack_mode')->first();
        if (!$factoryRackModeEvent) {
            $eventData = [
                'event'          => 'factory_rack_mode',
                'wallet_address' => $defaultService->wallet_address,
                'pkteer_token'   => $service->token
            ];
            $service->events()->create($eventData);
        }
    }
}
