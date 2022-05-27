<?php

namespace App\Http\Controllers\admin\dashboard;

use App\Contracts\PermitsNoTokenInterface;
use App\Contracts\RecommendedPoolsInterface;
use App\Contracts\RecommendedPoolsRatesInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\RecommendedPoolsRequest;
use App\Http\Requests\RecommendedPoolsStatisticsRequest;
use App\Http\Resources\PermitsNoTokenCollection;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Exception;
use Tinderbox\Clickhouse\Exceptions\ClientException;
use function Sentry\captureException;

class SettingsController extends Controller
{
    /**
     * @var PermitsNoTokenInterface
     */
    protected PermitsNoTokenInterface $permitsNoTokenRepository;

    /**
     * @var RecommendedPoolsInterface
     */
    protected RecommendedPoolsInterface $recommendedPoolsRepository;

    /**
     * @var RecommendedPoolsRatesInterface
     */
    protected RecommendedPoolsRatesInterface $recommendedPoolsRatesRepository;

    /**
     * @param PermitsNoTokenInterface $permitsNoTokenRepository
     * @param RecommendedPoolsInterface $recommendedPoolsRepository
     * @param RecommendedPoolsRatesInterface $recommendedPoolsRatesRepository
     */
    public function __construct(PermitsNoTokenInterface        $permitsNoTokenRepository,
                                RecommendedPoolsInterface      $recommendedPoolsRepository,
                                RecommendedPoolsRatesInterface $recommendedPoolsRatesRepository)
    {
        $this->permitsNoTokenRepository = $permitsNoTokenRepository;
        $this->recommendedPoolsRepository = $recommendedPoolsRepository;
        $this->recommendedPoolsRatesRepository = $recommendedPoolsRatesRepository;
    }

    /**
     * @param Request $request
     * @return PermitsNoTokenCollection
     * @throws ClientException
     */
    public function permitsNoTokenAlerts(Request $request): PermitsNoTokenCollection
    {
        $permitsNoTokens = $this->permitsNoTokenRepository->getPermitNoTokenAlertsAll($request->skip);

        return new PermitsNoTokenCollection($permitsNoTokens);
    }

    /**
     * @return JsonResponse
     */
    public function getRecommendedPools(): JsonResponse
    {
        $pools = $this->recommendedPoolsRepository->getLevelPools();
        $allPools = $this->recommendedPoolsRepository->getByParams('all_pools');
        return response()->json([
            'pools'    => $pools,
            'allPools' => $allPools
        ]);
    }

    /**
     * @param RecommendedPoolsRequest $request
     * @return JsonResponse
     */
    public function setRecommendedPools(RecommendedPoolsRequest $request): JsonResponse
    {
        try {
            $allPools = json_encode($request->allPools['pools']);
            $pools = $request->pools;
            $cases = [];
            $levels = [];
            $params = [];

            foreach ($pools as $pool) {
                $cases[] = "WHEN '{$pool['level']}' then ?";
                $params[] = json_encode($pool['pools']);
                $level = $pool['level'];
                $levels[] = "'$level'";
            }

            $levels = implode(', ', $levels);
            $cases = implode(' ', $cases);
            $params[] = Carbon::now();
            DB::beginTransaction();

            DB::update("UPDATE `recommended_pools` SET `pools` = CASE `level` {$cases} END, `updated_at` = ? WHERE `level` in ({$levels})", $params);

            $this->recommendedPoolsRepository->updateByParams('all_pools', ['pools' => $allPools]);
            DB::commit();
            return response()->json([
                'success' => true
            ]);
        } catch (Exception $exception) {
            DB::rollBack();
            captureException($exception);
            return response()->json([
                'success' => false
            ], 500);
        }
    }

    /**
     * @return JsonResponse
     */
    public function getRecommendedPoolsRates(): JsonResponse
    {
        $date = Carbon::now()->subDays(7);
        $recommendedPoolsRates = $this->recommendedPoolsRatesRepository->getByDate($date);
        return response()->json([
            'recommendedPoolsRates' => $recommendedPoolsRates
        ]);
    }

    /**
     * @param RecommendedPoolsStatisticsRequest $request
     * @return JsonResponse
     */
    public function setRecommendedPoolsStatistics(RecommendedPoolsStatisticsRequest $request): JsonResponse
    {
        try {
            $pools = $request->all();
            $cases = [];
            $levels = [];
            $params = [];

            foreach ($pools as $pool) {
                $cases[] = "WHEN '{$pool['level']}' then ?";
                $params[] = json_encode($pool['pools']);
                $level = $pool['level'];
                $levels[] = "'$level'";
            }

            $levels = implode(', ', $levels);
            $cases = implode(' ', $cases);
            $params[] = Carbon::now();
            DB::beginTransaction();

            DB::update("UPDATE `recommended_pools` SET `pools` = CASE `level` {$cases} END, `updated_at` = ? WHERE `level` in ({$levels})", $params);

            DB::commit();
            return response()->json([
                'success' => true
            ]);
        } catch (Exception $exception) {
            DB::rollBack();
            captureException($exception);
            return response()->json([
                'success' => false
            ], 500);
        }
    }
}
