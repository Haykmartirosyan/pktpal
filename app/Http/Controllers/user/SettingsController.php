<?php

namespace App\Http\Controllers\user;

use App\Contracts\PktServicesInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\ScheduleDaysRequest;
use App\Services\LogsService;
use App\Services\RecommendedPoolsServices;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use function Sentry\captureException;

class SettingsController extends Controller
{
    /**
     * @var PktServicesInterface
     */
    protected PktServicesInterface $pktServicesRepository;
    /**
     * @var
     */
    protected LogsService $logsService;

    /**
     * @var
     */
    protected RecommendedPoolsServices $recommendedPoolsServices;

    /**
     * @param PktServicesInterface $pktServicesRepository
     * @param LogsService $logsService
     * @param RecommendedPoolsServices $recommendedPoolsServices
     */
    public function __construct(PktServicesInterface $pktServicesRepository, LogsService $logsService, RecommendedPoolsServices $recommendedPoolsServices)
    {
        $this->pktServicesRepository = $pktServicesRepository;
        $this->logsService = $logsService;
        $this->recommendedPoolsServices = $recommendedPoolsServices;
    }

    /**
     * @param $id
     * @param Request $request
     * @return JsonResponse
     */
    public function index($id, Request $request): JsonResponse
    {
        $service = $this->pktServicesRepository->getById($id);
        $user = auth()->user();
        if ($service && $service->user_id == $user->ID || isset($request->fromAdmin)) {
            $serviceOptions = $service->options;
            $data = [];
            $data['options'] = [];

            if ($serviceOptions) {
                $scheduled = $service->scheduleDays;
                $activeDays = [];
                foreach ($scheduled as $day) {
                    if ($request->timezone || isset($request->fromAdmin)) {
                        $from = Carbon::createFromFormat('H:i:s', $day['from'], 'UTC')->setTimezone($request->timezone)->toTimeString();
                        $to = Carbon::createFromFormat('H:i:s', $day['to'], 'UTC')->setTimezone($request->timezone)->toTimeString();
                        $day->from = $from;
                        $day->to = $to;

                        $activeDays[] = $day;
                    }
                }
                $sms = $serviceOptions->where('option', 'turn_on_sms_notification')->first();
                $recommendedPool = $this->recommendedPoolsServices->setRecommendedPools($service);
                if ($sms) {
                    $data['options']['sms'] = $sms;
                }
                if ($recommendedPool) {
                    $data['options']['recommendedPool'] = $recommendedPool['level'];
                }

                if ($scheduled) {
                    $data['days'] = $activeDays;
                }
            }
            return response()->json([
                'data' => $data
            ]);
        }
        return response()->json([
            'success' => false
        ], 404);
    }

    /**
     * @param ScheduleDaysRequest $request
     * @param $id
     * @return JsonResponse
     */
    public function create(ScheduleDaysRequest $request, $id): JsonResponse
    {
        try {
            $service = $this->pktServicesRepository->getById($id);
            if ($service) {
                $days = $request->days;
                DB::beginTransaction();
                $service->scheduleDays()->delete();
                $data = [];
                $logData = [];

                $levelExist = $this->levelKeyExists($days, 'mining_level');

                if ($levelExist) {
                    foreach ($days as $day) {
                        if (!empty($day['hours'])) {
                            foreach ($day['hours'] as $hour) {
                                if (isset($hour['mining_level'])) {
                                    $from = Carbon::createFromFormat('H:i', $hour['from'], $request->timezone)->setTimezone('UTC')->toTimeString();
                                    $to = Carbon::createFromFormat('H:i', $hour['to'], $request->timezone)->setTimezone('UTC')->toTimeString();
                                    $data[] = [
                                        "weekday"      => $day['weekday'],
                                        "mining_level" => $hour['mining_level'],
                                        "from"         => $from,
                                        "to"           => $to
                                    ];
                                    $log = $day['weekday'] . ' ' . $from . ' - ' . ucfirst($hour['mining_level']);
                                    $logData[] = $log;
                                }
                            }
                        }
                    }
                    $service->scheduleDays()->createMany(array_unique($data, SORT_REGULAR));
                }

                $text = !empty($logData) ?
                    'Settings changed -> ' . (json_encode($logData)) . ' -> ' . Carbon::now()->toTimeString() :
                    'Settings have been discarded -> ' . Carbon::now()->toTimeString();
                $this->logsService->addDeviceLog($service, $text, null, auth()->id());
                DB::commit();
                return response()->json([
                    'success' => true
                ]);
            }
            return response()->json([
                "success" => false,
            ], 404);
        } catch (Exception $exception) {
            DB::rollBack();
            captureException($exception);
            return response()->json([
                "success" => false,
            ], 500);
        }
    }

