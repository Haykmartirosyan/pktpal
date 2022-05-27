<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TransactionCompleted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @var
     */
    public $transaction;

    /**
     * @var
     */
    public $transactionId;

    /**
     * @var
     */
    public $amount;

    /**
     * @var
     */
    public $data;

    /**
     * @param $transaction
     * @param $transactionId
     * @param $amount
     * @param $data
     */
    public function __construct($transaction, $transactionId, $amount, $data)
    {
        $this->transaction = $transaction;
        $this->transactionId = $transactionId;
        $this->amount = $amount;
        $this->data = $data;

    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return \Illuminate\Broadcasting\Channel|array
     */
    public function broadcastOn()
    {
        return new Channel('transaction');
    }
}
