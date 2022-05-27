<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class PktService extends Model
{
    use HasFactory;

    protected $table = 'pkt_services';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'id',
        'user_id',
        'mac_address',
        'wallet_address',
        'name',
        'type',
        'token',
        'freeze',
        'online',
        'shut_down',
        'pkteer_session',
    ];

    /**
     * @return HasOne
     */
    public function statusReport()
    {
        return $this->hasOne(StatusReport::class, 'service_id');
    }

    /**
     * @return HasMany
     */
    public function pendingTransactions()
    {
        return $this->events()->where('event', 'transaction');
    }

    /**
     * @return HasOne
     */
    public function devicePairingOption()
    {
        return $this->hasOne(DevicePairingOption::class, 'mac_address', 'mac_address');
    }

    /**
     * @return HasMany
     */
    public function pairTokens()
    {
        return $this->hasMany(PairToken::class, 'mac_address', 'mac_address');
    }

    /**
     * @return HasMany
     */
    public function devicePairings()
    {
        return $this->hasMany(DevicePairing::class, 'service_id');
    }

    /**
     * @return HasMany
     */
    public function deviceUnpairings()
    {
        return $this->events()->where('event', 'unpair');
    }

    /**
     * @return HasMany
     */
    public function enableRackMode()
    {
        return $this->events()->where('event', 'enable_rack_mode');
    }

    /**
     * @return HasMany
     */
    public function disableRackMode()
    {
        return $this->events()->where('event', 'disable_rack_mode');
    }

    /**
     * @return HasOne
     */
    public function provision()
    {
        return $this->hasOne(Provision::class, 'service_id');
    }

    /**
     * @return HasMany
     */
    public function logs()
    {
        return $this->hasMany(Log::class, 'service_id');
    }

    /**
     * @return HasMany
     */
    public function packetCryptLogs()
    {
        return $this->logs()->where('subsystem', 'packetcrypt');
    }

    /**
     * @return HasMany
     */
    public function walletLogs()
    {
        return $this->logs()->where('subsystem', 'wallet');
    }

    /**
     * @return HasMany
     */
    public function systemLogs()
    {
        return $this->hasMany(ActivityLog::class, 'service_id', 'id');
    }

    /**
     * @return Model|HasMany|object|null
     */
    public function lastOfflineLog()
    {
        return $this->systemLogs()->where('type', 'offline')->orderBy('created_at', 'desc');
    }

    /**
     * @return HasMany
     */
    public function errors()
    {
        return $this->hasMany(Error::class, 'service_id');
    }

    /**
     * @return HasOne
     */
    public function user()
    {
        return $this->hasOne(User::class, 'ID', 'user_id');
    }

    /**
     * @return HasMany
     */
    public function alerts()
    {
        return $this->hasMany(Alert::class, 'service_id');

    }

    /**
     * @return HasMany
     */
    public function ipAddresses()
    {
        return $this->hasMany(PktServiceIp::class, 'service_id');
    }

    /**
     * @return HasMany
     */
    public function billTransactionsHistories()
    {
        return $this->hasMany(BillTransactionHistory::class, 'service_id');
    }

    /**
     * @return HasMany
     */
    public function scheduleDays()
    {
        return $this->hasMany(ScheduleDays::class, 'service_id');
    }

    /**
     * @return HasMany
     */
    public function billTransactionsNotifications()
    {
        return $this->hasMany(BillTransactionNotification::class, 'service_id');
    }

    /**
     * @return HasMany
     */
    public function seedExportPassphrases()
    {
        return $this->events()->where('event', 'export_seed');
    }

    /**
     * @return HasMany
     */
    public function options()
    {
        return $this->hasMany(DeviceOption::class, 'service_id');
    }

    /**
     * @return HasMany
     */
    public function events()
    {
        return $this->hasMany(DeviceEvent::class, 'service_id');
    }

    /**
     * @return HasMany
     */
    public function rebootEvent()
    {
        return $this->events()->where('event', 'reboot');
    }

    /**
     * @return HasMany
     */
    public function shutDownEvent()
    {
        return $this->events()->where('event', 'halt');
    }

    /**
     * @return HasMany
     */
    public function factoryRackModeEvent()
    {
        return $this->events()->where('event', 'factory_rack_mode');
    }

    /**
     * @return HasMany
     */
    public function switchEnvEvent()
    {
        return $this->events()->where('event', 'switch_env');
    }

    /**
     * @return HasMany
     */
    public function addDirectDebitEvent()
    {
        return $this->events()->where('event', 'add_direct_debit');
    }

    /**
     * @return HasMany
     */
    public function removeDirectDebitEvent()
    {
        return $this->events()->where('event', 'remove_direct_debit');
    }

    /**
     * @return HasMany
     */
    public function spendDirectDebitEvent()
    {
        return $this->events()->where('event', 'spend_direct_debit');
    }

    /**
     * @return HasMany
     */
    public function permitLogs()
    {
        return $this->hasMany(PermitsNoToken::class);
    }

    /**
     * @return HasMany
     */
    public function alterDirectDebitEvent()
    {
        return $this->events()->where('event', 'alter_spending_limits');
    }

    /**
     * @return HasMany
     */
    public function encryptions()
    {
        return $this->hasMany(ServiceEncryption::class, 'service_id');
    }

    /**
     * @return HasMany
     */
    public function lastOnlineLog()
    {
        return $this->systemLogs()->where('type', 'online')->orderBy('created_at', 'desc');
    }
}
