<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceEncryption extends Model
{
    use HasFactory;

    /**
     * @var string
     */
    protected $table = 'service_encryptions';

    /**
     * @var array
     */
    protected $fillable = [
        'service_id',
        'encryptions_per_second',
        'created_at'
    ];

}
