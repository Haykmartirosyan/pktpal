import React, {Component} from 'react'
import AdminHeader from "./Layouts/Header";
import {balance, pktNumber} from "../../Helpers/StatisticsHelpers";
import {Link} from "react-router-dom";
import OrderIcon from "../../../../../public/images/icons/arrows-scroll-v.svg";
import {Load} from "../../../components/Loadings/Load";
import styles from '../../user/Dashboard/Pkt/Statisctics.module.scss';
import Select from 'react-select';
import Switch from "react-switch";
import Tooltip from "rc-tooltip/es";
import arraySort from 'array-sort'
import AssignConfirmation from './Modals/AssignConfirmation'
import Emitter from "../../../services/emitter";
import {handleShutDownHelper} from "../../Helpers/AdminHelpers";
import ReactPaginate from 'react-paginate';
import * as Sentry from "@sentry/react";
import {getSettings} from "../../Helpers/SettingsHelpers";

class Dashboard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            services: [],
            skip: 0,
            showLoading: true,
            orderedUsers: [],
            walletAddressOrder: false,
            orderedByStatus: false,
            deviceStatusOrder: false,
            selectKey: Math.random(),
            searchQuery: '',
            typing: false,
            typingTimeout: 0,
            shutDownLoad: false,
            shutDownDeviceId: '',
            offlineFilterTypes: [
                {
                    key: "Cubes offline for more than a week",
                    value: "more_than_a_week"
                },
                {
                    key: "Cubes offline for more than two weeks",
                    value: "more_than_two_weeks"
                },
                {
                    key: "Cubes offline for a month",
                    value: "a_month"
                },
                {
                    key: "Cubes offline for more than a month",
                    value: "more_than_a_month"
                },
                {
                    key: "Cubes never online",
                    value: "never_online"
                },
                {
                    key: "All cubes",
                    value: ""
                }
            ],
            offlineType: '',
            currentPage: 0,
            servicesLoading: true,
            statusOrderByAsc: false,
            clickedStatus: false,
            showLevelLoading: false,
            disabledMiningLoading: '',
            walletsOrder: false,
            disabledMined24Loading: '',
            showMined24Loading: false
        };
        this.handleSearchQuery = this.handleSearchQuery.bind(this);
        this.handleOfflineFilter = this.handleOfflineFilter.bind(this);
        this.handleSearchLength = this.handleSearchLength.bind(this)

    }

    componentDidMount() {
        let _this = this;

        let offlineType = new URLSearchParams(this.props.location.search).get("type")
        if (offlineType) {
            _this.handleOfflineFilter(offlineType)
        } else {
            this.getMainData();
        }

        Emitter.on('confirmAssign', (data) => {
            _this.assignToUser(null, data.data.service, data.data.userId)
        });

        push.subscribe('result-shutdown').bind('App\\Events\\ShutDownResultEvent', function (data) {
            console.log('result-shutdown', data)
            if (data.id == _this.state.shutDownDeviceId) {
                _this.setState({
                    shutDownLoad: false,
                    shutDownDeviceId: '',
                })
            }
        });

    }

    generateOrders() {
        let _this = this;
        let orders = [];

        if (_this.state.clickedStatus) {
            let orderByStatus = {
                'online': _this.state.statusOrderByAsc ? 'desc' : 'asc'
            }
            orders.push(orderByStatus)
        }

        if (this.state.walletsOrder) {
            let orderByWallet = {
                'wallet_address': _this.state.walletAddressOrder ? 'desc' : 'asc'
            }
            orders.push(orderByWallet)
        }

        return orders;
    }

    getMainData() {
        let _this = this;
        let data = {
            params: {
                skip: _this.state.skip,
                q: _this.state.searchQuery,
                offlineType: _this.state.offlineType,
                orders: _this.generateOrders(),
            }
        }
        axios.get(api_routes.admin.dashboard.main(), data).then(response => {
            return response;
        }).then(json => {
            let pagesCount = Math.ceil(+json.data.totalAmount / 50)
            _this.setState({
                pagesCount: pagesCount,
            })
            if (json.data.services.length) {
                _this.setState({
                    services: json.data.services,
                }, () => {
                    _this.getOrderedUsers().then((json) => {
                        _this.setState({
                            showLoading: false,
                            servicesLoading: false,
                            selectKey: Math.random(),
                            orderedUsers: json.data.orderedUsers,
                        });
                    })
                });
            } else {
                _this.setState({
                    showLoading: false,
                    servicesLoading: false,
                    selectKey: Math.random()
                });
            }
        }).catch(error => {
            Sentry.captureException(error);
            console.log('error', error)
        });

    }

    getOrderedUsers() {
        return new Promise((resolve, reject) => {
            axios.get(api_routes.admin.dashboard.orderedUsers()).then(response => {
                return response;
            }).then(json => {
                resolve(json);
            }).catch(error => {
                Sentry.captureException(error);
                reject(error)
            });
        })
    }

    nextPage(e) {
        this.setState({
            skip: this.state.skip = e.selected * 50,
            currentPage: e.selected,
            showLoading: true
        });
        this.getMainData();
    }


    orderByPKTWallet() {
        this.setState({
            walletAddressOrder: !this.state.walletAddressOrder,
            walletsOrder: true,
            services: [],
            servicesLoading: false,
            showLoading: true
        }, () => {
            this.getMainData();
        })
    }

    orderByStatus() {
        this.setState({
            deviceStatusOrder: !this.state.deviceStatusOrder,
            clickedStatus: true,
            statusOrderByAsc: !this.state.statusOrderByAsc,
            services: [],
            orderedByStatus: true,
            servicesLoading: false,
            showLoading: true
        }, () => {
            this.getMainData();
        })
    }

    assignToUser(event, service, userId = null) {
        let _this = this;
        service.user_id = !userId ? event.ID : userId;
        let assignedDevice = []
        assignedDevice.push(service)
        let data = {
            assignedDevices: assignedDevice
        }

        axios.post(api_routes.admin.dashboard.assignDeviceToUser(), data).then(response => {
            return response;
        }).then(json => {
            if (json.data.success) {
                $('#assignConfirmation').modal('hide');
                _this.setState({
                    showLoading: true,
                    skip: 0,
                    services: []
                }, () => {
                    _this.getMainData();
                })
                Emitter.emit('deviceAssigned');
            }

        }).catch((error) => {
            Sentry.captureException(error);
            console.log(error)
        });
    }

    confirmAssignToUser(event, service) {
        let data = {
            'user_id': event.ID,
            'service': service,
        }
        Emitter.emit('showAssignConfirmation', {data});
    }

    handleShutDown(checked, id) {
        handleShutDownHelper(checked, id).then(json => {
            if (json.data.success) {
                this.setState({
                    shutDownLoad: true,
                    shutDownDeviceId: id,
                })
            }
        }).catch((error) => {
            Sentry.captureException(error);
            console.log(error)
        });
    }

    handleSearchLength(e) {
        this.setState({
            searchQuery: e.target.value,
        })
    }

    handleSearchQuery(e = null) {
        let _this = this;
        if (_this.state.typingTimeout) {
            clearTimeout(_this.state.typingTimeout);
        }
        if ((e.key === 'Enter' && _this.state.searchQuery.length > 2) || ((e.key === 'Backspace' || e.key === 'Delete') && _this.state.searchQuery.length === 1)) {
            _this.setState({
                typing: false,
                typingTimeout: setTimeout(function () {
                    _this.setState({
                        skip: 0,
                        currentPage: 0,
                        servicesLoading: true,
                        services: [],
                    }, () => {
                        _this.getMainData();
                    })
                }, 1000)
            });
        }
    }

    handleOfflineFilter(type) {
        this.setState({
            offlineType: type,
            skip: 0,
            servicesLoading: true,
            services: [],
            currentPage: 0,
        }, () => this.getMainData())
    }

    getName(service) {
        let found = this.state.orderedUsers.find(opt => opt.ID === service.user_id)
        if (found) {
            return found.first_name && found.last_name ? found.first_name + ' ' + found.last_name : found.display_name
        }
    }

    getServiceMiningLevel(id) {
        let _this = this;
        let data = {
            params: {
                fromAdmin: true
            }
        };

        this.setState({
            showLevelLoading: true
        })
        getSettings(id, data).then((data) => {
            if (data.data) {
                if (data.data.options.recommendedPool) {
                    let found = _this.state.services.find(elem => elem.id == id)
                    found.mining_level = data.data.options.recommendedPool
                }
            }
            _this.setState({
                services: _this.state.services,
                showLevelLoading: false,
                disabledMiningLoading: id
            }, () => {
                setTimeout(() => {
                    _this.setState({
                        disabledMiningLoading: ''
                    })
                }, 2500)
            })
        });
    }


    getMining24(walletAddress, id) {
        let _this = this;
        _this.setState({
            showMined24Loading: true
        })

        balance(walletAddress).then((data) => {
            let found = _this.state.services.find(elem => elem.id === id);
            found.mined24 = data.balance ? pktNumber(data.mined24) : 0;
            _this.setState({
                services: _this.state.services,
                showMined24Loading: false,
                disabledMined24Loading: id
            }, () => {
                setTimeout(() => {
                    _this.setState({
                        disabledMined24Loading: ''
                    })
                }, 3000)
            })
        }).catch(() => {
            _this.setState({
                showMined24Loading: false
            })
        })
    }

    render() {
        return (
            <div className="content">
                <AdminHeader/>
                {!this.state.showLoading ? (
                    <div className="container-fluid mt-4">
                        <div className="row">
                            <div className="col-12 mt-4">
                                <div className={`p-0 pl-md-4 pr-md-4`}>
                                    <div
                                        className={`flex justify-content-between`}>

                                        <input type="text"
                                               placeholder={'Search'}
                                               defaultValue={this.state.searchQuery}
                                               onChange={(e) => this.handleSearchLength(e)}
                                               onKeyDown={(e) => this.handleSearchQuery(e)}
                                               className={`p-2 mb-2 col-md-3 col-xs-12 radius-5 bg-white border`}/>


                                        <div className={`flex align-items-center`}>
                                            <Link
                                                to={{pathname: "/admin/settings"}}
                                                className={`font-500 btn btn-link text-black mr-3`}>
                                                Settings
                                            </Link>

                                            <div className="dropdown">
                                                <button className="dropdown-toggle bg-transparent" type="button"
                                                        id="dropdownMenuButton" data-toggle="dropdown"
                                                        aria-haspopup="true"
                                                        aria-expanded="false">
                                                    <i className="fas fa-filter"/>
                                                </button>
                                                <ul className="dropdown-menu dropdown-menu-right"
                                                    aria-labelledby="dropdownMenuButton">
                                                    {this.state.offlineFilterTypes.map((type, index) => {
                                                        return (
                                                            <li key={index}
                                                                className="dropdown-item cursor-pointer"
                                                                onClick={() => this.handleOfflineFilter(type.value)}>
                                                                {type.key}
                                                            </li>
                                                        )
                                                    })}
                                                </ul>
                                            </div>
                                        </div>


                                    </div>
                                    {!this.state.servicesLoading ? (
                                        this.state.services.length ? (
                                            <div>
                                                <table
                                                    className={`table table-responsive table-borderless d-sm-table ${styles.devicesTable}`}>
                                                    <thead>
                                                    <tr>
                                                        <th scope="col" className={`font-weight-normal text-nowrap`}>PKT
                                                            Address
                                                            <button
                                                                className={'bg-white'}
                                                                onClick={() => this.orderByPKTWallet()}>
                                                                <img src={OrderIcon} alt="" className={'ml-3'}/>
                                                            </button>
                                                        </th>
                                                        <th scope="col" className={`font-weight-normal text-nowrap`}>MAC
                                                            Address
                                                        </th>
                                                        <th scope="col"
                                                            className={`font-weight-normal text-nowrap`}>Full
                                                            Name
                                                        </th>
                                                        <th scope="col"
                                                            className={`font-weight-normal text-nowrap`}>Device
                                                            Status
                                                            <button
                                                                className={'bg-white'}
                                                                onClick={() => this.orderByStatus(true)}>
                                                                <img src={OrderIcon} alt="" className={'ml-3'}/>
                                                            </button>
                                                        </th>
                                                        <th scope="col"
                                                            className={`font-weight-normal text-nowrap`}>Last
                                                            online
                                                        </th>
                                                        <th scope="col" className={`font-weight-normal text-nowrap`}>
                                                            Total mining income
                                                        </th>
                                                        <th scope="col" className={`font-weight-normal text-nowrap`}>
                                                            Mined in last 24h
                                                        </th>
                                                        <th scope="col" className={`font-weight-normal text-nowrap`}>
                                                            Mining level
                                                        </th>
                                                        <th></th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>

                                                    {this.state.services.map((pktService, index) => {
                                                        return (
                                                            <tr key={index}
                                                                className={`background-gray`}>
                                                                <td className={`align-middle radius-left-bottom-8 radius-left-top-8`}>
                                                                    <div
                                                                        className="flex justify-content-between align-items-center">
                                                                        {pktService.type == 'rack' ? (
                                                                            <Tooltip placement="top" trigger={['hover']}
                                                                                     overlay={<span>Rack mode</span>}>
                                                                                <div>
                                                                                    <Link
                                                                                        to={{pathname: "/admin/pkt/details/" + pktService.id}}
                                                                                        className={`text-black`}>
                                                                                        <u>{pktService.wallet_address}</u>

                                                                                    </Link>
                                                                                </div>
                                                                            </Tooltip>

                                                                        ) : (
                                                                            <Link
                                                                                to={{pathname: "/admin/pkt/details/" + pktService.id}}
                                                                                className={`text-black`}>
                                                                                <u>{pktService.wallet_address}</u>

                                                                            </Link>
                                                                        )}

                                                                        <Tooltip placement="top" trigger={['hover']}
                                                                                 overlay={(!pktService.online || pktService.freeze === 1) && !pktService.user_id ? 'Device is offline' : 'Shut down'}>

                                                                            {!this.state.shutDownLoad && !this.state.shutDownDeviceId
                                                                            || (this.state.shutDownDeviceId !== pktService.id) ? (
                                                                                <Switch
                                                                                    onChange={e => this.handleShutDown(e, pktService.id)}
                                                                                    disabled={!!pktService.user_id || !pktService.online || pktService.freeze === 1}
                                                                                    onColor={'#023DB5'}
                                                                                    checkedIcon={false}
                                                                                    uncheckedIcon={false}
                                                                                    width={38}
                                                                                    className={`${pktService.wallet_address ? 'ml-3' : null}`}
                                                                                    height={24}
                                                                                    checked={!pktService.shut_down}/>

                                                                            ) : (
                                                                                <div
                                                                                    className="spinner-border spinner-border-sm color-dark-blue mr-3 mt-2"
                                                                                    role="status">
                                                                                </div>
                                                                            )}

                                                                        </Tooltip>
                                                                    </div>

                                                                </td>
                                                                <td className={`align-middle`}>
                                                                    <Link
                                                                        to={{pathname: "/admin/pkt/details/" + pktService.id}}
                                                                        className={`text-black`}>
                                                                        <span>{pktService.mac_address}</span>

                                                                    </Link>
                                                                </td>
                                                                <td className={`align-middle`}>

                                                                    <Select
                                                                        key={this.state.selectKey}
                                                                        onChange={(e) => !pktService.user_id ? this.assignToUser(e, pktService) : this.confirmAssignToUser(e, pktService)}
                                                                        getOptionLabel={(e) => e.first_name && e.last_name ? e.first_name + ' ' + e.last_name : e.display_name}
                                                                        isOptionSelected={(e) => e.ID == pktService.user_id}
                                                                        placeholder={''}
                                                                        value={this.state.orderedUsers.find(opt => opt.ID === pktService.user_id)}
                                                                        options={this.state.orderedUsers}
                                                                        IndicatorSeparator={() => undefined}
                                                                        className={`${styles.assignToUser}`}
                                                                    />
                                                                </td>
                                                                <td className={`align-middle`}>
                                                                    <Link
                                                                        to={{pathname: "/admin/pkt/details/" + pktService.id}}
                                                                        className={`text-black`}>
                                                                        {pktService.alerts.length && (!pktService.online || pktService.freeze === 1) ? (

                                                                            <div
                                                                                className="flex justify-content-start align-items-center">
                                                                                <svg width="16" height="17"
                                                                                     viewBox="0 0 16 17"
                                                                                     fill="none"
                                                                                     xmlns="http://www.w3.org/2000/svg">
                                                                                    <path fillRule="evenodd"
                                                                                          clipRule="evenodd"
                                                                                          d="M0 18H2V8H8V10H16V2H9V0H0V18ZM8 2H2V6H9V8H14V4H8V2Z"
                                                                                          fill="#F07300"/>
                                                                                </svg>
                                                                                <span className={'pl-3'}>Alert</span>
                                                                            </div>

                                                                        ) : (
                                                                            !pktService.online || pktService.freeze === 1 ? (
                                                                                <div
                                                                                    className="flex justify-content-start align-items-center">
                                                                                    <svg width="10" height="10"
                                                                                         viewBox="0 0 10 10"
                                                                                         fill="none"
                                                                                         xmlns="http://www.w3.org/2000/svg">
                                                                                        <circle cx="5" cy="5" r="5"
                                                                                                fill="#E10000"/>
                                                                                    </svg>

                                                                                    <span
                                                                                        className={'pl-3'}>Offline</span>
                                                                                </div>
                                                                            ) : (
                                                                                <div
                                                                                    className="flex justify-content-start align-items-center">
                                                                                    <svg width="10" height="10"
                                                                                         viewBox="0 0 10 10"
                                                                                         fill="none"
                                                                                         xmlns="http://www.w3.org/2000/svg">
                                                                                        <circle cx="5" cy="5" r="5"
                                                                                                fill="#009229"/>
                                                                                    </svg>
                                                                                    <span className={'pl-3'}>OK</span>
                                                                                </div>
                                                                            )
                                                                        )}
                                                                    </Link>
                                                                </td>
                                                                <td className={`align-middle`}>
                                                                    <Link
                                                                        to={{pathname: "/admin/pkt/details/" + pktService.id}}
                                                                        className={`text-black`}>
                                                                        {pktService.status_report ? moment(pktService.status_report.updated_at).format('DD/MM/YY HH:mm:ss') : '-'}
                                                                    </Link>
                                                                </td>

                                                                <td className={`align-middle`}>
                                                                    <Link
                                                                        to={{pathname: "/admin/pkt/details/" + pktService.id}}
                                                                        className={`text-black`}>
                                                                        {pktService.status_report ? pktNumber(pktService.status_report.wallet_balance) + ' PKT' : '-'}
                                                                    </Link>
                                                                </td>
                                                                <td className={`align-middle text-center`}>

                                                                    <Tooltip placement="top" trigger={['click']}
                                                                             overlay={
                                                                                 !this.state.showMined24Loading ?
                                                                                     <span
                                                                                         className={'text-capitalize'}>
                                                                                         {pktService.mined24} PKT
                                                                                     </span>
                                                                                     :
                                                                                     <div
                                                                                         className="spinner-border spinner-border-sm font-14"
                                                                                         role="status">
                                                                                     </div>
                                                                             }>
                                                                        <button
                                                                            className={'bg-transparent'}
                                                                            onClick={() => this.state.disabledMined24Loading != pktService.id ? this.getMining24(pktService.wallet_address, pktService.id) : null}>
                                                                            <i className="fa fa-eye"
                                                                               aria-hidden="true"/>
                                                                        </button>
                                                                    </Tooltip>


                                                                </td>
                                                                <td className={`align-middle text-center`}>
                                                                    <Tooltip placement="top" trigger={['click']}
                                                                             overlay={
                                                                                 !this.state.showLevelLoading ?
                                                                                     <span
                                                                                         className={'text-capitalize'}>
                                                                                         {pktService.mining_level}
                                                                                     </span>
                                                                                     :
                                                                                     <div
                                                                                         className="spinner-border spinner-border-sm font-14"
                                                                                         role="status">
                                                                                     </div>
                                                                             }>
                                                                        <button
                                                                            className={'bg-transparent text-nowrap '}
                                                                            onClick={() => this.state.disabledMiningLoading != pktService.id ? this.getServiceMiningLevel(pktService.id) : null}>
                                                                            <i className="fa fa-eye"
                                                                               aria-hidden="true"/>
                                                                        </button>
                                                                    </Tooltip>
                                                                </td>
                                                                <td className={`align-middle radius-right-bottom-8 radius-right-top-8`}>
                                                                    <a
                                                                        target={'_blank'}
                                                                        href={"/admin/service/print?name=" + this.getName(pktService) + "&mac_address=" + pktService.mac_address}
                                                                        className={`text-black`}>
                                                                        <i className="fas fa-print fa-lg"/>
                                                                    </a>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}

                                                    </tbody>
                                                </table>
                                                <ReactPaginate
                                                    nextLabel=">"
                                                    onPageChange={(e) => this.nextPage(e)}
                                                    pageRangeDisplayed={3}
                                                    marginPagesDisplayed={2}
                                                    pageCount={this.state.pagesCount}
                                                    previousLabel="<"
                                                    pageClassName="page-item"
                                                    pageLinkClassName="page-link color-dark-blue"
                                                    previousClassName="page-item"
                                                    previousLinkClassName="page-link color-dark-blue"
                                                    nextClassName="page-item"
                                                    nextLinkClassName="page-link color-dark-blue"
                                                    breakLabel="..."
                                                    breakClassName="page-item"
                                                    breakLinkClassName="page-link color-dark-blue"
                                                    containerClassName="pagination flex justify-content-center"
                                                    activeLinkClassName="background-dark-blue text-white"
                                                    renderOnZeroPageCount={null}
                                                    forcePage={this.state.currentPage}
                                                />
                                            </div>

                                        ) : (
                                            <div className={`text-center`}>
                                                <h3>No results found</h3>
                                            </div>
                                        )
                                    ) : (
                                        <Load/>
                                    )}

                                </div>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div>
                        <Load/>
                    </div>
                )}
                <AssignConfirmation/>
            </div>
        )
    }
}

export default Dashboard
