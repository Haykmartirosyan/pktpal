<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RackModeResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  Request  $request
     * @return array
     */
    public function toArray($request): array
    {
        return [
            'mac_address'    => $this->mac_address,
            'wallet_address' => $this->wallet_address,
            'sign_req'       => $this->sign_req,
        ];
    }
}
