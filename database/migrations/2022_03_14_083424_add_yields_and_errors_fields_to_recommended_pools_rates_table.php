<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddYieldsAndErrorsFieldsToRecommendedPoolsRatesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('recommended_pools_rates', function (Blueprint $table) {
            $table->longText('errors')->after('rates')->nullable();
            $table->bigInteger('errors_count')->after('errors')->nullable();
            $table->longText('yields')->after('errors_count')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('recommended_pools_rates', function (Blueprint $table) {
            $table->dropColumn('errors');
            $table->dropColumn('errors_count');
            $table->dropColumn('yields');
        });
    }
}
