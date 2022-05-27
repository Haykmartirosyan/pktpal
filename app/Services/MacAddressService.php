<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class MacAddressService
{
    /**
     * @param $user
     * @param $service
     */
    public function assignToOrder($user, $service)
    {
        $postMeta = DB::table('wp_postmeta')
            ->join('wp_posts', 'wp_posts.ID', 'wp_postmeta.post_id')
            ->where('meta_key', '_billing_email')
            ->where('meta_value', $user->user_email)
            ->where((function ($query) {
                $query->where('wp_posts.post_status', 'wc-processing')
                    ->orWhere('wp_posts.post_status', 'wc-spec-assigned');
            }))
            ->first();
        if ($postMeta) {
            $postId = $postMeta->post_id;
            $quantityQuery = DB::table('wp_woocommerce_order_itemmeta')
                ->join('wp_woocommerce_order_items', function ($join) use ($postId) {
                    $join->on('wp_woocommerce_order_items.order_item_id', 'wp_woocommerce_order_itemmeta.order_item_id')
                        ->where(function ($query) use ($postId) {
                            $query->where('wp_woocommerce_order_items.order_id', $postId);
                        });
                })
                ->where('meta_key', '_qty')->first();
            if ($quantityQuery) {
                $quantity = $quantityQuery->meta_value;
                $macNumberOrdered = $this->assignProcess($postId, $service->mac_address);
                $isLastNumber = $macNumberOrdered == $quantity;
                $this->changeStatus($isLastNumber, $macNumberOrdered, $postId);
            }
        }
    }

    /**
     * @param $assignedDevice
     * @return int
     */
    public function assignToSpecificOrder($assignedDevice): int
    {
        return $this->assignProcess($assignedDevice['order_id'], $assignedDevice['mac_address'], $assignedDevice['quantity']);
    }

    /**
     * @param $postId
     * @param $macAddress
     * @param null $qty
     * @return int
     */
    protected function assignProcess($postId, $macAddress, $qty = null): int
    {
        DB::beginTransaction();
        $macAddressFiled = DB::table('wp_postmeta')
            ->where('meta_key', 'like', '%_mac_addresses_%')
            ->where('post_id', $postId)
            ->orderBy('meta_id', 'desc')
            ->first();

        if ($macAddressFiled) {
            if ($macAddressFiled->meta_value == '' || $macAddressFiled->meta_value == null) {
                $this->updateMacAddress($macAddressFiled->meta_id, $postId, $macAddress);
                DB::commit();
            } else {
                if ($qty) {
                    $ordersCount = $qty;
                } else {
                    $ordersCount = DB::table('wp_woocommerce_order_items')
                        ->where('order_id', $postId)->count();
                }

                if ($ordersCount > 1) {
                    $macAddressOrdered = DB::table('wp_postmeta')
                        ->where('meta_key', 'like', '%_mac_addresses_%')
                        ->where('post_id', $postId)
                        ->orderBy('meta_id', 'desc')
                        ->first();

                    $macNumberOrdered = (int)preg_replace('/[^0-9.]+/', '', $macAddressOrdered->meta_key);
                    $macNumber = (int)preg_replace('/[^0-9.]+/', '', $macAddressFiled->meta_key);
                    if ($macNumberOrdered < $ordersCount) {
                        $this->createMacAddress($macNumber, $macAddress, $postId);
                        DB::commit();
                    } else {
                        $this->updateMacAddress($macAddressFiled->meta_id, $postId, $macAddress);
                        DB::commit();
                    }
                } else {
                    $this->updateMacAddress($macAddressFiled->meta_id, $postId, $macAddress);
                    DB::commit();
                }
            }
        } else {
            $this->createMacAddress(0, $macAddress, $postId);
            DB::commit();
        }
        return isset($macNumberOrdered) ? $macNumberOrdered : 1;
    }

    /**
     * @param $macNumber
     * @param $macAddress
     * @param $postId
     * @return bool
     */
    protected function createMacAddress($macNumber, $macAddress, $postId): bool
    {
        return DB::table('wp_postmeta')->insert([
            'meta_key'   => '_mac_addresses_' . ($macNumber + 1),
            'meta_value' => $macAddress,
            'post_id'    => $postId
        ]);
    }

    /**
     * @param $metaId
     * @param $postId
     * @param $macAddress
     * @return int
     */
    protected function updateMacAddress($metaId, $postId, $macAddress): int
    {
        return DB::table('wp_postmeta')
            ->where('meta_id', $metaId)
            ->where('post_id', $postId)
            ->update(['meta_value' => $macAddress]);
    }

    /**
     * @param $isLastNumber
     * @param $macNumberOrdered
     * @param $postId
     */
    public function changeStatus($isLastNumber, $macNumberOrdered, $postId)
    {
        $postMeta = DB::table('wp_postmeta')->where('post_id', $postId)
            ->where('meta_key', '_alg_wc_order_status_change_history')->first();

        $post = DB::table('wp_posts')->where('ID', $postId)->first();

        $status = $post->post_status;

        $seconds = Carbon::now()->getPreciseTimestamp(0);
        if ($postMeta) {
            $exploded = explode(':', $postMeta->meta_value);
            $exploded[1] = (int)$exploded[1] + 1;
            $i = $exploded[1] - 1;

            if ($isLastNumber && $macNumberOrdered > 1 && $status !== "wc-processing") {
                $text = '}i:' . $i . ';a:3:{s:4:"time";i:' . $seconds . ';s:4:"from";s:13:"spec-assigned";s:2:"to";s:14:"fully-assigned";}}';
            } elseif ($isLastNumber && $status == 'wc-processing') {
                $text = '}i:' . $i . ';a:3:{s:4:"time";i:' . $seconds . ';s:4:"from";s:10:"processing";s:2:"to";s:14:"fully-assigned";}}';
            } else {
                $text = '}i:' . $i . ';a:3:{s:4:"time";i:' . $seconds . ';s:4:"from";s:10:"processing";s:2:"to";s:13:"spec-assigned";}}';
            }

            $lastItem = $exploded[count($exploded) - 1];
            $exploded[count($exploded) - 1] = str_replace('}}', $text, $lastItem);
            $result = implode(':', $exploded);
            DB::table('wp_postmeta')
                ->where('post_id', $postId)
                ->where('meta_key', '_alg_wc_order_status_change_history')
                ->update(['meta_value' => $result]);

        } else {
            if ($isLastNumber && $status == 'wc-processing') {
                $text = 'a:1:{i:0;a:3:{s:4:"time";i:' . $seconds . ';s:4:"from";s:10:"processing";s:2:"to";s:14:"fully-assigned";}}';
            } else {
                $text = 'a:1:{i:0;a:3:{s:4:"time";i:' . $seconds . ';s:4:"from";s:10:"processing";s:2:"to";s:13:"spec-assigned";}}';
            }

            $data = [
                'post_id'    => $postId,
                'meta_key'   => '_alg_wc_order_status_change_history',
                'meta_value' => $text,
            ];
            DB::table('wp_postmeta')->insert($data);
        }
        DB::table('wp_posts')
            ->where('ID', $postId)
            ->update(['post_status' => $isLastNumber ? 'wc-fully-assigned' : 'wc-spec-assigned']);
    }

}
