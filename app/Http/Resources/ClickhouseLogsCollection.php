<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class ClickhouseLogsCollection extends ResourceCollection
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
            'data' => $this->collection->transform(function ($log) {
                $text = null;
                if (isset($log['logs'])) {
                    $text = $log['logs'];
                }

                if (isset($log['error_msg'])) {
                    $text = $log['error_msg'];
                }
                return [
                    'created'    => $log['created'],
                    'text'       => $text,
                    "mac"        => $log['mac'],
                    "subsys"     => isset($log['subsys']) ? $log['subsys'] : null,
                    "ip"         => isset($log['ip']) ? $log['ip'] : null,
                    "good"       => isset($log['good']) ? $log['good'] : null,
                    "token"      => isset($log['token']) ? $log['token'] : null,
                    "session"    => isset($log['session']) ? $log['session'] : null,
                    "version_id" => isset($log['version_id']) ? $log['version_id'] : null
                ];
            }),
        ];
    }
}
