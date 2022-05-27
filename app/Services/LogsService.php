<?php


namespace App\Services;

use App\Contracts\LogsInterface;
use Exception;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Tinderbox\Clickhouse\Exceptions\ClientException;
use function Sentry\captureException;

class LogsService
{
    /**
     * @var LogsInterface
     */
    protected LogsInterface $logsRepository;


    /**
     * @param LogsInterface $logsRepository
     */
    public function __construct(LogsInterface $logsRepository)
    {
        $this->logsRepository = $logsRepository;
    }

    /**
     * @param $service
     * @param $text
     * @param null $type
     * @param null $userId
     * @param null $billPaymentId
     */
    public function addDeviceLog($service, $text, $type = null, $userId = null, $billPaymentId = null)
    {
        try {
            $logData = [
                'text'            => $text,
                'subsystem'       => 'system',
                'type'            => $type,
                'user_id'         => $userId,
                'service_id'      => $service->id,
                'bill_payment_id' => $billPaymentId
            ];

            DB::beginTransaction();
            $service->systemLogs()->create($logData);
            DB::commit();
        } catch (Exception $exception) {
            captureException($exception);
            DB::rollBack();
        }
    }

    /**
     * @param $service
     * @param $type
     * @param $skip
     * @return Collection
     * @throws ClientException
     */
    public function getLogs($service, $type, $skip): Collection
    {
        return $this->logsRepository->getByService($service, $type, $skip);
    }

}
