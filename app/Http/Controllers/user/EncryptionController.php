<?php

namespace App\Http\Controllers\user;

use App\Contracts\PktServicesInterface;
use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceEncryptionsCollection;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Exception;
use function Sentry\captureException;

class EncryptionController extends Controller
{
    /**
     * @var PktServicesInterface
     */
    protected PktServicesInterface $pktServicesRepository;

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
     * @return ServiceEncryptionsCollection|JsonResponse
     */
    public function getEncryptionsData(Request $request, $id)
    {
        try {
            $user = auth()->user();
            $service = $request->fromPage === 'user' ? $user->pktServices()->where('id', $id)->first() : $this->pktServicesRepository->getById($id);
            if ($service) {
                $localDate = Carbon::parse($request->period)->setTimezone($request->timezone)->toDateTimeString();
                $utcDate = Carbon::parse($request->period)->toDateTimeString();
                $offset = (Carbon::parse($utcDate)->timestamp - Carbon::parse($localDate)->timestamp) / 60;
                $from = Carbon::parse($request->period)->utcOffset($offset);
                $to = Carbon::parse(Carbon::parse($request->period)->addHours(24));

                if ($request->period == Carbon::now()->format('Y-m-d H:i:s') || Carbon::parse($request->period)->format('Y-m-d') == Carbon::now()->format('Y-m-d')) {
                    $encryptions = $service->encryptions()->where('created_at', '>=', Carbon::now()->subDay())->get();
                } else {
                    $from = Carbon::createFromFormat('Y-m-d H:i:s', $from, 'UTC')->toDateTimeString();
                    $to = Carbon::createFromFormat('Y-m-d H:i:s', $to, 'UTC')->toDateTimeString();
                    $encryptions = $service->encryptions()->where('created_at', '>=', $from)
                        ->where('created_at', '<', $to)
                        ->get();
                }

                return new ServiceEncryptionsCollection($encryptions);
            }

            return response()->json([
                "success" => false
            ], 404);
        } catch (Exception $exception) {
            captureException($exception);
            return response()->json([
                "success" => false
            ], 500);
        }
    }

    /**
     * @param Request $request
     * @param $id
     * @return JsonResponse
     */
    public function getOfflineLogs(Request $request, $id): JsonResponse
    {
        $user = auth()->user();
        $service = $user->pktServices()->where('id', $id)->first();
        if ($service) {
            $logs = $service->systemLogs()->where('type', 'offline')
                ->orderBy('created_at', 'desc')
                ->skip($request->skip)
                ->take(5)->get();
            return response()->json([
                "data" => $logs
            ]);
        }

        return response()->json([
            "success" => false
        ], 404);

    }
}
