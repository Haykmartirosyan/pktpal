<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BillService extends Model
{
    use HasFactory;

    /**
     * @var string
     */
    protected $table = 'bill_services';

    /**
     * @var string[]
     */
    protected $fillable = [
        'title',
        'description',
        'logo',
    ];

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */

    public function users()
    {
        return $this->belongsToMany(User::class);
    }


    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function userFavorite()
    {
        return $this->belongsToMany(User::class, 'bill_service_user',  'bill_service_id', 'user_id');
    }
}
