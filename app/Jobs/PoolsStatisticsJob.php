<?php

namespace App\Jobs;

use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Exception;
use function Sentry\captureException;

class PoolsStatisticsJob implements ShouldQueue, ShouldBeUnique
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of seconds the job can run before timing out.
     *
     * @var int
     */
    public $timeout = 0;

    /**
     * The number of seconds after which the job's unique lock will be released.
     *
     * @var int
     */
    public $uniqueFor = 120;

    /**
     * The unique ID of the job.
     *
     * @return string
     */
    public function uniqueId()
    {
        return $this->pid;
    }

    /**
     * @var
     */
    protected $pools;

    /**
     * @var
     */
    protected $pid;

    /**
     * @param $pools
     * @param $pid
     */
    public function __construct($pools, $pid)
    {
        $this->pools = $pools;
        $this->pid = $pid;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        try {

            exec("sudo kill $this->pid");
            $file = file_get_contents(base_path() . "/output.txt");
            $hasGoodRates = Str::of($file)->contains('goodrate: [');

            if ($hasGoodRates) {
                $goodRateSlice = Str::of($file)->afterLast('goodrate: [');
                $rates = Str::of($goodRateSlice)->before(']\n');

                $uploadingSlice = Str::of($file)->afterLast('uploading: [');
                $uploading = Str::of($uploadingSlice)->before(']');

                $array = explode('\\n', $file);
                $errors = '';
                $count = 0;
                foreach ($array as $line) {
                    if (str_contains($line, 'WARN')) {
                        $errorSlice = Str::of($line)->afterLast('write(2, "');
                        $error = Str::of($errorSlice)->before('\n');
                        $error .= "\n";

                        $errors .= $error;
                        $count++;
                    }
                }

                $data = [
                    'recommended_pools' => json_encode($this->pools),
                    'rates'             => json_encode(explode(',', $rates)),
                    'errors'            => $errors,
                    'errors_count'      => $count,
                    'yields'            => json_encode(explode(',', $uploading)),
                    'created_at'        => Carbon::now()->toDateTimeString(),
                    'updated_at'        => Carbon::now()->toDateTimeString(),
                ];

                DB::beginTransaction();
                DB::table('recommended_pools_rates')->insert($data);
                DB::commit();
            } else {
                $delay = Carbon::now()->addMinutes(5);
                RunPacketcryptJob::dispatch()->delay($delay);
            }
        } catch (Exception $exception) {
            DB::rollBack();
            captureException($exception);
        }
    }
}
