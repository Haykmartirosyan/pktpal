<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class PermitsTokenCollection extends ResourceCollection
{
    /**
     * Transform the resource collection into an array.
     *
     * @param Request $request
     * @return array
     */
    public function toArray($request): array
    {
        if (app()->environment() == 'production') {
            return [
                'data' => $this->collection->transform(function ($log) {
                    return [
                        'created_at'  => $log->created,
                        'ip'          => $log->ip,
                        'session'     => $log->session,
                        'token'       => $log->token,
                        'good'        => $log->good,
                        'version_id'  => $log->version_id,
                        'mac_address' => $log->mac
                    ];
                }),
            ];
        } else {
            return [
                'data' => $this->collection,
            ];
        }
    }
}
