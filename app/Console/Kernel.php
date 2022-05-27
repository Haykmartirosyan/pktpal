<?php

namespace App\Console;

use App\Console\Commands\CheckDeviceStatus;
use App\Console\Commands\NotificationIfCubeIsOffline;
use App\Console\Commands\RunPoolsTesting;
use App\Console\Commands\SendSmsIfOffline;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * The Artisan commands provided by your application.
     *
     * @var array
     */
    protected $commands = [
        CheckDeviceStatus::class,
        SendSmsIfOffline::class,
        NotificationIfCubeIsOffline::class,
        RunPoolsTesting::class
    ];

    /**
     * @param Schedule $schedule
     */
    protected function schedule(Schedule $schedule)
    {
        $schedule->command('send:offline-sms')->withoutOverlapping()->everyFiveMinutes();
        $schedule->command('check:status')->withoutOverlapping()->everyMinute();
        $schedule->command('notify:when-offline')->withoutOverlapping()->everyThreeMinutes();
        $schedule->command('run:pools-testing')->dailyAt('03:00');
        $schedule->command('telescope:prune')->daily();
        $schedule->command('check-timestamp:expiration')->weekly();
        $schedule->command('check-offline:cubes')->hourly();
        $schedule->command('check-offline:cubes-count')->hourly();
        $schedule->command('check:mining-thresholds')->dailyAt('04:00');
    }

    /**
     * Register the commands for the application.
     *
     * @return void
     */
    protected function commands()
    {
        $this->load(__DIR__ . '/Commands');

        require base_path('routes/console.php');
    }
}
