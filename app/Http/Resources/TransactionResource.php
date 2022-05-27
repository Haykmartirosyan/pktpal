<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
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
            "id"          => $this->id,
            "from"        => $this->from,
            "to"          => $this->to,
            "amount"      => $this->amount,
            "description" => $this->description,
            "msg"         => $this->msg,
        ];
    }
}
