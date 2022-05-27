<?php

namespace App\Http\Controllers\admin\dashboard;

use App\Contracts\ErrorsInterface;
use App\Contracts\LogsInterface;
use App\Contracts\PermitsNoTokenInterface;
use App\Contracts\PermitTokenInterface;
use App\Contracts\PktServicesInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\LogsRequest;
use App\Http\Resources\ErrorsCollection;
use App\Http\Resources\LogsCollection;
use App\Http\Resources\PermitsNoTokenCollection;
use App\Http\Resources\PermitsTokenCollection;
use App\Services\LogsService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Tinderbox\Clickhouse\Exceptions\ClientException;
use function Sentry\captureException;

class PktController extends Controller
{
    /**
     * @var PktServicesInterface
     */
    protected PktServicesInterface $pktServicesRepository;

    /**
     * @var ErrorsInterface
     */
    protected ErrorsInterface $errorsRepository;

    /**
     * @var LogsInterface
     */
    protected LogsInterface $logsRepository;

    /**
     * @var LogsService
     */
    protected LogsService $logsService;

    /**
     * @var PermitsNoTokenInterface
     */
    protected PermitsNoTokenInterface $permitsNoTokenRepository;

    /**
     * @var PermitTokenInterface
     */
    protected PermitTokenInterface $permitsTokenRepository;

    /**
     * @param PktServicesInterface $pktServicesRepository
     * @param ErrorsInterface $errorsRepository
     * @param LogsInterface $logsRepository
     * @param LogsService $logsService
     * @param PermitsNoTokenInterface $permitsNoTokenRepository
     * @param PermitTokenInterface $permitsTokenRepository
     */
    public function __construct(PktServicesInterface $pktServicesRepository, ErrorsInterface $errorsRepository,
                                LogsInterface $logsRepository, LogsService $logsService,
                                PermitsNoTokenInterface $permitsNoTokenRepository, PermitTokenInterface $permitsTokenRepository)
    {
        $this->pktServicesRepository = $pktServicesRepository;
        $this->errorsRepository = $errorsRepository;
        $this->logsRepository = $logsRepository;
        $this->logsService = $logsService;
        $this->permitsNoTokenRepository = $permitsNoTokenRepository;
        $this->permitsTokenRepository = $permitsTokenRepository;
    }

    /**
     * @param $id
     * @return JsonResponse
     */
    public function details($id): JsonResponse
    {
        if (is_numeric($id)) {
            $service = $this->pktServicesRepository->getByIdWithRelations($id, ['user', 'statusReport', 'alerts']);

            if ($service) {
                return response()->json([
                    "data" => $service,
                ]);
            }
            return response()->json([
                "message" => 'Something went wrong',
            ], 404);
        }
        return response()->json([
            "error" => 'Not Found',
        ], 422);
    }

    /**
     * @param LogsRequest $request
     * @param $id
     * @return JsonResponse
     */
    public function systemLogs(LogsRequest $request, $id): JsonResponse
    {
        $service = $this->pktServicesRepository->getById($id);
        $logs = $service->systemLogs()->skip($request->skip)
            ->orderBy('created_at', 'desc')
            ->with('user')
            ->take(5)->get();

        return response()->json([
            "data" => $logs
        ]);
    }

    /**
     * @param LogsRequest $request
     * @param $id
     * @return LogsCollection
     * @throws ClientException
     */
    public function walletLogs(LogsRequest $request, $id): LogsCollection
    {
        $service = $this->pktServicesRepository->getById($id);
        $logs = $this->logsService->getLogs($service, 'wallet', $request->skip);

        return new LogsCollection($logs);
    }

    /**
     * @param LogsRequest $request
     * @param $id
     * @return LogsCollection
     * @throws ClientException
     */
    public function packetCryptLogs(LogsRequest $request, $id): LogsCollection
    {
        $service = $this->pktServicesRepository->getById($id);
        $logs = $this->logsService->getLogs($service, 'packetcrypt', $request->skip);

        return new LogsCollection($logs);
    }

    /**
     * @param LogsRequest $request
     * @param $id
     * @return JsonResponse
     */
    public function ipAddresses(LogsRequest $request, $id): JsonResponse
    {
        $service = $this->pktServicesRepository->getById($id);

        $ipAddresses = $service->ipAddresses()->skip($request->skip)->orderBy('updated_at', 'desc')->take(3)->get();
        return response()->json([
            "data" => $ipAddresses
        ]);
    }

    /**
     * @param LogsRequest $request
     * @param $id
     * @return LogsCollection
     * @throws ClientException
     */
    public function nodeRunnerLogs(LogsRequest $request, $id): LogsCollection
    {
        $service = $this->pktServicesRepository->getById($id);
        $logs = $this->logsService->getLogs($service, 'noderunner', $request->skip);

        return new LogsCollection($logs);
    }

    /**
     * @param LogsRequest $request
     * @param $id
     * @return ErrorsCollection
     */
    public function alertLogs(LogsRequest $request, $id): ErrorsCollection
    {
        $service = $this->pktServicesRepository->getById($id);
        $logs = $this->errorsRepository->getByService($service, $request->skip);

        return new ErrorsCollection($logs);
    }

    /**
     * @param Request $request
     * @param $id
     * @return PermitsNoTokenCollection
     */
    public function permitsNoTokenLogs(Request $request, $id): PermitsNoTokenCollection
    {
        $service = $this->pktServicesRepository->getById($id);
        $logs = $this->permitsNoTokenRepository->getPermitNoTokenLogs($service, $request->skip);

        return new PermitsNoTokenCollection($logs);
    }

    /**
     * @param Request $request
     * @param $id
     * @return PermitsTokenCollection
     * @throws ClientException
     */
    public function permitsTokenLogs(Request $request, $id): PermitsTokenCollection
    {
        $service = $this->pktServicesRepository->getById($id);
        $logs = $this->permitsTokenRepository->getPermitTokenLogs($service, $request->skip);

        return new PermitsTokenCollection($logs);
    }

    /**
     * @param Request $request
     * @param $id
     * @return JsonResponse
     */
    public function createActivityLog(Request $request, $id): JsonResponse
    {
        try {
            $service = $this->pktServicesRepository->getById($id);
            $user = auth()->user();

            $text = $request->action == 'freeze' ? 'Freeze' : ($request->action == 'unfreeze' ? 'Unfreeze' : $request->text);

            DB::beginTransaction();

            $this->freezeService($request->action, $id);
            $data = [
                'user_id'    => $user->ID,
                'text'       => $text,
                'subsystem'  => 'system',
                'type'       => $request->action,
                'service_id' => $service->id,
            ];

            $service->systemLogs()->create($data);
            DB::commit();

            return response()->json([
                "success" => true
            ]);
        } catch (Exception $exception) {
            DB::rollBack();
            captureException($exception);
            return response()->json([
                "success" => false
            ]);
        }
    }

    /**
     * @param $action
     * @param $id
     */
    protected function freezeService($action, $id)
    {
        if ($action == 'freeze') {
            $serviceData = [
                'freeze' => true
            ];
            $this->pktServicesRepository->update($id, $serviceData);
        } else if ($action == 'unfreeze') {
            $serviceData = [
                'freeze' => false
            ];
            $this->pktServicesRepository->update($id, $serviceData);
        }
    }

}
