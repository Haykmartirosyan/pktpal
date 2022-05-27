import React, {Component} from 'react'
import AdminHeader from "./Layouts/Header";
import {balance, mining, pktNumber} from "../../Helpers/StatisticsHelpers";
import {Load} from "../../../components/Loadings/Load";
import styles from "../../user/Dashboard/Pkt/Statisctics.module.scss";
import Emitter from "../../../services/emitter";
import ShowLog from "./Modals/ShowLog";
import ExportSeed from "../../Modals/ExportSeed";
import Tooltip from "rc-tooltip";
import RebootIcon from "../../../../../public/images/icons/danger.svg";
import {getSettings, miningLevels, updateSettings} from "../../Helpers/SettingsHelpers";
import {
    changeDeviceEnv,
    getAlertLogs,
    getIPAddresses,
    getNodeRunnerLogs,
    getPacketCryptLogs,
    getPktService,
    getSystemLogs,
    getWalletLogs,
    rebootDevice,
    getPermitsNoTokenAlerts,
    getPermitsTokenAlerts,
    showLogMore
} from "../../Helpers/AdminHelpers";
import moment from "moment";
import * as Sentry from "@sentry/react";
import {Link} from "react-router-dom";


class Details extends Component {
    constructor(props) {
        super(props);
        this.state = {
            serviceId: props.match.params.id,
            pktService: {},
            showLoading: true,
            balance: 0,
            mined24: 0,
            minedLastMonth: 0,
            alertText: '',
            activityLogText: '',
            alertTextErrors: '',
            systemLogs: [],
            walletLogs: [],
            alertLogs: [],
            nodeRunnerLogs: [],
            ipAddresses: [],
            packetCryptLogs: [],
            permitsNoTokenAlerts: [],
            permitsTokenAlerts: [],
            systemLogTypes: {
                admin_note: 'Admin note',
                freeze: 'Freeze',
                unfreeze: 'Unfreeze',
            },
            adminLogTypes: {
                admin_note: 'Admin note',
                freeze: 'Freeze',
                unfreeze: 'Unfreeze',
                reboot: 'Reboot',
                shut_down: 'Shut Down',
            },
            skipActivityLogs: 0,
            skipAlertLogs: 0,
            skipPermitsNoTokenAlerts: 0,
            skipPermitsTokenAlerts: 0,
            skipIPAddresses: 0,
            disableLoadActivityLogs: false,
            disableLoadIPAddresses: false,
            skipPacketCryptLogs: 0,
            disableLoadPacketCryptLogs: false,
            disableLoadAlertLogs: false,
            disableLoadPermitsNoTokenAlerts: false,
            disableLoadPermitsTokenAlerts: false,
            skipWalletLogs: 0,
            skipNodeRunnerLogs: 0,
            disableLoadWalletLogs: false,
            disableNodeRunnerLogs: false,
            hideNote: false,
            activityLogAction: '',
            loadMoreLoading: false,
            disabledButton: false,
            enablingActivityLog: false,
            enablingAlertLog: false,
            enablingPermitsNoTokenAlerts: false,
            enablingPermitNoTokenAlerts: false,
            enablingPacketCryptLog: false,
            enablingWalletLog: false,
            enablingNodeRunnerLog: false,
            enablingIPAddresses: false,
            cubeScheduled: false,
            options: {
                recommendedPool: "",
            },
            recommendedPools: miningLevels,
            showSelectedPool: false,
            hideIpAddresses: false
        };

        this.handleAlertText = this.handleAlertText.bind(this);
        this.handleActivityLogText = this.handleActivityLogText.bind(this);
    }

    componentDidMount() {
        let _this = this;
        this.mountComponent();

        setInterval(() => {
            getPktService(_this.state.serviceId).then(response => {
                _this.setState({
                    pktService: response.data,
                    showLoading: false
                });
            })
        }, 60 * 1000)
    }

    mountComponent() {
        let _this = this;
        _this.setState({
            showLoading: true
        });
        getPktService(this.state.serviceId).then(response => {

            getSystemLogs(_this.state.serviceId, _this.state.skipActivityLogs).then(response => {

                if (!response.data.length || response.data.length < 5) {
                    _this.setState({
                        disableLoadActivityLogs: true
                    })
                }

                _this.setState({
                    systemLogs: response.data
                })

            });

            getWalletLogs(_this.state.serviceId, _this.state.skipWalletLogs).then(response => {
                if (!response.data.length || response.data.length < 5) {
                    _this.setState({
                        disableLoadWalletLogs: true
                    })
                }
                _this.setState({
                    walletLogs: response.data
                })
            });

            getPacketCryptLogs(_this.state.serviceId, _this.state.skipPacketCryptLogs).then(response => {
                if (!response.data.length || response.data.length < 5) {
                    _this.setState({
                        disableLoadPacketCryptLogs: true
                    })
                }
                _this.setState({
                    packetCryptLogs: response.data
                })
            });

            getNodeRunnerLogs(_this.state.serviceId, _this.state.skipNodeRunnerLogs).then(response => {

                if (!response.data.length || response.data.length < 5) {
                    _this.setState({
                        disableLoadNodeRunnerLogs: true
                    })
                }

                _this.setState({
                    nodeRunnerLogs: response.data
                })

            });

            getAlertLogs(_this.state.serviceId, _this.state.skipAlertLogs).then(response => {
                if (!response.data.length || response.data.length < 5) {
                    _this.setState({
                        disableLoadAlertLogs: true
                    })
                }
                _this.setState({
                    alertLogs: response.data
                })
            });

            getPermitsNoTokenAlerts(_this.state.serviceId, _this.state.skipPermitsNoTokenAlerts).then(response => {
                if (!response.data.length || response.data.length < 5) {
                    _this.setState({
                        disableLoadPermitsNoTokenAlerts: true
                    })
                }
                _this.setState({
                    permitsNoTokenAlerts: response.data
                })
            });

            getPermitsTokenAlerts(_this.state.serviceId, _this.state.skipPermitsTokenAlerts).then(response => {
                if (!response.data.length || response.data.length < 5) {
                    _this.setState({
                        disableLoadPermitsTokenAlerts: true
                    })
                }
                _this.setState({
                    permitsTokenAlerts: response.data
                })
            });

            getIPAddresses(_this.state.serviceId, _this.state.skipIPAddresses).then(response => {
                if (!response.data.length || response.data.length < 3) {
                    _this.setState({
                        disableLoadIPAddresses: true
                    })
                }
                _this.setState({
                    ipAddresses: response.data,
                    hideIpAddresses: !response.data.length
                })
            });

            let data = {
                params: {
                    fromAdmin: true
                }
            };
            getSettings(_this.state.serviceId, data).then((data) => {
                _this.setState({
                    showSelectedPool: true
                });
                if (data.data) {
                    if (data.data.days.length) {
                        _this.setState({
                            cubeScheduled: true
                        })
                    }
                    if (data.data.options.recommendedPool) {
                        _this.setState(prevState => ({
                            options: {
                                ...prevState.options, recommendedPool: data.data.options.recommendedPool
                            },
                        }));
                    }
                }
            });


            balance(response.data.wallet_address).then((data) => {
                let balance = data.balance ? pktNumber(data.balance) : '0.00';
                let mined24 = data.mined24 ? pktNumber(data.mined24) : '0.00';
                _this.setState({
                    balance: balance,
                    mined24: mined24,
                });
            });

            let start = moment().subtract(1, 'months').format('YYYY-MM-DD');
            let end = moment().format('YYYY-MM-DD');
            let period = start + '/' + end;

            mining(response.data.wallet_address, period).then((data) => {
                let minedLastMonth = 0;
                for (let i = 0; i <= data.results.length; i++) {
                    if (data.results[i]) {
                        minedLastMonth += parseInt(data.results[i].received)
                    }
                }
                _this.setState({
                    minedLastMonth: pktNumber(minedLastMonth)
                })
            });

            if (response.data.freeze == 1) {
                delete this.state.systemLogTypes.freeze
            }

            if (response.data.freeze == 0) {
                delete this.state.systemLogTypes.unfreeze
            }

            _this.setState({
                pktService: response.data,
                showLoading: false
            });
        }).catch(error => {
            if (error.response.status == 422) {
                return this.props.history.push('/admin/dashboard');
            }
            Sentry.captureException(error);
            return this.props.history.push('/404')
        })
    }


