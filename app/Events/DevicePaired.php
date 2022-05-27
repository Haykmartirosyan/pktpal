<?php

namespace App\Events;

use App\Models\DevicePairing;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DevicePaired implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @var DevicePairing
     */
    public $devicePairing;

    public $status;

    /**
     * Create a new event instance.
     *
     * @param DevicePairing $devicePairing
     * @param $status
     */
    public function __construct($devicePairing, $status)
    {
        $this->devicePairing = $devicePairing;
        $this->status = $status;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return \Illuminate\Broadcasting\Channel|array
     */
    public function broadcastOn()
    {
        return new Channel('device-paired');
    }
}
