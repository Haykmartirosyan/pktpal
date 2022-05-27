<?php

namespace Database\Seeders;

use App\Models\RecommendedPool;
use Illuminate\Database\Seeder;

class RecommendedPoolsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $dataForInsert = [];
        $recommendedPools = [
            ["level" => "unlimited", 'pools' => json_encode([
                "http://www.pkt.world/master/4096",
                "http://pool.pktpool.io/diff/4096",
                "http://pool.pkteer.com",
                "http://pktco.in"
            ])],
            ["level" => "high", 'pools' => json_encode([
                "http://www.pkt.world/master/4096",
                "http://pool.pktpool.io/diff/4096",
            ])],
            ["level" => "medium", 'pools' => json_encode([
                "http://www.pkt.world",
                "http://pool.pktpool.io",
            ])],
            ["level" => "low", 'pools' => json_encode([
                "http://www.pkt.world/master/4096",
            ])],
            ["level" => "all_pools", 'pools' => json_encode([
                "http://www.pkt.world/master/4096",
                "http://pool.pktpool.io/diff/4096",
                "http://pool.pkteer.com",
                "http://pktco.in",
                "http://www.pkt.world",
                "http://pool.pktpool.io",
            ])],
            ["level" => "experimental", 'pools' => json_encode([
            ])],
        ];
        foreach ($recommendedPools as $recommendedPool) {
            $data = [
                'level'      => $recommendedPool['level'],
                'pools'      => $recommendedPool['pools'],
                'created_at' => now(),
                'updated_at' => now(),
            ];
            $service = RecommendedPool::where('level', $recommendedPool['level'])->first();
            if (!$service) {
                $dataForInsert[] = $data;
            }
        }
        if (!empty($dataForInsert)) {
            RecommendedPool::query()->insert($dataForInsert);
        }
    }
}
