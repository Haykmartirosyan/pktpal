<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddDataToStatusReportsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('status_reports', function (Blueprint $table) {
            $table->string('bandwidth_used_kbps')->nullable();
            $table->string('kilo_encryptions_per_second')->nullable();
            $table->string('encryptions_per_second')->change();
            $table->renameColumn('spendabl', 'spendable');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('status_reports', function (Blueprint $table) {
            $table->dropColumn('bandwidth_used_kbps');
            $table->dropColumn('kilo_encryptions_per_second');
            $table->renameColumn('spendable', 'spendabl');

        });
    }
}
