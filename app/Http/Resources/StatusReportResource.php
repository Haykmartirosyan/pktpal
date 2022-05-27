<?php

namespace App\Http\Resources;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StatusReportResource extends JsonResource
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
            'bandwidth_used'         => $this->bandwidth_used,
            'bandwidth_available'    => $this->bandwidth_available,
            'encryptions_per_second' => $this->encryptions_per_second,
            'wallet_balance'         => $this->wallet_balance,
            'spendabl'               => $this->spendabl,
            'immaturereward'         => $this->immaturereward,
            'unconfirmed'            => $this->unconfirmed,
            'outputcount'            => $this->outputcount,
            'device_clock_ms'        => $this->device_clock_ms,
            'wallet_block_height'    => $this->wallet_block_height,
            'wallet_block_hash'      => $this->wallet_block_hash,
            'last_event_timestamp'   => $this->last_event_timestamp,
            'version'                => $this->version,
            'updated_at'             => $this->updated_at,
        ];
    }

    /**
     * @param Request $request
     * @return JsonResponse
     */
    public function toResponse($request): JsonResponse
    {
        return parent::toResponse($request)->setStatusCode(200);
    }

}
