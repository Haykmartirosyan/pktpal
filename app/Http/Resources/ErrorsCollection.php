<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class ErrorsCollection extends ResourceCollection
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
                'data' => $this->collection->transform(function ($error) {
                    return [
                        'created_at' => $error->created,
                        'text'       => $error->error_msg,
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