    handleAlertText(e) {
        let value = e.target.value;
        this.setState({
            alertText: value,
        });
    }

    handleActivityLogText(e) {
        let value = e.target.value;
        this.setState({
            activityLogText: value,
        });
    }

    addAlert() {
        if (!this.state.alertText) {
            this.setState({
                alertTextErrors: 'Comment is required',
            });
        } else {
            let data = {
                text: this.state.alertText
            };
            axios.post(api_routes.admin.dashboard.addAlert(this.state.serviceId), data).then(response => {
                return response;
            }).then(json => {

                if (json.data.success) {
                    this.setState({
                        alertText: '',
                        alertTextErrors: '',
                    });
                    this.mountComponent()
                }

            }).catch(error => {
                Sentry.captureException(error);
                console.log('error', error)
            });
        }
    }

    clearAlerts() {
        axios.post(api_routes.admin.dashboard.clearAlerts(this.state.serviceId)).then(response => {
            return response;
        }).then(json => {

            if (json.data.success) {
                this.setState({
                    alertText: '',
                    alertTextErrors: '',
                });
                this.mountComponent()
            }

        }).catch(error => {
            Sentry.captureException(error);
            console.log('error', error)
        });
    }

    loadMore(type) {
        let _this = this;
        if (type == 'activity') {
            _this.setState({
                loadMoreLoading: true,
                disabledButton: true,
                enablingActivityLog: true,
                skipActivityLogs: this.state.skipActivityLogs += 5
            });

            getSystemLogs(_this.state.serviceId, _this.state.skipActivityLogs).then(response => {
                if (!response.data.length || response.data.length < 5) {
                    _this.setState({
                        disableLoadActivityLogs: true
                    })
                }
                const result = [...this.state.systemLogs, ...response.data];

                _this.setState({
                    systemLogs: result,
                    loadMoreLoading: false,
                    disabledButton: false,
                    enablingActivityLog: false,
                })
            });
        } else if (type == 'packetcrypt') {
            _this.setState({
                loadMoreLoading: true,
                disabledButton: true,
                enablingPacketCryptLog: true,
                skipPacketCryptLogs: this.state.skipPacketCryptLogs += 5
            });

            getPacketCryptLogs(_this.state.serviceId, _this.state.skipPacketCryptLogs).then(response => {
                if (!response.data.length || response.data.length < 5) {
                    _this.setState({
                        disableLoadPacketCryptLogs: true
                    })
                }
                const result = [...this.state.packetCryptLogs, ...response.data];

                _this.setState({
                    packetCryptLogs: result,
                    loadMoreLoading: false,
                    disabledButton: false,
                    enablingPacketCryptLog: false,
                })
            });
        } else if (type == 'wallet') {
            _this.setState({
                loadMoreLoading: true,
                disabledButton: true,
                enablingWalletLog: true,
                skipWalletLogs: this.state.skipWalletLogs += 5
            });

            getWalletLogs(_this.state.serviceId, _this.state.skipWalletLogs).then(response => {
                if (!response.data.length || response.data.length < 5) {
                    _this.setState({
                        disableLoadWalletLogs: true
                    })
                }
                const result = [...this.state.walletLogs, ...response.data];

                _this.setState({
                    walletLogs: result,
                    loadMoreLoading: false,
                    disabledButton: false,
                    enablingWalletLog: false,
                })
            });
        } else if (type == 'node_runner') {
            _this.setState({
                loadMoreLoading: true,
                disabledButton: true,
                enablingNodeRunnerLog: true,
                skipNodeRunnerLogs: this.state.skipNodeRunnerLogs += 5
            });

            getNodeRunnerLogs(_this.state.serviceId, _this.state.skipNodeRunnerLogs).then(response => {
                if (!response.data.length || response.data.length < 5) {
                    _this.setState({
                        disableLoadNodeRunnerLogs: true
                    })
                }
                const result = [...this.state.nodeRunnerLogs, ...response.data];

                _this.setState({
                    nodeRunnerLogs: result,
                    loadMoreLoading: false,
                    disabledButton: false,
                    enablingNodeRunnerLog: false,
                })
            });

        } else if (type == 'alert') {
            _this.setState({
                loadMoreLoading: true,
                disabledButton: true,
                enablingAlertLog: true,
                skipAlertLogs: this.state.skipAlertLogs += 5
            });

            getAlertLogs(_this.state.serviceId, _this.state.skipAlertLogs).then(response => {
                if (!response.data.length || response.data.length < 5) {
                    _this.setState({
                        disableLoadAlertLogs: true
                    })
                }
                const result = [...this.state.alertLogs, ...response.data];

                _this.setState({
                    alertLogs: result,
                    loadMoreLoading: false,
                    disabledButton: false,
                    enablingAlertLog: false,
                })
            });
        } else if (type == 'permitsNoToken') {
            _this.setState({
                loadMoreLoading: true,
                disabledButton: true,
                enablingPermitsNoTokenAlerts: true,
                skipPermitsNoTokenAlerts: this.state.skipPermitsNoTokenAlerts += 5
            });

            getPermitsNoTokenAlerts(_this.state.serviceId, _this.state.skipPermitsNoTokenAlerts).then(response => {
                if (!response.data.length || response.data.length < 5) {
                    _this.setState({
                        disableLoadPermitsNoTokenAlerts: true
                    })
                }
                const result = [...this.state.permitsNoTokenAlerts, ...response.data];

                _this.setState({
                    permitsNoTokenAlerts: result,
                    loadMoreLoading: false,
                    disabledButton: false,
                    enablingPermitsNoTokenAlerts: false,
                })
            });
        } else if (type == 'permitsToken') {
            _this.setState({
                loadMoreLoading: true,
                disabledButton: true,
                enablingPermitsTokenAlerts: true,
                skipPermitsTokenAlerts: this.state.skipPermitsTokenAlerts += 5
            });

            getPermitsTokenAlerts(_this.state.serviceId, _this.state.skipPermitsTokenAlerts).then(response => {
                if (!response.data.length || response.data.length < 5) {
                    _this.setState({
                        disableLoadPermitsTokenAlerts: true
                    })
                }
                const result = [...this.state.permitsTokenAlerts, ...response.data];

                _this.setState({
                    permitsTokenAlerts: result,
                    loadMoreLoading: false,
                    disabledButton: false,
                    enablingPermitsTokenAlerts: false,
                })
            });
        } else if (type == 'ip') {
            _this.setState({
                loadMoreLoading: true,
                disabledButton: true,
                enablingIPAddresses: true,
                skipIPAddresses: this.state.skipIPAddresses += 3
            });

            getIPAddresses(_this.state.serviceId, _this.state.skipIPAddresses).then(response => {
                if (!response.data.length || response.data.length < 3) {
                    _this.setState({
                        disableLoadIPAddresses: true
                    })
                }
                const result = [...this.state.ipAddresses, ...response.data];

                _this.setState({
                    ipAddresses: result,
                    loadMoreLoading: false,
                    disabledButton: false,
                    enablingIPAddresses: false,
                })
            });
        }
    }

