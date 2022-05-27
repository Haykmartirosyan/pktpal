<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddColumnsToDeviceEventsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('device_events', function (Blueprint $table) {
            $table->string('mac_address')->nullable();
            $table->longText('sign_req')->nullable();
            $table->longText('msg')->nullable();
            $table->string('wallet_address')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('device_events', function (Blueprint $table) {
            $table->dropColumn('mac_address');
            $table->dropColumn('sign_req');
            $table->dropColumn('msg');
            $table->dropColumn('wallet_address');
        });
    }
}