    /**
     * @param ScheduleDaysRequest $request
     * @param $id
     * @return JsonResponse
     */
    public function update(ScheduleDaysRequest $request, $id): JsonResponse
    {
        try {
            $service = $this->pktServicesRepository->getById($id);
            if ($service) {
                DB::beginTransaction();
                $this->setDeviceOptions($service, $request);
                $scheduleDays = $service->scheduleDays;
                if (!$scheduleDays->isEmpty()) {
                    $service->scheduleDays()->update(['mining_level' => $request->options['recommended_pool']]);
                }
                $pool = $this->setPools($request->options['recommended_pool']);
                $text = 'Settings changed -> ' . $pool . ' -> ' . Carbon::now()->toTimeString();
                $this->logsService->addDeviceLog($service, $text, null, auth()->id());
                DB::commit();
                return response()->json([
                    'success' => true
                ]);
            }
            return response()->json([
                'success' => false,
            ], 404);
        } catch (Exception $exception) {
            DB::rollBack();
            captureException($exception);
            return response()->json([
                "success" => false,
            ], 500);
        }
    }

    /**
     * @param Request $request
     * @param $id
     * @return JsonResponse
     */
    public function updateSMSOption(Request $request, $id): JsonResponse
    {
        try {
            $service = $this->pktServicesRepository->getById($id);
            DB::beginTransaction();
            $this->setDeviceOptions($service, $request);
            DB::commit();
            return response()->json([
                'success' => true
            ]);
        } catch (Exception $exception) {
            DB::rollBack();
            return response()->json([
                'success' => false
            ], 500);
        }

    }


    /**
     * @param $level
     * @return array
     */
    protected function setPools($level)
    {
        $pool = [];
        switch ($level) {
            case 'high':
                $pool = 'High';
                break;
            case 'medium':
                $pool = 'Medium';
                break;
            case 'low':
                $pool = 'Low';
                break;
            case 'off':
                $pool = 'Off';
                break;
            case 'unlimited':
                $pool = 'Unlimited';
                break;
            case 'experimental':
                $pool = 'Experimental';
                break;
        }

        return $pool;
    }

    /**
     * @param $service
     * @param $data
     */
    protected function setDeviceOptions($service, $data)
    {
        $options = $service->options;
        $optionsData = $data['options'];
        foreach ($optionsData as $optionData => $value) {
            $option = $options->where('option', $optionData)->first();
            if ($option) {
                $option->update([
                    'option' => $optionData,
                    'value'  => $value
                ]);
            } else {
                $service->options()->create([
                    'option' => $optionData,
                    'value'  => $value
                ]);
            }
        }
    }

    /**
     * @param $id
     * @return JsonResponse
     */
    public function delete($id): JsonResponse
    {
        try {
            $service = $this->pktServicesRepository->getById($id);
            if ($service) {
                DB::beginTransaction();
                $service->scheduleDays()->delete();
                $text = 'Settings have been discarded -> ' . Carbon::now()->toTimeString();
                $this->logsService->addDeviceLog($service, $text, null, auth()->id());
                DB::commit();
                return response()->json([
                    'success' => true,
                    'reset'   => false,
                ]);
            }
            return response()->json([
                'success' => false,
            ], 404);
        } catch (Exception $exception) {
            captureException($exception);
            DB::rollBack();
            return response()->json([
                "success" => false,
            ], 500);
        }
    }

    /**
     * @param Request $request
     * @return mixed
     */
    public function generateSchedule(Request $request)
    {
        $weekdays = $request->weekdays;

        $levelExist = $this->levelKeyExists($weekdays, 'mining_level');
        foreach ($weekdays as $key => &$weekday) {
            if ($levelExist) {
                for ($i = 0; $i < count($weekday['hours']); $i++) {
                    if (isset($weekday['hours'][$i]['mining_level'])) {
                        continue;
                    } else {
                        $weekday['hours'][$i]['mining_level'] = $this->detectPreviousLevel($weekdays, $i, $key);
                    }
                }
            } else {
                $weekday['hours'] = [];
            }

        }

        return $weekdays;
    }

    /**
     * @param array $arr
     * @param $key
     * @return bool
     */
    public function levelKeyExists(array $arr, $key): bool
    {
        if (array_key_exists($key, $arr)) {
            return true;
        }

        foreach ($arr as $element) {
            if (is_array($element)) {
                if ($this->levelKeyExists($element, $key)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * @param $weekdays
     * @param $hourIndex
     * @param $dayIndex
     * @return mixed
     */
    public function detectPreviousLevel($weekdays, $hourIndex, $dayIndex)
    {
        if ($hourIndex != 0) {
            $hourIndex = $hourIndex - 1;
        } else {
            $hourIndex = 23;
            $dayIndex = $dayIndex == 0 ? 6 : $dayIndex - 1;
        }

        if (isset($weekdays[$dayIndex]['hours'][$hourIndex]['mining_level'])) {
            return $weekdays[$dayIndex]['hours'][$hourIndex]['mining_level'];
        } else {
            return $this->detectPreviousLevel($weekdays, $hourIndex, $dayIndex);
        }

    }
}