    changeLogAction(e) {
        this.setState({
            hideNote: e.target.value !== 'admin_note',
            activityLogText: e.target.value === 'admin_note' ? this.state.activityLogText : '',
            activityLogAction: e.target.value,
        })
    }

    addActivityLog() {
        if (this.state.activityLogAction) {

            let obj = {};
            if (this.state.activityLogAction == 'unfreeze') {
                obj = Object.assign(this.state.systemLogTypes, {freeze: "Freeze"})
            }

            if (this.state.activityLogAction == 'freeze') {
                obj = Object.assign(this.state.systemLogTypes, {unfreeze: "Unfreeze"})
            }

            this.setState({
                systemLogTypes: obj
            });

            let data = {
                text: this.state.activityLogText,
                action: this.state.activityLogAction
            };
            axios.post(api_routes.admin.dashboard.addActivityLog(this.state.serviceId), data).then(response => {
                return response;
            }).then(json => {
                if (json.data.success) {
                    this.setState({
                        activityLogAction: '',
                        activityLogText: '',
                        hideNote: false,
                    });
                    this.mountComponent()
                }

            }).catch(error => {
                Sentry.captureException(error);
                console.log('error', error)
            });
        }
    }

    openExportSeedModal(macAddress, walletAddress) {
        Emitter.emit('openExportSeedModal',
            {
                macAddress: macAddress,
                walletAddress: walletAddress
            }
        );
    }

    handleRecommendedPool(number) {
        this.setState(prevState => ({
            options: {
                ...prevState.options, recommendedPool: number
            },
        }));
    }

    recommendedPool() {
        let sendingData = {};
        let options = {};
        options.recommended_pool = this.state.options.recommendedPool ? this.state.options.recommendedPool : "high";
        sendingData.options = options;

        updateSettings(this.state.serviceId, sendingData)
    }

