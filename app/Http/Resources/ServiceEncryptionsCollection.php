<?php

namespace App\Http\Resources;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class ServiceEncryptionsCollection extends ResourceCollection
{
    /**
     * Transform the resource collection into an array.
     *
     * @param Request $request
     * @return array
     */
    public function toArray($request): array
    {
        return [
            'data' => $this->collection->transform(function (&$encryption) use ($request) {

                if (Carbon::parse($request->period)->format('Y-m-d') != Carbon::now()->format('Y-m-d')) {
                    $encryption->created_at = Carbon::parse($encryption->created_at)->setTimezone($request->timezone);
                }

                return [
                    'created_at'             => $encryption->created_at,
                    'encryptions_per_second' => $encryption->encryptions_per_second,
                ];
            })
        ];
    }
}
