<?php

namespace App\Services;

use App\Contracts\RecommendedPoolsInterface;
use Carbon\Carbon;

class RecommendedPoolsServices
{
    /**
     * @var RecommendedPoolsInterface
     */
    protected RecommendedPoolsInterface $recommendedPoolsRepository;

    /**
     * @param RecommendedPoolsInterface $recommendedPoolsRepository
     */
    public function __construct(RecommendedPoolsInterface $recommendedPoolsRepository)
    {
        $this->recommendedPoolsRepository = $recommendedPoolsRepository;
    }

    /**
     * @param $service
     * @return array
     */
    public function setRecommendedPools($service): array
    {
        $data = [];
        $option = $service->options()->where('option', 'recommended_pool')->first();
        $pools = [
            "http://www.pkt.world",
            "http://pool.pktpool.io"
        ];

        $level = 'high';
        $scheduleDays = $service->scheduleDays;

        if ($scheduleDays->isEmpty()) {
            if ($option) {
                $pools = $this->setPools($option->value);
                $level = $option->value;
            }
        } else {
            $weekMap = [
                0 => 'Sunday',
                1 => 'Monday',
                2 => 'Tuesday',
                3 => 'Wednesday',
                4 => 'Thursday',
                5 => 'Friday',
                6 => 'Saturday',
            ];
            $dayOfTheWeek = Carbon::now()->dayOfWeek;
            $weekday = $weekMap[$dayOfTheWeek];

            $selectedWeekday = $service->scheduleDays()->where('weekday', $weekday)->get();
            if (!$selectedWeekday->isEmpty()) {
                $from = Carbon::now()->startOfHour()->toTimeString();
                $to = Carbon::now()->startOfHour()->addHour()->toTimeString();
                $selectedHour = $selectedWeekday->where('from', $from)->where('to', $to)->first();

                if ($selectedHour) {
                    $pools = $this->setPools($selectedHour->mining_level);
                    $level = $selectedHour->mining_level;
                } else {
                    $lastSelectedTime = $selectedWeekday->sortByDesc('from')->where('from', '<', $from)->first();
                    if (!$lastSelectedTime) {
                        $lastSelectedTime = $selectedWeekday->sortByDesc('from')->first();
                    }

                    if ($lastSelectedTime) {
                        $pools = $this->setPools($lastSelectedTime->mining_level);
                        $level = $lastSelectedTime->mining_level;
                    }
                }
            } else {
                $lastSelectedDay = $this->getLastScheduledDay($service, $weekMap, $dayOfTheWeek);
                $pools = $this->setPools($lastSelectedDay->mining_level);
                $level = $lastSelectedDay->mining_level;
            }
        }
        $data['pools'] = $pools;
        $data['level'] = $level;
        $maxMB = $option ? (int)$option->value : 0;
        $data['max_mbps'] = $maxMB;
        return $data;
    }

    /**
     * @param $service
     * @param $weekMap
     * @param $dayOfTheWeek
     * @return mixed
     */
    protected function getLastScheduledDay($service, $weekMap, $dayOfTheWeek)
    {
        $day = $weekMap[$dayOfTheWeek];
        $selectedWeekday = $service->scheduleDays()->where('weekday', $day)->orderBy('to', 'desc')->first();

        if ($selectedWeekday) {
            return $selectedWeekday;
        } else {
            $dayOfTheWeek = $dayOfTheWeek == 0 ? 6 : $dayOfTheWeek - 1;
            return $this->getLastScheduledDay($service, $weekMap, $dayOfTheWeek);
        }
    }

    /**
     * @param $level
     * @return array|mixed
     */
    protected function setPools($level)
    {
        $pools = [];
        $pool = $this->recommendedPoolsRepository->getByParams($level);
        if ($pool) {
            $pools = json_decode($pool->pools);
        }

        return $pools;
    }

}
