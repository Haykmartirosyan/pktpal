<?php

namespace App\Services;

use Illuminate\Support\Str;
use Stevebauman\Location\Facades\Location;

class PairingInfoService
{
    /**
     * @param $ip
     * @param $userAgent
     * @return array
     */
    public function setPairedDeviceInfo($ip, $userAgent): array
    {
        $userIp = $ip;
        $locationData = Location::get($userIp);
        $country = $locationData ? $locationData->countryName . '/' . $locationData->cityName : null;

        if (is_string($userAgent)) {
            $logo = 'unknown.png';
        } else {
            switch ($userAgent['userAgent']) {
                case(Str::contains($userAgent['userAgent'], 'Linux')):
                    $logo = 'linux.png';
                    break;
                case(Str::contains($userAgent['userAgent'], 'iPhone')):
                    $logo = 'iphone.png';
                    break;
                case(Str::contains($userAgent['userAgent'], 'Windows')):
                    $logo = 'windows.png';
                    break;
                case(Str::contains($userAgent['os'], 'Android') && Str::contains($userAgent['type'], 'smartphone')):
                    $logo = 'android-mobile.png';
                    break;
                case(Str::contains($userAgent['userAgent'], 'iPad')):
                    $logo = 'ipad.png';
                    break;
                case(Str::contains($userAgent['userAgent'], 'Mac')):
                    $logo = 'mac.png';
                    break;
                case(Str::contains($userAgent['os'], 'Android') && Str::contains($userAgent['type'], 'tablet')):
                    $logo = 'android.png';
                    break;
                default:
                    $logo = 'unknown.png';
            }
        }
        return [
            'country' => $country,
            'logo'    => $logo
        ];
    }


}