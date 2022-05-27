<?php

namespace App\Jobs;

use App\Services\MacAddressService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class AssignOrderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * @var
     */
    public $assignedDevices;
    /**
     * @var
     */
    public $macAddressService;

    /**
     * @param $assignedDevices
     */
    public function __construct($assignedDevices)
    {
        $this->assignedDevices = $assignedDevices;
    }

    /**
     * @param MacAddressService $macAddressService
     */
    public function handle(MacAddressService $macAddressService)
    {
        $this->macAddressService = $macAddressService;
        foreach ($this->assignedDevices as $assignedDevice) {
            $this->macAddressService->assignToSpecificOrder($assignedDevice);
            $isLastNumber = $assignedDevice['qty_assigned'] >= $assignedDevice['quantity'];
            $this->macAddressService->changeStatus($isLastNumber, $assignedDevice['qty_assigned'], $assignedDevice['order_id']);
        }

        $filteredOrder = array_values(array_combine(array_map(function ($i) {
            return $i['order_id'];
        }, $this->assignedDevices), $this->assignedDevices));

        foreach ($filteredOrder as $item) {
            $postId = $item['order_id'];

            $unAssignedQuantityQuery = DB::table('wp_woocommerce_order_itemmeta')
                ->join('wp_woocommerce_order_items', function ($join) use ($postId) {
                    $join->on('wp_woocommerce_order_items.order_item_id', 'wp_woocommerce_order_itemmeta.order_item_id')
                        ->where(function ($query) use ($postId) {
                            $query->where('wp_woocommerce_order_items.order_id', $postId);
                        });
                })->where('meta_key', '_qty_unassigned')->first();

            if ($unAssignedQuantityQuery) {
                $unAssignedQuantity = (int)$unAssignedQuantityQuery->meta_value ? ((int)$unAssignedQuantityQuery->meta_value - $item['qty_assigned']) :
                    $item['quantity'] - $item['qty_assigned'];

                DB::table('wp_woocommerce_order_itemmeta')
                    ->where('meta_id', $unAssignedQuantityQuery->meta_id)
                    ->update(['meta_value' => $unAssignedQuantity]);

            } else {
                $unAssignedQuantityQueryCreate = DB::table('wp_woocommerce_order_itemmeta')
                    ->join('wp_woocommerce_order_items', function ($join) use ($postId) {
                        $join->on('wp_woocommerce_order_items.order_item_id', 'wp_woocommerce_order_itemmeta.order_item_id')
                            ->where(function ($query) use ($postId) {
                                $query->where('wp_woocommerce_order_items.order_id', $postId);
                            });
                    })->first();

                if ($unAssignedQuantityQueryCreate) {

                    $unAssignedQuantity = $item['quantity'] - $item['qty_assigned'];

                    $data = [
                        'order_item_id' => $unAssignedQuantityQueryCreate->order_item_id,
                        'meta_key'      => '_qty_unassigned',
                        'meta_value'    => $unAssignedQuantity
                    ];

                    DB::table('wp_woocommerce_order_itemmeta')->insert($data);
                }
            }
        }

    }
}
