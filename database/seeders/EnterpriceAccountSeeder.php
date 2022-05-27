<?php

namespace Database\Seeders;

use App\Models\PktService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EnterpriceAccountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $ids = [
            81,
            106,
            107,
            108,
            109,
            110,
            111,
            112,
            114,
            115,
            116,
            117,
            118,
            119,
            120,
            121,
            122,
            123,
            124,
            125,
            126,
            127,
            128,
            129,
            130,
            131,
            132,
            133,
            134,
        ];

        foreach ($ids as $id) {
            $service = PktService::where('id', $id)->first();

            if ($service) {
                DB::beginTransaction();
                $eventData = [
                    'event'          => 'factory_rack_mode',
                    'wallet_address' => 'pkt1q09tpq0ensqawklqm88z3ayjp4m7w8csqu7s4sw',
                    'pkteer_token'   => $service->token
                ];
                $service->events()->create($eventData);
                DB::commit();
            }

        }
    }
}
