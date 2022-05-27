<?php

namespace App\Console\Commands;

use App\Contracts\PermitTokenInterface;
use App\Contracts\PktServicesInterface;
use App\Contracts\UsersInterface;
use App\Notifications\CubeOfflineWithPermit;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class CheckOfflineCubeWithPermitToken extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'check-offline:cubes';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * @var PktServicesInterface
     */
    protected $pktServicesRepository;

    /**
     * @var PermitTokenInterface
     */
    protected $permitTokenRepository;


    protected $userRepository;

    /**
     * Create a new command instance.
     *
     * @param PktServicesInterface $pktServicesRepository
     * @param PermitTokenInterface $permitTokenRepository
     * @param UsersInterface $userRepository
     */
    public function __construct(PktServicesInterface $pktServicesRepository, PermitTokenInterface $permitTokenRepository, UsersInterface $userRepository)
    {
        parent::__construct();
        $this->pktServicesRepository = $pktServicesRepository;
        $this->permitTokenRepository = $permitTokenRepository;
        $this->userRepository = $userRepository;
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $userIds = DB::table('wp_usermeta')->where('meta_key', 'wp_capabilities')
            ->where('meta_value', 'like', "%administrator%")
            ->pluck('user_id');

        $users = $this->userRepository->getByIds($userIds);

        $services = $this->pktServicesRepository->getOfflineDevices();

        $services->chunkById(20, function ($services) use ($users) {
            foreach ($services as $service) {

                $lastPermitToken = $this->permitTokenRepository->getByMacAddress($service->mac_address);

                if ($lastPermitToken) {
                    if ($lastPermitToken->created > Carbon::now()->subHour()) {
                        Notification::send($users, new CubeOfflineWithPermit($service->mac_address));
                    }
                }
            }
        });

        return true;
    }
}
