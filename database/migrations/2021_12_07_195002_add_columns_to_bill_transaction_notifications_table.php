<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddColumnsToBillTransactionNotificationsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('bill_transaction_notifications', function (Blueprint $table) {
            $table->integer('bill_service_id')->nullable()->change();
            $table->string('service_name')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('bill_transaction_notifications', function (Blueprint $table) {
            $table->integer('bill_service_id')->change();
            $table->dropColumn('service_name');
        });
    }
}
