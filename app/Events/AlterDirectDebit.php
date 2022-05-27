<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AlterDirectDebit implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;


    /**
     * @var
     */
    public $status;

    /**
     * @var
     */
    public $directDebitId;


    /**
     * @param $status
     * @param $directDebitId
     */
    public function __construct($status, $directDebitId)
    {
        $this->status = $status;
        $this->directDebitId = $directDebitId;
    }

    /**
     * @return Channel
     */
    public function broadcastOn()
    {
        return new Channel('result-alter-direct-debit');

    }
}
