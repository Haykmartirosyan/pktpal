<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class OfflineServicesCountCollection extends ResourceCollection
{
    /**
     * @param Request $request
     * @return array
     */
    public function toArray($request): array
    {
        return [
            'data' => $this->collection->transform(function ($count) {
                return [
                    'time'  => $count->time,
                    'count' => $count->count,
                ];
            }),
        ];
    }
}
