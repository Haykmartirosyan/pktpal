<?php

use Illuminate\Database\Migrations\Migration;

class FixPktServices extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        \Illuminate\Support\Facades\DB::table('pkt_services')->where('type', '')->update(['type' => 'node']);

    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        //
    }
}
