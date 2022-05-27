<?php

namespace Tests\Unit\Repositories;

use App\Models\PktService;
use App\Models\Provision;
use App\Repositories\ProvisionsRepository;
use Faker\Generator;
use Faker\Provider\Internet;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Str;
use Tests\TestCase;

class ProvisionsRepositoryTest extends TestCase
{
    use DatabaseTransactions;

    /**
     * @test
     */
    public function test_get_by_tmp_id_success()
    {
        $faker = new Generator();
        $faker->addProvider(new Internet($faker));

        $pktServiceData = [
            'user_id'        => 1,
            'mac_address'    => $faker->macAddress(),
            'wallet_address' => Str::random(15),
            'name'           => 'device',
            'type'           => 'node',
            'token'          => Str::random(15),
            'freeze'         => 0,
            'online'         => 1,
            'shut_down'      => 0
        ];

        $createdService = PktService::create($pktServiceData);

        $provisionData = [
            'service_id' => $createdService->id,
            'seed'       => Str::random(20),
            'secret'     => Str::random(20),
            'tpm_id'     => Str::random(20)
        ];
        Provision::create($provisionData);

        $repo = $this->app->make(ProvisionsRepository::class);
        $data = $repo->getByTmpId($provisionData['tpm_id']);
        $this->assertEquals($provisionData['tpm_id'], $data->tpm_id);
    }

    /**
     * @test
     */
    public function test_get_by_tmp_id_failure()
    {
        $repo = $this->app->make(ProvisionsRepository::class);
        $data = $repo->getByTmpId(Str::random(20));
        $this->assertNull($data);
    }

}
