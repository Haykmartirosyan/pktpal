<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserSmsNotification extends Model
{
    use HasFactory;

    /**
     * @var string
     */
    protected $table = 'user_sms_notifications';

    /**
     * @var string[]
     */
    protected $fillable = [
        'user_id',
        'type',
    ];
}
