<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Bavix\LaravelClickHouse\Database\Eloquent\Model;

class Error extends Model
{
    use HasFactory;

    /**
     * @var string
     */
    protected $table = 'errors';
}
