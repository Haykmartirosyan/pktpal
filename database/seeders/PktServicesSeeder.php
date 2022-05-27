<?php

namespace Database\Seeders;

use App\Models\PktService;
use Faker\Generator;
use Faker\Provider\Internet;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PktServicesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $emails = [
            'greta.gurgenyan@gmail.com',
        ];

        $faker = new Generator();
        $faker->addProvider(new Internet($faker));

        $userIds = DB::table('wp_users')
            ->whereIn('user_email', $emails)->pluck('id')->toArray();

        for ($x = 0; $x <= 10; $x++) {
            //            foreach ($userIds as $userId) {
            $data = [
                'user_id'        => null,
                'mac_address'    => $faker->macAddress(),
                'wallet_address' => Str::random(40),
                'type'           => 'node',
                'token'          => Str::random(40),
                'online'         => 0,
            ];
            PktService::create($data);

            //            }
        }

    }
}
