<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Provision extends Model
{
    use HasFactory;

    /**
     * @var string
     */
    protected $table = 'provisions';

    /**
     * @var array
     */
    protected $fillable  = [
        'service_id',
        'seed',
        'secret',
        'tpm_id',
    ];

    /**
     * @return BelongsTo
     */
    public function service()
    {
        return $this->belongsTo(PktService::class);
    }
}
