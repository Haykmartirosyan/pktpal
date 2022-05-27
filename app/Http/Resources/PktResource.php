<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PktResource extends JsonResource
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
            'id'             => $this->id,
            'user_id'        => $this->user_id,
            'mac_address'    => $this->mac_address,
            'wallet_address' => $this->wallet_address,
            'name'           => $this->name,
            'type'           => $this->type,
            'freeze'         => $this->freeze,
            'online'         => $this->online,
        ];
    }
}
