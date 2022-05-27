<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PktServiceIp extends Model
{
    use HasFactory;

    /**
     * @var string
     */
    protected $table = 'pkt_service_ips';

    /**
     * @var string[]
     */
    protected $fillable = [
        'service_id',
        'ip',
        'updated_at',
    ];
}
