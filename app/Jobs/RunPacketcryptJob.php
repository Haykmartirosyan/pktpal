<?php

namespace App\Jobs;

use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class RunPacketcryptJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of seconds the job can run before timing out.
     *
     * @var int
     */
    public $timeout = 0;

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $allPools  = DB::table('recommended_pools')->where('level', 'all_pools')->first();
        $pools = json_decode($allPools->pools);

        $quantity = rand(2, 6);
        $dailyPools = [];

        $indexes = array_rand($pools, $quantity);

        foreach ($indexes as $index) {
            $pool = $pools[$index];
            $dailyPools[] = $pool;
        }

        $dailyPools = implode($dailyPools, ' ');
        $walletAddress = config('app.pools_testing_wallet');

        $command = 'packetcrypt ann -p ' . $walletAddress . ' ' . $dailyPools
            . ' > /dev/null 2>&1 & echo $!; ';

        $pid = exec($command, $output);
        GetPoolsRatesJob::dispatch($pid);

        $delay = Carbon::now()->addSeconds(120);
        $dailyPools = explode(' ', $dailyPools);
        PoolsStatisticsJob::dispatch($dailyPools, $pid)->delay($delay);
    }
}
