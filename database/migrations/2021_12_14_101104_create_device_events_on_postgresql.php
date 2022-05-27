<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

class CreateDeviceEventsOnPostgresql extends Migration
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
                $table->string('status')->nullable();
                $table->text('pktreer_token')->nullable();
                $table->softDeletes();
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
