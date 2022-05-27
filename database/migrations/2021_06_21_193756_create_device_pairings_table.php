<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateDevicePairingsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('device_pairings', function (Blueprint $table) {
            $table->id();
            $table->integer('device_unique_key');
            $table->unsignedBigInteger('service_id')->index();
            $table->string('user_agent');
            $table->timestamps();

            $table->foreign('service_id')->references('id')->on('pkt_services');

        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('device_pairings');
    }
}
