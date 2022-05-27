<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class BillTransactionNotification extends Model
{
    use HasFactory;

    /**
     * @var string
     */
    protected $table = 'bill_transaction_notifications';

    /**
     * @var string[]
     */
    protected $fillable = [
        'service_id',
        'user_id',
        'bill_service_id',
        'amount',
        'payment_date',
        'service_name',
        'type'
    ];

    /**
     * @return HasOne
     */
    public function billService()
    {
        return $this->hasOne(BillService::class, 'id', 'bill_service_id');
    }
}
