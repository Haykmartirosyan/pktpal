<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class BillPayment extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * @var string
     */
    protected $table = 'bill_payments';

    /**
     * @var string[]
     */
    protected $fillable = [
        'bill_service_id',
        'service_id',
        'user_id',
        'address',
        'holder_name',
        'phone',
        'amount',
        'recurring',
        'completed',
        'payment_date',
        'account_number',
        'apartment',
        'city',
        'country',
        'state',
        'zip_code',
        'service_name',
        'description',
        'direct_debit_id'
    ];

    /**
     * @return HasOne
     */
    public function user()
    {
        return $this->hasOne(User::class, 'ID', 'user_id');
    }

    /**
     * @return HasOne
     */
    public function billService()
    {
        return $this->hasOne(BillService::class, 'id', 'bill_service_id');
    }

    /**
     * @return HasOne
     */
    public function billServiceWithFavorite()
    {
        return $this->billService()->with('userFavorite');
    }

    /**
     * @return HasOne
     */
    public function pktService()
    {
        return $this->hasOne(PktService::class, 'id', 'service_id');
    }

}
