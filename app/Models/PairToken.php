<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PairToken extends Model
{
    use HasFactory;

    /**
     * @var string
     */
    protected $table = 'pair_tokens';

    /**
     * @var string[]
     */
    protected $fillable = [
        'mac_address',
        'token',
        'user_agent',
    ];
}
