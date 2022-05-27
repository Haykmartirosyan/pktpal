<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class LogsCollection extends ResourceCollection
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
                        'created_at' => $log->created,
                        'text'       => $log->logs,
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
