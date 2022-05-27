<?php


namespace App\Services;

use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Sentry\Severity;
use Sentry\State\Scope;
use Telnyx\Message;
use Telnyx\Telnyx;
use function Sentry\captureException;
use function Sentry\captureMessage;
use function Sentry\withScope;

class SmsService
{
    /**
     * @param $user
     * @param $text
     */
    public function sendSMS($user, $text)
    {
        try {
            $phoneMeta = DB::table('wp_usermeta')
                ->where('user_id', $user->ID)
                ->where('meta_key', 'billing_phone')->first();

            $phone = $phoneMeta ? $phoneMeta->meta_value : null;

            if ($phone) {
                Telnyx::setApiKey(config('telnyx.api_key'));
                $profileId = config('telnyx.messaging_profile_id');

                Message::Create([
                    "to"                   => "$phone",
                    "messaging_profile_id" => $profileId,
                    "text"                 => $text,
                ]);

                withScope(function (Scope $scope) use ($user, $phone) {
                    $scope->setLevel(Severity::info());
                    captureMessage('Sent to ' . $user->user_email . ' ' . $phone);
                });

                // mattermost channel log
                Log::channel('mattermost')->info("SMS sent to user $user->user_email with phone number $phone");
            }

        } catch (Exception $exception) {
            captureException($exception);
        }

    }

}
