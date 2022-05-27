<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStatusReportsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('status_reports', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('service_id')->index();
            $table->string('bandwidth_used');
            $table->integer('bandwidth_available');
            $table->integer('encryptions_per_second');
            $table->integer('wallet_balance');
            $table->string('spendabl');
            $table->string('immaturereward');
            $table->string('unoconfrimed');
            $table->integer('outputcount');
            $table->string('device_clock_ms');
            $table->string('wallet_block_height');
            $table->string('wallet_block_hash');
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
        Schema::dropIfExists('status_reports');
    }
}
