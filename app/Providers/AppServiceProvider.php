<?php

namespace App\Providers;

use App\Contracts\BillPaymentsInterface;
use App\Contracts\BillServicesInterface;
use App\Contracts\ErrorsInterface;
use App\Contracts\LogsInterface;
use App\Contracts\OfflineDevicesCountInterface;
use App\Contracts\PermitsNoTokenInterface;
use App\Contracts\PermitTokenInterface;
use App\Contracts\PktServicesInterface;
use App\Contracts\ProvisionsInterface;
use App\Contracts\RecommendedPoolsInterface;
use App\Contracts\RecommendedPoolsRatesInterface;
use App\Contracts\UsersInterface;
use App\Repositories\BillPaymentsRepository;
use App\Repositories\BillServicesRepository;
use App\Repositories\ErrorsRepository;
use App\Repositories\LogsRepository;
use App\Repositories\OfflineDevicesCountRepository;
use App\Repositories\PermitsNoTokenRepository;
use App\Repositories\PermitTokenRepository;
use App\Repositories\PktServicesRepository;
use App\Repositories\ProvisionsRepository;
use App\Repositories\RecommendedPoolsRatesRepository;
use App\Repositories\RecommendedPoolsRepository;
use App\Repositories\UsersRepository;
use Illuminate\Support\ServiceProvider;
use Sentry\ClientBuilderInterface;
use Sentry\Serializer\Serializer;
use Sportyfriends\Providers\TelescopeServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        $this->app->bind(PktServicesInterface::class, PktServicesRepository::class);
        $this->app->bind(UsersInterface::class, UsersRepository::class);
        $this->app->bind(LogsInterface::class, LogsRepository::class);
        $this->app->bind(ErrorsInterface::class, ErrorsRepository::class);
        $this->app->bind(ProvisionsInterface::class, ProvisionsRepository::class);
        $this->app->bind(BillServicesInterface::class, BillServicesRepository::class);
        $this->app->bind(BillPaymentsInterface::class, BillPaymentsRepository::class);
        $this->app->bind(PermitsNoTokenInterface::class, PermitsNoTokenRepository::class);
        $this->app->bind(PermitTokenInterface::class, PermitTokenRepository::class);
        $this->app->bind(RecommendedPoolsInterface::class, RecommendedPoolsRepository::class);
        $this->app->bind(RecommendedPoolsRatesInterface::class, RecommendedPoolsRatesRepository::class);
        $this->app->bind(OfflineDevicesCountInterface::class, OfflineDevicesCountRepository::class);

        $this->app->register(\Laravel\Telescope\TelescopeServiceProvider::class);
        $this->app->register(\App\Providers\TelescopeServiceProvider::class);

        $this->app->extend(ClientBuilderInterface::class, function (ClientBuilderInterface $clientBuilder) {
            $clientBuilder->setSerializer(new Serializer($clientBuilder->getOptions(), 5));

            return $clientBuilder;
        });
    }

    /**x
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        //
    }
}
