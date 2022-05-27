<?php

namespace App\Console\Commands;

use App\Jobs\RunPacketcryptJob;
use Illuminate\Console\Command;

class RunPoolsTesting extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'run:pools-testing';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run recommended pools testing';

    /**
     * Create a new command instance.
     *
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Run recommended pools testing
     */
    public function handle()
    {
        RunPacketcryptJob::dispatch();
    }
}
