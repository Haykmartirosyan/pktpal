<?php

namespace App\Console\Commands;

use App\Contracts\UsersInterface;
use App\Notifications\TimestampExpired;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class CheckTimestampExpiration extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'check-timestamp:expiration';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @param UsersInterface $userRepo
     * @return int
     */
    public function handle(UsersInterface $userRepo)
    {
        $sigFiles = [
            'https://friendly.pkteer.com/upd/v1_a_dev_3ff1d92078d63728/update.sig',
            'https://friendly.pkteer.com/upd/v1_a_prod_bb4f7e3eca1f3b85/update.sig',
            'https://friendly.pkteer.com/upd/v1_b_dev_6f3ddeb69c8d764a/update.sig',
            'https://friendly.pkteer.com/upd/v1_b_prod_b2f8e8b7e8a7f1a7/update.sig',
            'https://friendly.pkteer.com/upd/v1_provisioner_dev_1e67839c72a72768/update.sig',
            'https://friendly.pkteer.com/upd/v1_provisioner_prod_bc9c004f5863ac31/update.sig',
        ];

        $timestampExpired = false;

        foreach ($sigFiles as $file) {
            $fileContents = file_get_contents($file);
            $seconds = json_decode(explode(' ', $fileContents)[2])->timestamp;

            $date = Carbon::parse(date("m/d/Y H:i:s", $seconds))->addMonths(3);
            $now = Carbon::now();

            $diff = $date->diffInDays($now);

            if ($diff <= 7) {
                $timestampExpired = true;
                break;
            }
        }

        if ($timestampExpired) {
            $userIds = DB::table('wp_usermeta')->where('meta_key', 'wp_capabilities')
                ->where('meta_value', 'like', "%administrator%")
                ->pluck('user_id');

            $users = $userRepo->getByIds($userIds);
            Notification::send($users, new TimestampExpired());
        }

        return true;
    }
}
