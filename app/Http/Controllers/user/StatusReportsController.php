<?php

namespace App\Http\Controllers\user;

use App\Contracts\PktServicesInterface;
use App\Http\Controllers\Controller;
use App\Http\Resources\StatusReportResource;

class StatusReportsController extends Controller
{
    /**
     * @var PktServicesInterface
     */
    protected PktServicesInterface $pktServicesRepository;

    /**
     * StatusReportsController constructor.
     * @param PktServicesInterface $pktServicesRepository
     */
    public function __construct(PktServicesInterface $pktServicesRepository)
    {
        $this->pktServicesRepository = $pktServicesRepository;
    }

    /**
     * @param $id
     * @return StatusReportResource|array
     */
    public function getStatusReport($id)
    {
        $service = $this->pktServicesRepository->getById($id);
        $report = $service->statusReport;
        if ($service && $report) {
            return new StatusReportResource($report);
        }
        return [];
    }
}
