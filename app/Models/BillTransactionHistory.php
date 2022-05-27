<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class BillTransactionHistory extends Model
{
    use HasFactory;

    /**.
     * @var string
     */
    protected $table = 'bill_transaction_histories';

    /**
     * @var string[]
     */
    protected $fillable = [
        'service_id',
        'bill_payment_id',
        'user_id',
        'bill_service_id',
        'amount',
        'created_at',
        'updated_at',
        'service_name',
    ];

    /**
     * @return HasOne
     */
    public function billService()
    {
        return $this->hasOne(BillService::class, 'id', 'bill_service_id');
    }

}
