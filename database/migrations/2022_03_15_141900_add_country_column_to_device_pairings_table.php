<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddCountryColumnToDevicePairingsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('device_pairings', function (Blueprint $table) {
            $table->text('country')->after('user_agent')->nullable();
            $table->string('logo')->after('country')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('device_pairings', function (Blueprint $table) {
            $table->dropColumn('country');
            $table->dropColumn('logo');
        });
    }
}
