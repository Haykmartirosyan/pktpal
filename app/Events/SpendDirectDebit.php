<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SpendDirectDebit implements ShouldBroadcastNow
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
     * @var
     */
    public $directDebitId;

    /**
     * @param $status
     * @param $detail
     * @param $directDebitId
     */
    public function __construct($status, $detail, $directDebitId)
    {
        $this->status = $status;
        $this->detail = $detail;
        $this->directDebitId = $directDebitId;
    }

    /**
     * @return Channel
     */
    public function broadcastOn()
    {
        return new Channel('result-spend-direct-debit');
    }
}
