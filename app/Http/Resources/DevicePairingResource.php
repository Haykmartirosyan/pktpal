<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DevicePairingResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param Request $request
     * @return array
     */
    public function toArray($request): array
    {
        return [
            'id'                => $this->id,
            'device_unique_key' => $this->device_unique_key,
            'service_id'        => $this->service_id,
            'user_agent'        => $this->user_agent,
            'last_login'        => $this->last_login,
            'country'           => $this->country,
            'logo'              => $this->logo
        ];
    }
}
