<?php

namespace App\Http\Controllers\admin\dashboard;

use App\Contracts\PktServicesInterface;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use function Sentry\captureException;
use Exception;

class EventsController extends Controller
{
    /**
     * @var PktServicesInterface
     */
    public PktServicesInterface $pktServicesRepository;

    /**
     * @param PktServicesInterface $pktServicesRepository
     */
    public function __construct(PktServicesInterface $pktServicesRepository)
    {
        $this->pktServicesRepository = $pktServicesRepository;
    }

    /**
     * @param Request $request
     * @param $id
     * @return JsonResponse
     */
    public function reboot(Request $request, $id): JsonResponse
    {
        try {
            $service = $this->pktServicesRepository->getById($id);

            if ($service) {
                DB::beginTransaction();
                $service->events()->where('event', 'reboot')->delete();
                $this->createEvent($request->event, $service);
                DB::commit();

                return response()->json([
                    "success" => true
                ]);
            }
            return response()->json([
                "success" => false
            ], 404);
        } catch (Exception $exception) {
            DB::rollBack();
            captureException($exception);
            return response()->json([
                "success" => false
            ]);
        }
    }

    /**
     * @param Request $request
     * @param $id
     * @return JsonResponse
     */
    public function changeDeviceEnv(Request $request, $id): JsonResponse
    {
        try {
            $service = $this->pktServicesRepository->getById($id);
            if ($service) {
                $switchEnvEvent = $service->events()->where('event', 'switch_env')->first();

                DB::beginTransaction();
                if (!$switchEnvEvent) {
                    $this->createEvent($request->event, $service);
                }
                DB::commit();

                return response()->json([
                    "success" => true
                ]);
            }
            return response()->json([
                "success" => false
            ], 404);
        } catch (Exception $exception) {
            DB::rollBack();
            captureException($exception);
            return response()->json([
                "success" => false
            ]);
        }
    }

    /**
     * @param $event
     * @param $service
     */
    protected function createEvent($event, $service)
    {
        $user = auth()->user();
        $data = [
            "event"        => $event,
            "data"         => $user->ID,
            'pkteer_token' => $service->token
        ];

        $service->events()->create($data);
    }

    /**
     * @param Request $request
     * @param $id
     * @return JsonResponse
     */
    public function shutDown(Request $request, $id): JsonResponse
    {
        try {
            DB::beginTransaction();
            $service = $this->pktServicesRepository->getById($id);

            $hasEvent = $service->shutDownEvent()->first();
            if (!$hasEvent) {
                $this->createEvent($request->event, $service);
            }

            DB::commit();
            return response()->json([
                "success" => true,
            ]);
        } catch (Exception $exception) {
            DB::rollBack();
            captureException($exception);
            return response()->json([
                "success" => false,
            ]);
        }
    }
}
