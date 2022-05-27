<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StatusReport extends Model
{
    use HasFactory;

    protected $table = 'status_reports';

    protected $fillable = [
        'service_id',
        'bandwidth_used',
        'bandwidth_available',
        'encryptions_per_second',
        'wallet_balance',
        'spendable',
        'immaturereward',
        'unconfirmed',
        'outputcount',
        'device_clock_ms',
        'wallet_block_height',
        'wallet_block_hash',
        'bandwidth_used_kbps',
        'kilo_encryptions_per_second',
        'last_event_timestamp',
        'version',
        'pools_info',
        'updated_at',
        'rack_mode_recipient'
    ];
}
