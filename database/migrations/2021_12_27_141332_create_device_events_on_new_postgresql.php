<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

class CreateDeviceEventsOnNewPostgresql extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::connection('pgsql')->hasTable('device_events')) {
            Schema::connection('pgsql')->create('device_events', function ($table) {
                $table->id();
                $table->unsignedBigInteger('service_id')->index();
                $table->string('event');
                $table->text('data')->nullable();
                $table->string('mac_address')->nullable();
                $table->longText('sign_req')->nullable();
                $table->longText('msg')->nullable();
                $table->string('wallet_address')->nullable();
                $table->text('pkteer_token');
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::connection('pgsql')->dropIfExists('device_events');
    }
}
