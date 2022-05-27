<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BillPaymentResource extends JsonResource
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
            'bill_service_id' => $this->bill_service_id,
            'service_id'      => $this->service_id,
            'user_id'         => $this->user_id,
            'address'         => $this->address,
            'phone'           => $this->phone,
            'amount'          => $this->amount,
            'recurring'       => $this->recurring,
        ];
    }
}
