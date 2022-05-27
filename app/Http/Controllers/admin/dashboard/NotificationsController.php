<?php

namespace App\Http\Controllers\admin\dashboard;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class NotificationsController extends Controller
{
    /**
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();

        $notifications = $user->unreadNotifications()->skip($request->skip)->take(5)->get();

        return response()->json([
            'notifications' => $notifications,
        ]);
    }

    /**
     * @return JsonResponse
     */
    public function unreadNotificationsCount(): JsonResponse
    {
        $user = auth()->user();

        return response()->json([
            'count' => $user->unreadNotifications->count(),
        ]);
    }

    /**
     * @param $id
     * @return JsonResponse
     */
    public function readNotification($id): JsonResponse
    {
        try {
            $user = auth()->user();
            DB::beginTransaction();
            $user->unreadNotifications()->where('id', $id)->update(['read_at' => Carbon::now()]);
            DB::commit();
            return response()->json([
                'success' => true,
            ]);
        } catch (Exception $exception) {
            DB::rollBack();
            return response()->json([
                'success' => true,
            ], 500);
        }
    }

    /**
     * @return JsonResponse
     */
    public function readAllNotifications(): JsonResponse
    {
        try {
            $user = auth()->user();
            DB::beginTransaction();
            $user->unreadNotifications->markAsRead();
            DB::commit();

            return response()->json([
                'success' => true,
            ]);

        } catch (Exception $exception) {
            DB::rollBack();
            return response()->json([
                'success' => false,
            ], 500);
        }
    }
}
