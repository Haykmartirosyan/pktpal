<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AddDirectDebit implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @var
     */
    public $status;

    /**
     * @var
     */
    public $detail;

    /**
     * @param $status
     * @param $detail
     */
    public function __construct($status, $detail)
    {
        $this->status = $status;
        $this->detail = $detail;
    }

    /**
     * @return Channel
     */
    public function broadcastOn()
    {
        return new Channel('result-add-direct-debit');

    }
}
