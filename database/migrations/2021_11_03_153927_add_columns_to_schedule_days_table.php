<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddColumnsToScheduleDaysTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('schedule_days', function (Blueprint $table) {
            $table->boolean('repeat')->default(0);
            $table->string('mining_level')->nullable()->default('unlimited');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('schedule_days', function (Blueprint $table) {
            $table->dropColumn('repeat');
            $table->dropColumn('mining_level');
        });
    }
}
