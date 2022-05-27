<?php

namespace Database\Seeders;

use App\Models\BillService;
use Illuminate\Database\Seeder;

class BillServicesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $billServices = include('BillServices.php');
        $dataForInsert = [];
        foreach ($billServices as $billService) {
            $data = [
                'title'       => $billService['title'],
                'description' => preg_replace("/\r|\n/", " ", $billService['description']),
                'logo'        => str_slug($billService['title']) . '.png',
                'created_at'  => now(),
                'updated_at'  => now(),
            ];
            $service = BillService::where('title', $billService['title'])->first();
            if (!$service) {
                $dataForInsert[] = $data;

            }
        }

        if (!empty($dataForInsert)) {
            BillService::insert($dataForInsert);
        }

    }
}
