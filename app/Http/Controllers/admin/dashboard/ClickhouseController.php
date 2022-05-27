<?php

namespace App\Http\Controllers\admin\dashboard;

use App\Http\Controllers\Controller;
use App\Http\Resources\ClickhouseLogsCollection;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ClickhouseController extends Controller
{
    /**
     * @param Request $request
     * @return ClickhouseLogsCollection|JsonResponse
     */
    public function getLogs(Request $request)
    {
        try {
            $query = $request->clickhouseQuery;

            $result = DB::connection('bavix::clickhouse')->select(DB::raw($query));

            return new ClickhouseLogsCollection($result);

        } catch (Exception $exception) {
            return response()->json([
                'error' => $exception->getMessage()
            ], 500);
        }

    }
}
