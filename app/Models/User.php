<?php

namespace App\Models;

use Exception;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
use Laravel\Passport\HasApiTokens;


class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * @var string
     */
    protected $table = 'wp_users';

    /**
     * @var string
     */
    protected $primaryKey = 'ID';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'user_login',
        'user_pass',
        'user_nicename',
        'user_email',
        'user_url',
        'user_registered',
        'user_activation_key',
        'user_status',
        'display_name',
    ];

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array
     */
    protected $hidden = [
        'user_pass',
    ];

    /**
     * @var string[]
     */
    protected $appends = ['first_name', 'last_name'];

    /**
     * @return null
     */
    public function getFirstNameAttribute()
    {
        try {
            $meta = $this->getUserMeta($this->ID);
            return $meta[0]->first_name;
        } catch (Exception $exception) {
            return null;
        }
    }

    /**
     * @return null
     */
    public function getLastNameAttribute()
    {
        try {
            $meta = $this->getUserMeta($this->ID);
            return $meta[0]->last_name;
        } catch (Exception $exception) {
            return null;
        }
    }

    /**
     * @param $id
     * @return array
     */
    public function getUserMeta($id)
    {
        $userQuery = "SELECT firstmeta.meta_value as first_name, lastmeta.meta_value as last_name 
                       FROM wp_users 
                       left join wp_usermeta as firstmeta 
                       on wp_users.ID = firstmeta.user_id and firstmeta.meta_key = 'first_name' 
                       left join wp_usermeta as lastmeta
                       on wp_users.ID = lastmeta.user_id and lastmeta.meta_key = 'last_name'
                       where wp_users.ID = $id";

        return DB::select(DB::raw($userQuery));
    }

    /**
     * @return HasMany
     */
    public function pktServices()
    {
        return $this->hasMany(PktService::class, 'user_id');
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function billFavoriteServices()
    {
        return $this->belongsToMany(BillService::class, 'bill_service_user', 'user_id', 'bill_service_id');
    }

    /**
     * @return HasMany
     */

    public function smsNotifications()
    {
        return $this->hasMany(UserSmsNotification::class, 'user_id');
    }

    /**
     * @return HasMany
     */
    public function registerSmsNotification()
    {
        return $this->smsNotifications()->where('type', 'register_device');
    }
}
