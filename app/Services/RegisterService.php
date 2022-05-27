<?php

namespace App\Services;

use App\Contracts\PktServicesInterface;
use Illuminate\Support\Facades\DB;
use function Sentry\captureException;
use Exception;

class RegisterService
{
    /**
     * @var PktServicesInterface
     */
    protected PktServicesInterface $pktServicesRepository;

    /**
     * @var SmsService
     */
    protected SmsService $smsService;

    /**
     * @param PktServicesInterface $pktServicesRepository
     * @param SmsService $smsService
     */
    public function __construct(PktServicesInterface $pktServicesRepository, SmsService $smsService)
    {
        $this->pktServicesRepository = $pktServicesRepository;
        $this->smsService = $smsService;
    }

    /**
     * @param $request
     * @param $service
     * @return array
     */
    public function registerDevice($request, $service): array
    {
        try {
            $status = 200;

            if ($service) {

                $user = $service->user;
                if ($user) {
                    $this->sendSMS($user);
                }

                if (!$service->token || $service->token !== $request->header('pkteer-token')) {
                    $status = $service->token == $request->header('pkteer-token') ? 200 : 409;
                    DB::beginTransaction();
                    $service->update(['token' => $request->header('pkteer-token')]);
                    DB::commit();
                }
                return [
                    "success" => true,
                    "status"  => $status,
                    "service" => $service
                ];
            }

            $data = [
                'mac_address' => $request->header('mac-address'),
                'token'       => $request->header('pkteer-token'),
            ];

            DB::beginTransaction();
            $service = $this->pktServicesRepository->create($data);
            DB::commit();

            return [
                "success" => true,
                "status"  => $status,
                "service" => $service
            ];

        } catch (Exception $exception) {
            captureException($exception);
            DB::rollBack();
            return [
                "success" => false,
                "status"  => 500
            ];
        }

    }

    /**
     * @param $user
     */
    protected function sendSMS($user)
    {
        if (!$user->registerSmsNotification()->first()) {
            $user->registerSmsNotification()->create(['type' => 'register_device']);
            $text = 'Congratulations! Your PKT Cube has been turned on. To follow the progress of your device please log in here '
                . config('app.url') . '/login?uid=' . $user->ID;
            $this->smsService->sendSMS($user, $text);
        }
    }

}