    render() {
        return (

            <div>
                <ExportSeed/>

                <div className="content">
                    <AdminHeader/>
                    {!this.state.showLoading ? (

                        <div className="container p-4">

                            <div className={'row'}>

                                <div className={'col-sm-12 col-lg-6 border radius-8 h-100'}>
                                    <div className={'mt-4'}>
                                        <div className={`d-flex justify-content-between px-3 mb-2 align-items-center`}>
                                            <span>General Information</span>
                                            {this.state.pktService.alerts.length && (!this.state.pktService.online || this.state.pktService.freeze === 1) ? (
                                                <div>
                                                    <Tooltip placement="top" trigger={['hover']}
                                                             overlay={<span>Alert</span>}>
                                                        <svg width="16" height="17" viewBox="0 0 16 17"
                                                             fill="none"
                                                             xmlns="http://www.w3.org/2000/svg">
                                                            <path fillRule="evenodd" clipRule="evenodd"
                                                                  d="M0 18H2V8H8V10H16V2H9V0H0V18ZM8 2H2V6H9V8H14V4H8V2Z"
                                                                  fill="#F07300"/>
                                                        </svg>
                                                    </Tooltip>
                                                </div>

                                            ) : (
                                                !this.state.pktService.online || this.state.pktService.freeze === 1 ? (
                                                    <div>
                                                        <Tooltip placement="top" trigger={['hover']}
                                                                 overlay={<span>Offline</span>}>
                                                            <svg width="10" height="10" viewBox="0 0 10 10"
                                                                 fill="none"
                                                                 xmlns="http://www.w3.org/2000/svg">
                                                                <circle cx="5" cy="5" r="5" fill="#E10000"/>
                                                            </svg>
                                                        </Tooltip>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <Tooltip placement="top" trigger={['hover']}
                                                                 overlay={<span>Online</span>}>
                                                            <svg width="10" height="10" viewBox="0 0 10 10"
                                                                 fill="none"
                                                                 xmlns="http://www.w3.org/2000/svg">
                                                                <circle cx="5" cy="5" r="5" fill="#009229"/>
                                                            </svg>
                                                        </Tooltip>
                                                    </div>

                                                )
                                            )}
                                        </div>
                                        {this.state.pktService.id === 9 ?
                                            !this.state.pktService.online || this.state.pktService.freeze === 1 ? (
                                                <div className={`p-3 flex justify-content-end `}>
                                                    <Tooltip placement="top" trigger={['hover']}
                                                             overlay={<span>The device is offline</span>}>
                                                        <span className={`text-black disabled`}>Switch env</span>
                                                    </Tooltip>
                                                </div>
                                            ) : (
                                                <div className={`p-3 flex justify-content-end`}>
                                                    <a href={`#`}
                                                       className={`text-black`}
                                                       onClick={() => changeDeviceEnv(this.state.serviceId)}>Switch
                                                        env</a>
                                                </div>

                                            ) : null}

                                        <div className={'background-gray radius-8'}>
                                            <p className={'p-3'}>
                                                {this.state.pktService.user ? (
                                                    <a href={`https://pktpal.com/wp-admin/user-edit.php?user_id=${this.state.pktService.user.ID}`}
                                                       className={'text-black'}>
                                                        {this.state.pktService.user.first_name ? this.state.pktService.user.first_name + ' ' + this.state.pktService.user.last_name : this.state.pktService.user.display_name}
                                                    </a>
                                                ) : (
                                                    <span>No User</span>
                                                )}

                                                <Tooltip placement="top" trigger={['hover']}
                                                         overlay={<span>Reboot</span>}>
                                                    <button
                                                        onClick={() => rebootDevice(this.state.serviceId)}
                                                        className={`float-right background-gray`}>
                                                        <img src={RebootIcon} alt="Reboot"/>
                                                    </button>
                                                </Tooltip>
                                            </p>
                                        </div>

                                        {this.state.pktService.type == 'rack' ? (
                                            <Tooltip placement="top" trigger={['hover']}
                                                     overlay={<span>Rack mode</span>}>
                                                <div className={'background-gray radius-8'}>
                                                    <p className={'p-3'}>
                                                        <a href={`https://explorer.pkt.cash/address/${this.state.pktService.wallet_address}`}
                                                           className={'text-black text-break'}>
                                                            {this.state.pktService.wallet_address ? this.state.pktService.wallet_address : '-'}
                                                        </a>
                                                    </p>
                                                </div>
                                            </Tooltip>
                                        ) : (
                                            <div className={'background-gray radius-8'}>
                                                <p className={'p-3'}>
                                                    <a href={`https://explorer.pkt.cash/address/${this.state.pktService.wallet_address}`}
                                                       className={'text-black text-break'}>
                                                        {this.state.pktService.wallet_address ? this.state.pktService.wallet_address : '-'}
                                                    </a>
                                                </p>
                                            </div>
                                        )}


                                        <div className="background-gray radius-8 ">
                                            <p className={'p-3 flex justify-content-between'}>
                                                <span>Mac Address</span>
                                                <span>{this.state.pktService.mac_address}</span>
                                            </p>
                                        </div>

                                        <div className="background-gray radius-8 ">
                                            <p className={'p-3 flex justify-content-between'}>
                                                <span> Balance according to wallet</span>
                                                <span>{this.state.balance} PKT</span>
                                            </p>
                                        </div>

                                        <div className="background-gray radius-8">
                                            <p className={'p-3 flex justify-content-between'}>
                                                <span>Balance according to Explorer</span>
                                                <span>{this.state.balance} PKT</span>
                                            </p>
                                        </div>

                                        <div className="background-gray radius-8">
                                            <p className={'p-3 flex justify-content-between'}>
                                                <span className={`flex align-items-center`}>
                                                    <span>Encryption per second</span>
                                                    <span className={`ml-2`}>
                                                        <Tooltip placement="top" trigger={['hover']}
                                                                 overlay={<span>See history</span>}>
                                                            <Link
                                                                to={{pathname: "/admin/pkt/details/encryptions/" + this.state.serviceId}}>
                                                                <svg width="15" height="15" viewBox="0 0 20 20"
                                                                     fill="none"
                                                                     xmlns="http://www.w3.org/2000/svg">
                                                                    <path d="M8.5 5H10.5V10H15.5V12H8.5V5Z"
                                                                          fill="#141414"/>
                                                                    <path fillRule="evenodd" clipRule="evenodd"
                                                                          d="M20 10C20 15.5228 15.5228 20 10 20C4.47715 20 0 15.5228 0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10ZM18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10Z"
                                                                          fill="#141414"/>
                                                                </svg>
                                                            </Link>
                                                         </Tooltip>
                                                    </span>
                                                </span>
                                                <span>{this.state.pktService.status_report && this.state.pktService.online ? this.state.pktService.status_report.encryptions_per_second : '-'}</span>
                                            </p>

                                        </div>

                                        <div className="background-gray radius-8">
                                            <p className={'p-3 flex justify-content-between'}>
                                                <span>Bandwidth</span>
                                                <span>{this.state.pktService.status_report && this.state.pktService.online ? this.state.pktService.status_report.bandwidth_used : '-'}</span>
                                            </p>
                                        </div>

                                        <div className="background-gray radius-8">
                                            <p className={'p-3 flex justify-content-between'}>
                                                <span>Version</span>
                                                <span>
                                                    {this.state.pktService.status_report && this.state.pktService.status_report.version
                                                        ? this.state.pktService.status_report.version : '-'}
                                                </span>
                                            </p>
                                        </div>

                                        <div className="background-gray radius-8">
                                            <p className={'p-3 flex justify-content-between'}>
                                                <span>Mined in last 24h</span>
                                                <span>
                                                    {this.state.mined24} PKT
                                                </span>
                                            </p>
                                        </div>

                                        <div className="background-gray radius-8">
                                            <p className={'p-3 flex justify-content-between'}>
                                                <span>Mined in last month</span>
                                                <span>
                                                    {this.state.minedLastMonth} PKT
                                                </span>
                                            </p>
                                        </div>

                                    </div>

                                    <div className={'col-lg-12 pl-0 mb-3'}>
                                        {!this.state.pktService.online || this.state.pktService.freeze === 1 ? (
                                            <Tooltip placement="top" trigger={['hover']}
                                                     overlay={<span>The device is offline</span>}>
                                                <button
                                                    className={`btn btn-light bg-white font-weight-bold radius-5 border w-100 disabled`}>
                                                    Export seed
                                                </button>
                                            </Tooltip>
                                        ) : (
                                            <button
                                                onClick={() => this.openExportSeedModal(this.state.pktService.mac_address, this.state.pktService.wallet_address)}
                                                className={`btn btn-light bg-white font-weight-bold radius-5 border w-100`}>
                                                Export seed
                                            </button>
                                        )}
                                    </div>

                                </div>

                                <div className={'col-sm-12 col-lg-6 mt-2'}>
                                    <p className={'weight-500'}>Alerts</p>

                                    {this.state.pktService.alerts.length ? (
                                        <div className={'radius-8 background-gray p-4 font-14'}>
                                            {this.state.pktService.alerts.map((alert, index) => {
                                                return (
                                                    <div key={index}>
                                                        {alert.text}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : null}

                                    <div className={'mt-3'}>
                                        <input placeholder={'Comment'} type="text"
                                               onChange={this.handleAlertText}
                                               className={`p-2 radius-8 background-gray w-100 mt-2`}/>
                                        <p className={'text-danger font-14'}>{this.state.alertTextErrors}</p>

                                        <div className="flex justify-content-end  mt-5">

                                            <button
                                                onClick={() => this.clearAlerts()}
                                                className={`btn bg-white radius-5 border font-14 mr-3 weight-500`}>
                                                Clear alert
                                            </button>
                                            <button
                                                onClick={() => this.addAlert()}
                                                className={`btn btn-primary radius-5 font-14 weight-500`}>
                                                Add comment
                                            </button>
                                        </div>
                                    </div>
                                    <div className={'mt-5 pt-2'}>
                                        <p className={'weight-500'}>IP addresses</p>
                                        {this.state.ipAddresses.length ? (
                                            <div>
                                                {this.state.ipAddresses.map((address, index) => {
                                                    return (
                                                        <div key={index}>
                                                            <div className="radius-8 background-gray font-14">
                                                                <p className={'p-3 flex justify-content-between'}>
                                                                    <span>{address.ip}</span>
                                                                    <span>
                                                                        {moment(address.updated_at).format('DD/MM/YY HH:mm')}
                                                                    </span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )
                                                })}

                                                {!this.state.disableLoadIPAddresses ? (
                                                    <div className={`text-center mb-3 mt-4`}>
                                                        <button
                                                            onClick={() => this.loadMore('ip')}
                                                            className={`${this.state.disabledButton ? 'disabled' : null}  btn font-weight-bold  radius-0 background-black text-white `}
                                                            disabled={this.state.disabledButton}>
                                                            Load more
                                                            {this.state.loadMoreLoading && this.state.enablingIPAddresses ? (
                                                                <div
                                                                    className="spinner-border spinner-border-sm font-14 ml-2"
                                                                    role="status">
                                                                </div>) : null}
                                                        </button>
                                                    </div>
                                                ) : null}
                                            </div>
                                        ) : this.state.hideIpAddresses ? null
                                            : (
                                                <div
                                                    className="spinner-border spinner-border-sm font-14 ml-2"
                                                    role="status">
                                                </div>
                                            )}

                                    </div>


                                    <div className={'mt-5 pt-2'}>
                                        <p className={'weight-500'}>Mining income</p>
                                        {this.state.showSelectedPool ? (
                                            <div>
                                                <div
                                                    className={`dropdown mt-3 text-capitalize ${styles["chevron-down"]}`}>
                                                    <div data-toggle='dropdown' aria-haspopup='true'
                                                         aria-expanded='false'
                                                         className={`form-control border background-gray radius-5`}>
                                                        {this.state.options.recommendedPool ? this.state.recommendedPools.find(pool => pool.key == this.state.options.recommendedPool).value
                                                            : this.state.recommendedPools.find(pool => pool.key == 'high').value}
                                                    </div>

                                                    <div
                                                        className='dropdown-menu w-100 p-0 shadow position-static transform-none'
                                                        aria-labelledby='dropdownMenuButton'>
                                                        <ul className="list-group list-group-flush">
                                                            {this.state.recommendedPools.map((number, index) => {
                                                                return (
                                                                    <li key={index}
                                                                        className="list-group-item list-group-item-action d-flex justify-content-start align-items-center"
                                                                        onClick={() => {
                                                                            this.handleRecommendedPool(number.key)
                                                                        }}>
                                                                        <span className={'ml-3'}>{number.value}</span>
                                                                    </li>
                                                                )
                                                            })}
                                                        </ul>
                                                    </div>
                                                </div>
                                                {this.state.cubeScheduled ? (
                                                    <small className={'text-danger'}>Cube is scheduled</small>
                                                ) : null}
                                                <div className={`text-right mt-3`}>
                                                    <Tooltip placement="top" trigger={'click'} overlay={'Saved'}>
                                                        <button
                                                            onClick={() => this.recommendedPool()}
                                                            className={`btn btn-primary radius-5 font-14 weight-500 text-white`}>
                                                            Save
                                                        </button>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                className="spinner-border spinner-border-sm font-14 ml-2"
                                                role="status">
                                            </div>
                                        )}

                                    </div>

                                </div>


                                <div className={'col-sm-12 col-lg-12 mt-5  font-14  border radius-8'}>
                                    <div className={'mt-4'}>
                                        <p>Activity log</p>

                                        <div className={'mt-3'}>
                                            <div className="flex justify-content-between mb-5">

                                                <input placeholder={'Add administrative note'} type="text"
                                                       onChange={this.handleActivityLogText}
                                                       className={`p-2 radius-5 background-gray w-75 font-14 ${this.state.hideNote ? 'invisible' : null}`}/>

                                                <select name="" id=""
                                                        defaultValue={this.state.activityLogAction}
                                                        onChange={(e) => this.changeLogAction(e)}
                                                        className={'p-2 font-14 radius-5 background-gray'}>
                                                    <option value="" disabled={true}>Action</option>

                                                    {Object.keys(this.state.systemLogTypes).map((type, index) => {
                                                        return (
                                                            <option key={index}
                                                                    value={type}>{this.state.systemLogTypes[type]}
                                                            </option>
                                                        )
                                                    })}
                                                </select>
                                                <button
                                                    onClick={() => this.addActivityLog()}
                                                    className={` btn btn-primary radius-5 font-14 weight-500`}>
                                                    Submit
                                                </button>
                                            </div>
                                        </div>


                                        {this.state.systemLogs.length ? (
                                            <div>
                                                <table
                                                    className={`table table-responsive table-borderless d-sm-table ${styles.devicesTable}`}>
                                                    <thead>
                                                    <tr>
                                                        <th scope="col" className={`font-weight-normal`}>Date</th>
                                                        <th scope="col" className={`font-weight-normal`}>Alert</th>
                                                        <th scope="col" className={`font-weight-normal`}>Type</th>
                                                        <th scope="col" className={`font-weight-normal`}>Source</th>
                                                        <th scope="col" className={`font-weight-normal`}>Description
                                                        </th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {this.state.systemLogs.map((log, index) => {
                                                        return (
                                                            <tr key={index}
                                                                className={`background-gray`}>
                                                                <td>

                                                                    {moment(log.created_at).utc(true).format('DD/MM/YY HH:mm:ss')}
                                                                </td>
                                                                <td>
                                                                    {log.user ? (
                                                                        <div
                                                                            className="flex justify-content-start align-items-center">
                                                                            <svg width="14" height="14"
                                                                                 viewBox="0 0 14 14" fill="none"
                                                                                 xmlns="http://www.w3.org/2000/svg">
                                                                                <path
                                                                                    d="M9.53134 5.43826C9.76701 5.2186 9.78 4.84948 9.56034 4.61381C9.34069 4.37813 8.97157 4.36515 8.73589 4.5848L7.02899 6.17568L5.4381 4.46878C5.21845 4.2331 4.84933 4.22012 4.61366 4.43977C4.37798 4.65943 4.36499 5.02854 4.58465 5.26422L6.17553 6.97113L4.46862 8.56201C4.23295 8.78166 4.21996 9.15078 4.43962 9.38646C4.65927 9.62213 5.02839 9.63512 5.26407 9.41546L6.97097 7.82458L8.56186 9.53149C8.78151 9.76716 9.15063 9.78015 9.3863 9.56049C9.62198 9.34084 9.63497 8.97172 9.41531 8.73605L7.82443 7.02914L9.53134 5.43826Z"
                                                                                    fill="#EE152F"/>
                                                                                <path fillRule="evenodd"
                                                                                      clipRule="evenodd"
                                                                                      d="M0.583344 7.00016C0.583344 3.45634 3.45618 0.583496 7.00001 0.583496C10.5438 0.583496 13.4167 3.45634 13.4167 7.00016C13.4167 10.544 10.5438 13.4168 7.00001 13.4168C3.45618 13.4168 0.583344 10.544 0.583344 7.00016ZM7.00001 12.2502C4.10052 12.2502 1.75001 9.89966 1.75001 7.00016C1.75001 4.10067 4.10052 1.75016 7.00001 1.75016C9.8995 1.75016 12.25 4.10067 12.25 7.00016C12.25 9.89966 9.8995 12.2502 7.00001 12.2502Z"
                                                                                      fill="#EE152F"/>
                                                                            </svg>
                                                                            <span className={'pl-3'}>Alert</span>
                                                                        </div>
                                                                    ) : (
                                                                        '-'
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    {log.user ? (
                                                                        <span>{this.state.adminLogTypes[log.type]}</span>
                                                                    ) : (
                                                                        <span>Spend</span>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    {log.user ? (
                                                                        <span>{log.user.first_name ? log.user.first_name + ' ' + log.user.last_name : log.user.display_name}</span>
                                                                    ) : (
                                                                        <span>Server</span>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    <a href="#" role={'button'}
                                                                       className={'text-black'}
                                                                       onClick={(e) => showLogMore(e, log.text, log.created_at, 'Activity log')}>
                                                                        {log.text.length > 80 ? log.text.substring(0, 80).toString() + '...' : log.text}
                                                                    </a>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
                                                    </tbody>
                                                </table>

                                                {!this.state.disableLoadActivityLogs ? (
                                                    <div className={`text-center mb-3`}>
                                                        <button
                                                            onClick={() => this.loadMore('activity')}
                                                            className={`${this.state.disabledButton ? 'disabled' : null}  btn font-weight-bold  radius-0 background-black text-white `}
                                                            disabled={this.state.disabledButton}>
                                                            Load more
                                                            {this.state.loadMoreLoading && this.state.enablingActivityLog ? (
                                                                <div
                                                                    className="spinner-border spinner-border-sm font-14 ml-2"
                                                                    role="status">
                                                                </div>) : null}
                                                        </button>
                                                    </div>
                                                ) : null}

                                            </div>
                                        ) : null}


                                    </div>

                                </div>


                                <div className={'col-sm-12 col-lg-12 font-14 mt-4 border radius-8'}>
                                    <div className={'mt-4'}>
                                        <p>Packetcrypt logs</p>

                                        {this.state.packetCryptLogs.length ? (
                                            <div>
                                                <table
                                                    className={`table table-responsive table-borderless d-sm-table ${styles.devicesTable}`}>
                                                    <thead>
                                                    <tr>
                                                        <th scope="col" className={`font-weight-normal`}>Date</th>
                                                        <th scope="col" className={`font-weight-normal`}>Description
                                                        </th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {this.state.packetCryptLogs.map((log, index) => {
                                                        return (
                                                            <tr key={index}
                                                                className={`background-gray`}>
                                                                <td>
                                                                    {moment(log.created_at).utc(true).local().format('DD/MM/YY HH:mm:ss')}
                                                                </td>
                                                                <td>
                                                                    <a href="#" role={'button'}
                                                                       className={'text-black'}
                                                                       onClick={(e) => showLogMore(e, log.text, log.created_at, 'Packetcrypt logs')}>
                                                                        {log.text.length > 160 ? log.text.substring(0, 160).toString() + '...' : log.text}
                                                                    </a>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
                                                    </tbody>
                                                </table>

                                                {!this.state.disableLoadPacketCryptLogs ? (
                                                    <div className={`text-center mb-3`}>
                                                        <button
                                                            onClick={() => this.loadMore('packetcrypt')}
                                                            className={`${this.state.disabledButton ? 'disabled' : null}  btn font-weight-bold  radius-0 background-black text-white `}
                                                            disabled={this.state.disabledButton}>
                                                            Load more
                                                            {this.state.loadMoreLoading && this.state.enablingPacketCryptLog ? (
                                                                <div
                                                                    className="spinner-border spinner-border-sm font-14 ml-2"
                                                                    role="status">
                                                                </div>) : null}
                                                        </button>
                                                    </div>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>

                                </div>

                                <div className={'col-sm-12 col-lg-12 font-14 mt-4 border radius-8'}>
                                    <div className={'mt-4'}>
                                        <p>Node runner alerts</p>
                                        {this.state.nodeRunnerLogs.length ? (
                                            <div>
                                                <table
                                                    className={`table table-responsive table-borderless d-sm-table ${styles.devicesTable}`}>
                                                    <thead>
                                                    <tr>
                                                        <th scope="col" className={`font-weight-normal`}>Date</th>
                                                        <th scope="col" className={`font-weight-normal`}>Description
                                                        </th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {this.state.nodeRunnerLogs.map((log, index) => {
                                                        return (
                                                            <tr key={index}
                                                                className={`background-gray`}>
                                                                <td>
                                                                    {moment(log.created_at).utc(true).local().format('DD/MM/YY HH:mm:ss')}
                                                                </td>
                                                                <td>
                                                                    <a href="#" role={'button'}
                                                                       className={'text-black'}
                                                                       onClick={(e) => showLogMore(e, log.text, log.created_at, 'Node runner alerts')}>
                                                                        {
                                                                            log.text.length > 160 ? log.text.substring(0, 160)
                                                                                .replaceAll(/\u001b\[.*?m/g, "").toString() + '...'
                                                                                : log.text.replaceAll(/\u001b\[.*?m/g, "")
                                                                        }
                                                                    </a>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}

                                                    </tbody>
                                                </table>

                                                {!this.state.disableNodeRunnerLogs ? (
                                                    <div className={`text-center mb-3`}>
                                                        <button
                                                            onClick={() => this.loadMore('node_runner')}
                                                            className={`${this.state.disabledButton ? 'disabled' : null}  btn font-weight-bold  radius-0 background-black text-white `}
                                                            disabled={this.state.disabledButton}>
                                                            Load more
                                                            {this.state.loadMoreLoading && this.state.enablingNodeRunnerLog ? (
                                                                <div
                                                                    className="spinner-border spinner-border-sm font-14 ml-2"
                                                                    role="status">
                                                                </div>) : null}
                                                        </button>
                                                    </div>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>

                                </div>


                                <div className={'col-sm-12 col-lg-12 font-14 mt-4 border radius-8'}>
                                    <div className={'mt-4'}>
                                        <p>Wallet logs</p>
                                        {this.state.walletLogs.length ? (
                                            <div>
                                                <table
                                                    className={`table table-responsive table-borderless d-sm-table ${styles.devicesTable}`}>
                                                    <thead>
                                                    <tr>
                                                        <th scope="col" className={`font-weight-normal`}>Date</th>
                                                        <th scope="col" className={`font-weight-normal`}>Description
                                                        </th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {this.state.walletLogs.map((log, index) => {
                                                        return (
                                                            <tr key={index}
                                                                className={`background-gray`}>
                                                                <td>
                                                                    {moment(log.created_at).utc(true).local().format('DD/MM/YY HH:mm:ss')}
                                                                </td>
                                                                <td>
                                                                    <a href="#" role={'button'}
                                                                       className={'text-black'}
                                                                       onClick={(e) => showLogMore(e, log.text, log.created_at, 'Wallet logs')}>
                                                                        {
                                                                            log.text.length > 160 ? log.text.substring(0, 160)
                                                                                .replaceAll(/\u001b\[.*?m/g, "").toString() + '...'
                                                                                : log.text.replaceAll(/\u001b\[.*?m/g, "")
                                                                        }

                                                                    </a>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}

                                                    </tbody>
                                                </table>

                                                {!this.state.disableLoadWalletLogs ? (
                                                    <div className={`text-center mb-3`}>
                                                        <button
                                                            onClick={() => this.loadMore('wallet')}
                                                            className={`${this.state.disabledButton ? 'disabled' : null}  btn font-weight-bold  radius-0 background-black text-white `}
                                                            disabled={this.state.disabledButton}>
                                                            Load more
                                                            {this.state.loadMoreLoading && this.state.enablingWalletLog ? (
                                                                <div
                                                                    className="spinner-border spinner-border-sm font-14 ml-2"
                                                                    role="status">
                                                                </div>) : null}
                                                        </button>
                                                    </div>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>

                                </div>

                                <div className={'col-sm-12 col-lg-12 font-14 mt-4 border radius-8'}>
                                    <div className={'mt-4'}>
                                        <p>Alert logs</p>
                                        {this.state.alertLogs.length ? (
                                            <div>
                                                <table
                                                    className={`table table-responsive table-borderless d-sm-table ${styles.devicesTable}`}>
                                                    <thead>
                                                    <tr>
                                                        <th scope="col" className={`font-weight-normal`}>Date</th>
                                                        <th scope="col" className={`font-weight-normal`}>Description
                                                        </th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {this.state.alertLogs.map((log, index) => {
                                                        return (
                                                            <tr key={index}
                                                                className={`background-gray`}>
                                                                <td>
                                                                    {moment(log.created_at).utc(true).local().format('DD/MM/YY HH:mm:ss')}
                                                                </td>
                                                                <td>
                                                                    <a href="#" role={'button'}
                                                                       className={'text-black'}
                                                                       onClick={(e) => showLogMore(e, log.text, log.created_at, 'Alert logs')}>
                                                                        {
                                                                            log.text.length > 160 ? log.text.substring(0, 160)
                                                                                .replaceAll(/\u001b\[.*?m/g, "").toString() + '...'
                                                                                : log.text.replaceAll(/\u001b\[.*?m/g, "")
                                                                        }
                                                                    </a>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}

                                                    </tbody>
                                                </table>

                                                {!this.state.disableLoadAlertLogs ? (
                                                    <div className={`text-center mb-3`}>
                                                        <button
                                                            onClick={() => this.loadMore('alert')}
                                                            className={`${this.state.disabledButton ? 'disabled' : null}  btn font-weight-bold  radius-0 background-black text-white `}
                                                            disabled={this.state.disabledButton}>
                                                            Load more
                                                            {this.state.loadMoreLoading && this.state.enablingAlertLog ? (
                                                                <div
                                                                    className="spinner-border spinner-border-sm font-14 ml-2"
                                                                    role="status">
                                                                </div>) : null}
                                                        </button>
                                                    </div>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>

                                </div>

                                <div className={'col-sm-12 col-lg-12 font-14 mt-4 border radius-8'}>
                                    <div className={'mt-4'}>
                                        <p>Permits token alerts</p>
                                        {this.state.permitsTokenAlerts.length ? (
                                            <div>
                                                <table
                                                    className={`table table-responsive table-borderless d-sm-table ${styles.devicesTable}`}>
                                                    <thead>
                                                    <tr>
                                                        <th scope="col" className={`font-weight-normal`}>Date</th>
                                                        <th scope="col" className={`font-weight-normal`}>Description
                                                        </th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {this.state.permitsTokenAlerts.map((log, index) => {
                                                        return (
                                                            <tr key={index}
                                                                className={`background-gray`}>
                                                                <td>
                                                                    {moment(log.created_at).utc(true).local().format('DD/MM/YY HH:mm:ss')}
                                                                </td>
                                                                <td>
                                                                    <a href="#" role={'button'}
                                                                       className={'text-black'}
                                                                       onClick={(e) => showLogMore(e, ('Ip: ' + log.ip + " -> " + "Token: " + log.token + " -> " + "Session: " + log.session + " -> " + "Good: " + log.good + " -> " + "Version_id: " + log.version_id), log.created_at, 'Permits token alerts')}>
                                                                        {
                                                                            ('Ip: ' + log.ip + " , " + "Token: " + log.token + " , " + "Good: " + log.good + " , " + "Version_id: " + log.version_id).substring(0, 160).toString() + '...'
                                                                        }
                                                                    </a>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}

                                                    </tbody>
                                                </table>

                                                {!this.state.disableLoadPermitsTokenAlerts ? (
                                                    <div className={`text-center mb-3`}>
                                                        <button
                                                            onClick={() => this.loadMore('permitsToken')}
                                                            className={`${this.state.disabledButton ? 'disabled' : null}  btn font-weight-bold  radius-0 background-black text-white `}
                                                            disabled={this.state.disabledButton}>
                                                            Load more
                                                            {this.state.loadMoreLoading && this.state.enablingPermitsTokenAlerts ? (
                                                                <div
                                                                    className="spinner-border spinner-border-sm font-14 ml-2"
                                                                    role="status">
                                                                </div>) : null}
                                                        </button>
                                                    </div>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>

                                </div>

                                <div className={'col-sm-12 col-lg-12 font-14 mt-4 border radius-8'}>
                                    <div className={'mt-4'}>
                                        <p>Permits no token alerts</p>
                                        {this.state.permitsNoTokenAlerts.length ? (
                                            <div>
                                                <table
                                                    className={`table table-responsive table-borderless d-sm-table ${styles.devicesTable}`}>
                                                    <thead>
                                                    <tr>
                                                        <th scope="col" className={`font-weight-normal`}>Date</th>
                                                        <th scope="col" className={`font-weight-normal`}>Description
                                                        </th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {this.state.permitsNoTokenAlerts.map((log, index) => {
                                                        return (
                                                            <tr key={index}
                                                                className={`background-gray`}>
                                                                <td>
                                                                    {moment(log.created_at).utc(true).format('DD/MM/YY HH:mm:ss')}
                                                                </td>
                                                                <td>
                                                                    <a href="#" role={'button'}
                                                                       className={'text-black'}
                                                                       onClick={(e) => showLogMore(e, ('Ip: ' + log.ip + " -> " + "Session: " + log.session + " -> " + "Good: " + log.good + " -> " + "Version_id: " + log.version_id), log.created_at, 'Permits no token alerts')}>
                                                                        {
                                                                            ('Ip: ' + log.ip + " , " + "Session: " + log.session + " , " + "Good: " + log.good + " , " + "Version_id: " + log.version_id).substring(0, 160).toString() + '...'
                                                                        }
                                                                    </a>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}

                                                    </tbody>
                                                </table>

                                                {!this.state.disableLoadPermitsNoTokenAlerts ? (
                                                    <div className={`text-center mb-3`}>
                                                        <button
                                                            onClick={() => this.loadMore('permitsNoToken')}
                                                            className={`${this.state.disabledButton ? 'disabled' : null}  btn font-weight-bold  radius-0 background-black text-white `}
                                                            disabled={this.state.disabledButton}>
                                                            Load more
                                                            {this.state.loadMoreLoading && this.state.enablingPermitsNoTokenAlerts ? (
                                                                <div
                                                                    className="spinner-border spinner-border-sm font-14 ml-2"
                                                                    role="status">
                                                                </div>) : null}
                                                        </button>
                                                    </div>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>

                                </div>

                            </div>
                        </div>

                    ) : (
                        <div>
                            <Load/>
                        </div>
                    )}
                </div>
                <ShowLog/>
            </div>
        )
    }
}


export default Details
