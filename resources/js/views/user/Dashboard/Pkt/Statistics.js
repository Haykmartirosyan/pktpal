import React, {Component} from 'react';
import {Link, withRouter} from "react-router-dom";
import Header from "../../../../components/Header/Header";
import Footer from "../../../../components/Footer/Footer";
import styles from './Statisctics.module.scss';
import DatePicker from "react-datepicker";
import SendPkt from '../../../Modals/SendPkt'
import "react-datepicker/dist/react-datepicker.css";
import {defaults, Line} from 'react-chartjs-2';
import Tooltip from 'rc-tooltip';
import Emitter from "../../../../services/emitter";
import TransactionSent from "../../../Modals/TransactionSent";
import {copyAddress} from "../../../Helpers/GlobalHelpers";
import TransactionFailed from "../../../Modals/TransactionFailed";
import Switch from "react-switch";
import {Load} from "../../../../components/Loadings/Load";
import ChooseWallet from "../../../Modals/ChooseWallet";
import PairDevice from "../../../Modals/PairDevice";
import DevicePaired from "../../../Modals/DevicePaired";
import DevicePairingFailed from "../../../Modals/DevicePairingFailed";
import cookie from "react-cookies";
import checkIcon from '../../../../../../public/images/icons/check-o.svg';
import TransactionsMobile from './TransactionsMobile';
import {motion} from "framer-motion";
import * as Sentry from "@sentry/react";

import {
    balance,
    getExchangeRate,
    getPairedDevices,
    getStatusReport,
    getUserPktService,
    getUserPktServiceOption,
    getUserPktServices,
    groupByMonth,
    groupByMonthAndYear,
    mining,
    pktNumber,
    setUserAgent,
    transactions
} from '../../../Helpers/StatisticsHelpers'
import ExportSeed from "../../../Modals/ExportSeed";
import DeviceDropDown from "./DeviceDropDown";
import DeviceDetector from "device-detector-js";


defaults.animation = false;

class Statistics extends Component {
    constructor(props) {
        super(props);
        this._isMounted = false;
        this.state = {
            serviceId: props.match.params.id,
            startDate: new Date(),
            endDate: new Date(),
            walletAddress: '',
            pktType: '',
            pktName: '',
            macAddress: '',
            showLineChart: false,
            balance: '',
            realBalance: '',
            mined24: '',
            transactions: [],
            filteredTransactions: [],
            transactionsNextPage: '',
            mining: [],
            miningNextPage: '',
            transactionsTab: 'transactions',
            DoughnutData: {
                datasets: [{
                    data: [100, 50],
                    backgroundColor: ['#023db5', '#FFFFFF'],
                    tension: 0.4,
                    fill: false,
                    borderWidth: 2
                }],
                labels: [
                    'Available bandwidth',
                    'Used bandwidth',
                ],
            },
            LineData: {
                labels: [],
                datasets: [
                    {
                        label: '',
                        data: [],
                        fill: true,
                        backgroundColor: "rgba(18, 150, 235, 0.18)",
                        borderColor: "#1296EB",
                        tension: 0.4
                    },

                ],
            },
            showTransactionSentModal: false,
            transactionSentTo: '',
            transactionAmount: '',
            selectedPeriod: 'year',
            showLoading: true,
            rackModeDisabled: false,
            rackModeHide: false,
            pktServices: {},
            rackModeWallet: '',
            selectedService: '',
            showDropDownContent: false,
            showPairModal: false,
            deviceHasPairOption: false,
            devicePairUrl: '',
            pairedDevices: [],
            showDevicePairedModal: false,
            showDevicePairingFailedModal: false,
            usedBandwidth: 0,
            encryptionTime: 0,
            USDPrice: 0,
            showUnpairLoading: false,
            unpairLoadingToken: null,
            turnedOff: false,
            chartHeight: window.innerWidth <= 576 ? 250 : 80,
            displayMode: 'browser',
            loadTransactions: false,
            loadMiningIncome: false,
            windowWidth: window.innerWidth >= 420,
            device: {},
            loadingTransactions: false,
        };
    }

    componentDidUpdate(prevProps, nextProps) {
        if (this.props.location !== prevProps.location) {
            this.mountComponent(this.props.match.params.id)
        }
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    componentDidMount() {
        let _this = this;
        this._isMounted = true;
        const deviceDetector = new DeviceDetector();
        const userAgent = navigator.userAgent;
        _this.setState({
            device: deviceDetector.parse(userAgent)
        });

        const mqStandAlone = '(display-mode: standalone)';
        if (navigator.standalone || window.matchMedia(mqStandAlone).matches) {
            _this.setState({
                displayMode: 'standalone'
            });
        }

        Emitter.on('transactionSent', (data) => {
            _this.setState({
                showTransactionSentModal: true,
                transactionSentTo: data.to,
                transactionAmount: data.amount,
            });
            _this.mountComponent(_this.state.serviceId);
        });

        Emitter.on('transactionFailed', (data) => {
            Emitter.emit('showTransactionFailedModal', {data});
        });

        Emitter.on('devicePaired', () => {
            _this.setState({
                showDevicePairedModal: true,
            });
            _this.mountComponent(_this.state.serviceId)
        });


        Emitter.on('devicePairingFailed', () => {
            _this.setState({
                showDevicePairingFailedModal: true,
            });

        });

        Emitter.on('closingModal', (data) => {
            _this.setState({
                showTransactionSentModal: false,
                showPairModal: false,
                showDevicePairedModal: false,
                showDevicePairingFailedModal: false,
            });
        });

        this.mountComponent(this.state.serviceId);

        const timer = setInterval(function () {
            if (_this._isMounted) {
                _this.mountComponent(_this.state.serviceId, false)
            } else {
                clearInterval(timer)
            }
        }, 60 * 1000);

        push.subscribe('device-unpaired').bind('App\\Events\\DeviceUnpaired', function (data) {
            console.log('device-unpaired', data);
            _this.setState({
                    showUnpairLoading: false,
                    unpairLoadingToken: null,
                }
            );
            _this.mountComponent(_this.state.serviceId)
        });
    }

    mountComponent(id, updateTransactions = true) {
        let _this = this;
        let token = cookie.load('accessToken');
        if (token) {
            getUserPktServices().then((json) => {
                this.setState({
                    pktServices: json.data.pkt_services,
                    showDropDownContent: true,
                });

                this.setDisabledRackMode();
            });
            _this.setState({serviceId: id});
            getUserPktService(id).then((data) => {
                _this.setState({
                    walletAddress: data.data ? data.data.wallet_address : '',
                    pktType: data.data ? data.data.type : '',
                    pktName: data.data && data.data.name ? data.data.name : 'My PKT Cube',
                    macAddress: data.data ? data.data.mac_address : '',
                });
                if (_this.state.pktType == 'rack') {
                    return this.props.history.push('/pkt/rack/details/' + this.state.serviceId)
                }
                if (_this.state.walletAddress && _this.state.macAddress) {
                    _this.updateUserAgentData();
                    getExchangeRate().then((data) => {
                        _this.setState({
                            USDPrice: data.price,
                        });
                    });
                    balance(_this.state.walletAddress).then((data) => {
                        _this.setState({
                            realBalance: (data.balance),
                            balance: pktNumber(data.balance),
                            mined24: pktNumber(data.mined24),
                        });
                    });
                    if (data.data.freeze == 0 && data.data.online) {
                        getStatusReport(id).then((response) => {
                            if (Object.keys(response).length) {
                                _this.setState({
                                    usedBandwidth: response.data.bandwidth_used,
                                    encryptionTime: response.data.encryptions_per_second,
                                });
                            }
                        });
                        _this.setState({
                            turnedOff: false,
                        });
                    } else {
                        _this.setState({
                            turnedOff: true,
                        });
                    }
                    if (updateTransactions) {
                        mining(_this.state.walletAddress).then((data) => {
                            _this.state.showLineChart = true;
                            _this.setState({
                                mining: data.results,
                                miningNextPage: data.next,
                            });
                            _this.changeSelectedPeriod();
                        });
                        _this.setState({
                            loadingTransactions: true
                        });
                        transactions(_this.state.walletAddress).then((data) => {
                            let result = [];

                            for (let i = 0; i < data.results.length; i++) {
                                if (data.results[i].input.length == 1 && data.results[i].output.length == 1) {
                                    if (data.results[i].input[0].address == data.results[i].output[0].address) {
                                        continue;
                                    }
                                }
                                result.push(data.results[i]);
                            }

                            _this.setState({
                                transactions: result,
                                filteredTransactions: result,
                                transactionsNextPage: data.next,
                                loadingTransactions: false
                            });
                        }).catch((error) => {
                            _this.setState({
                                loadingTransactions: false
                            });
                        });
                    }

                    getUserPktServiceOption(id).then((response) => {
                        _this.setState({
                            deviceHasPairOption: response.data ? true : false,
                            devicePairUrl: response?.data?.url || '',
                        });

                        getPairedDevices(id).then((response) => {
                            let cookiePaired = false;
                            if (cookie.load('devicePaired_' + _this.state.serviceId)) {
                                let myDevice = response.data.find(device => {
                                    return device.device_unique_key === cookie.load('devicePaired_' + _this.state.serviceId);
                                });

                                if (myDevice) {
                                    cookiePaired = true;
                                }
                            }

                            _this.setState({
                                pairedDevices: response.data,
                            }, () => {
                                setTimeout(function () {
                                    if (!cookiePaired && cookie.load('devicePaired_' + _this.state.serviceId)) {
                                        Sentry.captureMessage("Unpaired " + cookie.load('devicePaired_' + _this.state.serviceId) + ' ' + _this.state.serviceId);
                                        cookie.remove('devicePaired_' + _this.state.serviceId, {path: '/'});
                                    }

                                }, 500);
                            });
                        })
                    })
                } else {
                    _this.changeSelectedPeriod();
                    _this.setState({
                        turnedOff: true,
                    });
                }

                this.setState({showLoading: false});
            }).catch((error) => {
                if (error.response.status == 422) {
                    return this.props.history.push('/dashboard');
                }
                return this.props.history.push('/404');
            })
        }
    }


    updateUserAgentData() {
        try {
            let _this = this;
            window.pkteerGetId(_this.state.macAddress, function (error, res) {
                if (error) {
                    console.log('error', error);
                    return false;
                } else {
                    let data = {
                        'last_login': moment().format('Y-MM-DD H:m:s'),
                        'device_unique_key': res,
                        'mac_address': _this.state.macAddress,
                        'user_agent': setUserAgent(_this.state.device)
                    };
                    axios.put(api_routes.user.setUserAgentData(), data).then(response => {
                        return response;
                    }).then(() => {
                        return true
                    }).catch((error) => {
                        Sentry.captureException(error);
                        console.log(error)
                    });
                }
            })
        } catch (e) {
            Sentry.captureException(e);
            console.log(e)
        }

    }

    setDisabledRackMode() {
        if (this.state.pktServices.length === 1) {
            this.setState({
                rackModeDisabled: true,
            });
        } else {
            let nodeCount = 0;
            let onlineCount = 0;
            this.state.pktServices.map((pktService) => {
                if (pktService.type === 'node') {
                    nodeCount += 1;
                }
                if (pktService.online && pktService.freeze == 0) {
                    onlineCount += 1;
                }
            });

            if (nodeCount <= 1) {
                this.setState({
                    rackModeDisabled: true,
                });
            } else if (nodeCount > 1) {
                this.setState({
                    rackModeDisabled: false,
                });
            }

            if (onlineCount <= 1) {
                this.setState({
                    rackModeHide: true,
                });
            } else {
                this.setState({
                    rackModeHide: false,
                });
            }
        }
    }

    generateLineChartData(json) {
        let groupedMonths = groupByMonth(json.results);
        let groupedMonthsAndYears = groupByMonthAndYear(json.results);
        let firstMonth = 1;
        if (this.state.selectedPeriod === 'last_3') {
            let firstMonthName = moment().startOf('month').subtract(2, 'months').format('MMMM');
            let secondMonthName = moment().startOf('month').subtract(1, 'months').format('MMMM');
            let currentMonthName = moment().startOf('month').format('MMMM');
            this.state.LineData.labels.push(firstMonthName, secondMonthName, currentMonthName);
            firstMonth = parseInt(moment().startOf('month').subtract(2, 'months').format('M'));
        } else if (this.state.selectedPeriod === 'year') {
            firstMonth = moment().subtract(1, 'years').format('YYYY-MM');
            Object.keys(groupedMonthsAndYears).reverse().map((month) => {
                let formattedMonth = moment(month, 'YYYY-MM').format('MMMM');
                this.state.LineData.labels.push(formattedMonth);
            });
        } else if (this.state.selectedPeriod === 'week') {
            firstMonth = parseInt(moment().startOf('week').format('M'));

            for (let i = 1; i <= 7; i++) {
                this.state.LineData.labels.push(moment().weekday(i).format('dddd'));
            }
        }


        let data = [];

        if (this.state.selectedPeriod === 'week') {
            Object.keys(json.results.reverse()).map((month) => {
                data.push([json.results[month]]);
            });
        } else if (this.state.selectedPeriod === 'year') {
            Object.keys(groupedMonthsAndYears).reverse().map((month) => {
                if (month >= firstMonth) {
                    data.push(groupedMonthsAndYears[month]);
                }
            });
        } else {
            Object.keys(groupedMonths).map((month) => {
                if (month >= firstMonth) {
                    data.push(groupedMonths[month]);
                }
            });
        }

        data.forEach(item => {
            let res = 0;
            item.forEach(i => {
                res += parseInt(i.received)
            });
            this.state.LineData.datasets[0].data.push(res / 2 ** 30);
        });

        this.setState({
            showLineChart: true,
        });

    }

    switchTransactions(value) {
        this.setState({transactionsTab: value});
    }

    loadMoreTransactions() {
        this.setState({
            loadTransactions: true
        });
        fetch('https://explorer.pkt.cash/api/v1/PKT/pkt' + this.state.transactionsNextPage).then(response => {
            return response.json();
        }).then(data => {
            for (let i = 0; i < data.results.length; i++) {
                if (data.results[i].input.length == 1 && data.results[i].output.length == 1) {
                    if (data.results[i].input[0].address == data.results[i].output[0].address) {
                        continue;
                    }
                }
                this.state.transactions.push(data.results[i]);
            }
            this.setState({
                transactionsNextPage: data.next,
                loadTransactions: false
            });
        }).catch((error) => {
            Sentry.captureException(error);
            this.setState({
                loadTransactions: false
            });
        });
    }

    loadMoreMinings() {
        this.setState({
            loadMiningIncome: true
        });
        fetch('https://explorer.pkt.cash/api/v1/PKT/pkt' + this.state.miningNextPage).then(response => {
            return response.json();
        }).then(json => {
            json.results.forEach((entry) => {
                this.state.mining.push(entry);
            });
            this.setState({
                miningNextPage: json.next,
                loadMiningIncome: false
            });
        }).catch((error) => {
            Sentry.captureException(error);
            this.setState({
                loadMiningIncome: false
            })
        });
    }

    handleStartChange(date) {
        this.setState({startDate: date});
    }

    handleEndChange(date) {
        this.setState({endDate: date});
    }

    openSentPktModal() {
        Emitter.emit('showSendPktModal',
            {
                macAddress: this.state.macAddress
            }
        );
    }

    openExportSeedModal() {
        Emitter.emit('openExportSeedModal',
            {
                macAddress: this.state.macAddress,
                walletAddress: this.state.walletAddress
            }
        );
    }

    changeSelectedPeriod(event) {
        let _this = this;
        let value = event ? event.target.value : 'year';
        let period = null;
        this.state.LineData.labels = [];
        this.state.LineData.datasets[0].data = [];

        this.setState({
            selectedPeriod: value,
            showLineChart: false
        });
        if (value === 'week') {
            let star = moment().startOf('week').format('YYYY-MM-DD');
            let end = moment().endOf('week').format('YYYY-MM-DD');
            period = star + '/' + end;
        } else if (value === 'year') {
            let start = moment().subtract(1, 'years').format('YYYY-MM-DD');
            let end = moment().endOf('month').format('YYYY-MM-DD');
            period = start + '/' + end
        }

        mining(this.state.walletAddress, period).then((data) => {
            _this.generateLineChartData(data);
        });
    }

    handleRackModeChange(checked, id) {
        let service = '';

        this.state.pktServices.filter(item => {
            if (item.id == id) {
                service = item;
            }
        });

        let rackWallet = '';

        for (let i = 0; i < this.state.pktServices.length; i++) {

            let item = this.state.pktServices[i];
            if (item.id != id && item.type === 'node') {
                rackWallet = item.wallet_address;
                break;
            }
        }

        Emitter.emit('openChooseWalletModal', {
            macAddress: this.state.macAddress,
            rackWallet: rackWallet
        });
        this.setState({
            pktServices: this.state.pktServices,
            selectedService: service,
            rackModeWallet: rackWallet,
        });

        if (!checked) {
            this.updatePkt(id, {type: 'node'})
        }

    }

    updatePkt(id, sentData = {}) {
        let data = {};
        if (Object.keys(sentData).length) {
            data = sentData
        } else {
            data = {
                'name': this.state.changedValue
            };
        }

        axios.put(api_routes.user.updateService(id), data).then(response => {
            return response;
        }).then(json => {

            if (json.data.success) {
                this.state.pktServices.filter(item => {
                    if (item.id === id) {
                        item.name = this.state.changedValue;
                    }
                });
            }

            this.setState({
                pktServices: this.state.pktServices,
                showEditPktName: false,
                showEditBlockId: null,
            });

        }).catch((error) => {
            Sentry.captureException(error);
            console.log('error', error)
        });
    }

    handelShowPairModal() {

        Emitter.emit('openDevicePairing', this.state.serviceId);

        this.setState({
            showPairModal: true,
        });
    }

    unpairDevice(token) {
        let data = {
            token: token,
            serviceId: this.state.serviceId,
        };

        axios.post(api_routes.user.unPairDevice(), data).then(response => {
            return response;
        }).then((response) => {
            if (response.data.success) {
                this.setState(
                    {
                        showUnpairLoading: true,
                        unpairLoadingToken: token
                    }
                )
            }
            return true
        }).catch((error) => {
            Sentry.captureException(error);
        });
    }

    export(type) {
        let exportType = type === 'transactions' ? 'excluded' : 'only';
        location.href = 'https://explorer.pktpal.com/api/v1/PKT/pkt/address/' + this.state.walletAddress + '/income/' +
            moment(this.state.startDate).format('YYYY-MM-DD') + '/' +
            moment(this.state.endDate).format('YYYY-MM-DD') + '?mining=' + exportType + '&csv=1';
    }

    changeTransactionType(e) {
        let _this = this;

        let result = [];

        if (e.target.value != 'all') {
            _this.state.transactions.map(function (transaction) {
                if (e.target.value === 'sent') {
                    if (transaction.input[0].address == _this.state.walletAddress) {
                        result.push(transaction);
                    }
                } else {
                    if (transaction.input[0].address != _this.state.walletAddress) {
                        result.push(transaction);
                    }
                }
            });
        } else {
            result = _this.state.transactions;
        }

        _this.setState({
            filteredTransactions: result
        })
    }

    render() {
        return (
            <div className="content">

                <Header settingsPage={true} serviceId={this.state.serviceId}/>

                {!this.state.showLoading ? (

                    <div className="container mt-4">
                        <div className="row">
                            <div className="col-12 col-md-12 col-lg-4 mt-2">
                                <motion.div initial={{scale: 0}}
                                            animate={{scale: 1}}
                                            transition={{duration: 0.2}}
                                            className={`background-dark-blue  ${styles.paddingBox} radius-8 text-white h-100`}>
                                    <div className={"dropdown"}>
                                        <button
                                            className={`btn ${this.state.pktServices.length > 1 ? 'dropdown-toggle' : null}  btn-block bg-white color-dark-blue d-flex align-items-center ${styles.warningItem}`}
                                            type="button"
                                            id="dropdownMenuButton"
                                            data-toggle={this.state.pktServices.length > 1 ? 'dropdown' : ""}
                                            aria-haspopup="true"
                                            aria-expanded="false">
                                            {this.state.pktName}
                                            {this.state.turnedOff ? (

                                                <Tooltip placement="top" trigger={['hover']}
                                                         overlay={<span>Your device is offline</span>}>
                                                    <i className={`fa fa-exclamation  ml-2 text-danger bg-white font-14 ${styles.warningIcon}`}/>
                                                </Tooltip>
                                            ) : null}

                                        </button>

                                        <DeviceDropDown pktServices={this.state.pktServices}
                                                        showDropDownContent={this.state.showDropDownContent}/>
                                    </div>

                                    <div className="flex justify-content-between mt-3">
                                        <p className={`m-0`}>Balance</p>
                                        <h5 className={`m-0`}>{this.state.balance ? this.state.balance : 0} PKT</h5>
                                    </div>
                                    <div className={'border-bottom mt-1'}>
                                        <p className={'text-right mb-2'}>$ {this.state.realBalance ? pktNumber(parseFloat(this.state.realBalance) * parseFloat(this.state.USDPrice)) : 0}</p>

                                    </div>
                                    <div>
                                        <div className={'flex justify-content-between mt-3'}>
                                            <p className={`m-0`}>Mined last 24h</p>
                                            <h5 className={`m-0`}>{this.state.mined24 ? this.state.mined24 : 0} PKT</h5>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            <div className="col-12 col-md-12 col-lg-5 mt-2">
                                <motion.div initial={{scale: 0}}
                                            animate={{scale: 1}}
                                            transition={{duration: 0.2, delay: 0.2}}
                                            className={`background-gray ${styles.paddingBox} radius-8 h-100`}>
                                    <div>
                                        <div className={`d-flex justify-content-between align-items-center mb-1`}>
                                            <span>
                                                 PKT Wallet Address
                                                <Tooltip placement="top" trigger={['hover']}
                                                         overlay={<span>Your public wallet address for checking your balance and sending and receiving payments.</span>}>
                                                    <span className={`ml-1`}>
                                                        <i className="far fa-question-circle"/>
                                                    </span>
                                                </Tooltip>

                                            </span>

                                            <Tooltip placement="top" trigger={['click']} overlay={<span>Copied!</span>}>
                                                <button
                                                    onClick={() => copyAddress(this.state.walletAddress)}
                                                    className="btn bg-white ml-1 p-2">
                                                    <svg width="23" height="23" viewBox="0 0 18 23" fill="none"
                                                         xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M10 6.5H4V4.5H10V6.5Z" fill="#0F1114"/>
                                                        <path d="M10 10.5H4V8.5H10V10.5Z" fill="#0F1114"/>
                                                        <path d="M4 14.5H10V12.5H4V14.5Z" fill="#0F1114"/>
                                                        <path fillRule="evenodd" clipRule="evenodd"
                                                              d="M0 18.5V0.5H14V4.5H18V22.5H4V18.5H0ZM12 16.5V2.5H2V16.5H12ZM14 6.5V18.5H6V20.5H16V6.5H14Z"
                                                              fill="#0F1114"/>
                                                    </svg>
                                                </button>
                                            </Tooltip>
                                        </div>
                                        <div>
                                            <Tooltip placement="top" trigger={['hover']}
                                                     overlay={
                                                         <span>{this.state.walletAddress ? this.state.walletAddress : 'Your device is not turned on, so we cannot detect its wallet address'}</span>}>
                                                <div className="flex justify-content-between">
                                                    <input readOnly type="text"
                                                           className={`p-2 radius-5 bg-white w-100  border`}
                                                           defaultValue={this.state.walletAddress}/>
                                                </div>
                                            </Tooltip>

                                            <div
                                                className={`px-1 mt-2 ${this.state.windowWidth ? 'flex justify-content-between' : ''}`}>
                                                <p className={`py-2 text-nowrap ${!this.state.windowWidth ? 'mb-0' : ''}`}>
                                                    Product MAC Address
                                                    <Tooltip placement="top" trigger={['hover']}
                                                             overlay={
                                                                 <span>This is your product's identification number</span>}>
                                                    <span className={`ml-1`}>
                                                        <i className="far fa-question-circle"/>
                                                    </span>
                                                    </Tooltip>
                                                </p>
                                                <p className={`py-2`}>
                                                    {this.state.macAddress}
                                                </p>
                                            </div>

                                        </div>

                                        <div className={'flex justify-content-center mt-3'}>
                                            <div className={'col-lg-6 flex justify-content-start pl-0'}>
                                                {this.state.turnedOff ? (
                                                    <Tooltip placement="top" trigger={['hover']}
                                                             overlay={<span>Your device is offline</span>}>
                                                        <button
                                                            className={`btn btn-light bg-white font-weight-bold radius-5 border disabled w-100 text-nowrap
                                                            ${!this.state.windowWidth ? 'font-12' : ''}`}>
                                                            Export seed
                                                        </button>
                                                    </Tooltip>
                                                ) : (
                                                    <button
                                                        onClick={() => this.openExportSeedModal()}
                                                        className={`btn btn-light bg-white font-weight-bold radius-5 border w-100 text-nowrap
                                                         ${!this.state.windowWidth ? 'font-12' : ''}`}>
                                                        Export seed
                                                    </button>
                                                )}
                                            </div>
                                            <div className={'col-lg-6 flex justify-content-end'}>
                                                {!cookie.load('devicePaired_' + this.state.serviceId) || this.state.pktType === 'rack' || !this.state.deviceHasPairOption || this.state.turnedOff ? (
                                                    <Tooltip placement="top" trigger={['hover']}
                                                             overlay={<span>Your Cube is not paired with your device please pair them to be able to send PKT</span>}>
                                                        <button
                                                            className={`disabled btn background-dark-blue text-white font-weight-bold radius-5 w-100 text-nowrap
                                                            ${!this.state.windowWidth ? 'font-12' : ''}`}>
                                                            Send PKT
                                                        </button>
                                                    </Tooltip>
                                                ) : (
                                                    <button
                                                        onClick={() => this.openSentPktModal()}
                                                        className={`${this.state.turnedOff || !this.state.deviceHasPairOption || !cookie.load('devicePaired_' + this.state.serviceId) ? 'disabled' : ''} 
                                                        btn background-dark-blue text-white font-weight-bold radius-5 w-100 text-nowrap  ${!this.state.windowWidth ? 'font-12' : ''}`}>
                                                        Send PKT
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            <div className="col-12 col-md-12 col-lg-3 mt-2">
                                <motion.div initial={{scale: 0}}
                                            animate={{scale: 1}}
                                            transition={{duration: 0.2, delay: 0.4}}
                                            className={`background-gray ${styles.paddingBox} radius-8 h-100`}>
                                    <div className={`border-bottom pb-4 borderDarkBlue`}>
                                        <div
                                            className={`d-flex align-items-center justify-content-between mb-2 flex-wrap`}>
                                            <p className={`mb-0`}>Used Bandwidth
                                                <Tooltip placement="top" trigger={['hover']}
                                                         overlay={<span>The amount of kilobits (k) or megabits (M) per second of data that is being transferred for PacketCrypt mining.</span>}>
                                                    <span className={`ml-1`}>
                                                        <i className="far fa-question-circle"/>
                                                    </span>
                                                </Tooltip>


                                            </p>
                                            {this.state.turnedOff ? (
                                                <p className={`mb-0 text-center w-25`}>-</p>
                                            ) : (
                                                <h5 className={'font-weight-bold mb-0 pr-5'}>{this.state.usedBandwidth}</h5>
                                            )}
                                        </div>

                                        <div className={`d-flex align-items-center justify-content-between flex-wrap`}>
                                            <div>
                                                <p className={`mb-0`}>Encryption time
                                                    <Tooltip placement="top" trigger={['hover']}
                                                             overlay={<span>The number of data-encryptions which are being performed per second as part of the PacketCrypt algorithm.</span>}>
                                                    <span className={`ml-1`}>
                                                        <i className="far fa-question-circle"/>
                                                    </span>
                                                    </Tooltip>
                                                </p>

                                                {this.state.turnedOff ? (
                                                    <p className={`mb-0 text-center w-25`}>-</p>
                                                ) : (
                                                    <h5 className={'font-weight-bold mb-0 pr-5'}>{this.state.encryptionTime}</h5>
                                                )}
                                            </div>
                                            <div>
                                                <Tooltip placement="top" trigger={['hover']}
                                                         overlay={<span>See history</span>}>
                                                    <Link className={`btn bg-white border radius-8 p-2`}
                                                          to={{pathname: "/pkt/encryption/" + this.state.serviceId}}>
                                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
                                                             xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M8.5 5H10.5V10H15.5V12H8.5V5Z" fill="#141414"/>
                                                            <path fillRule="evenodd" clipRule="evenodd"
                                                                  d="M20 10C20 15.5228 15.5228 20 10 20C4.47715 20 0 15.5228 0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10ZM18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10Z"
                                                                  fill="#141414"/>
                                                        </svg>
                                                    </Link>
                                                </Tooltip>
                                            </div>


                                        </div>
                                    </div>

                                    <div className="mt-3 flex justify-content-between">

                                        {this.state.pktServices.length > 1 && !this.state.rackModeHide ? (

                                            <div className={'mr-2'}>
                                                <p className={`mb-2 text-nowrap`}>Rack mode
                                                    <Tooltip placement="top" trigger={['hover']}
                                                             overlay={<span>Your PktCube will automatically forward all of its coins to another PktCube of your choice so you don’t need to manage multiple wallets.</span>}>
                                                    <span className={`ml-1`}>
                                                        <i className="far fa-question-circle"/>
                                                    </span>
                                                    </Tooltip>
                                                </p>
                                                {!cookie.load('devicePaired_' + this.state.serviceId) || (this.state.rackModeDisabled && this.state.pktType == 'node') || this.state.turnedOff ? (
                                                    <Tooltip placement="top" trigger={['hover']}
                                                             overlay={<span>
                                                         {this.state.rackModeDisabled
                                                             ? ' You are unable to send this Cube to the Rack mode as you have one Cube only'
                                                             : 'Your Cube is not paired with your device please pair them to be able to send your device into the Rack mode'}
                                                         </span>}>
                                                        <div>
                                                            <Switch
                                                                onChange={e => e}
                                                                disabled={true}
                                                                onColor={'#023DB5'}
                                                                checkedIcon={false}
                                                                uncheckedIcon={false}
                                                                width={36}
                                                                height={22}
                                                                checked={this.state.pktType === 'rack' ? true : false}/>
                                                        </div>
                                                    </Tooltip>

                                                ) : (
                                                    <Switch
                                                        onChange={e => this.handleRackModeChange(e, this.state.serviceId)}
                                                        onColor={'#023DB5'}
                                                        checkedIcon={false}
                                                        uncheckedIcon={false}
                                                        width={36}
                                                        height={22}
                                                        checked={this.state.pktType === 'rack' ? true : false}/>
                                                )}
                                            </div>
                                        ) : null}
                                    </div>
                                </motion.div>
                            </div>

                            <div className="col-12 mt-4">
                                <motion.div initial={{scale: 0}}
                                            animate={{scale: 1}}
                                            transition={{duration: 0.2, delay: 0.6}}>
                                    <div className={`p-0 p-sm-3 radius-8 border ${styles.borderMobileNone}`}>
                                        <div className={`pt-2`}>
                                            <div>
                                                <p className="float-left">Mining Income
                                                    <Tooltip placement="top" trigger={['hover']}
                                                             overlay={<span>The amount of coins which this address has mined in daily increments. </span>}>
                                                    <span className={`ml-1`}>
                                                        <i className="far fa-question-circle"/>
                                                    </span>
                                                    </Tooltip>
                                                </p>
                                                <select name="" id=""
                                                        onChange={(e) => this.changeSelectedPeriod(e)}
                                                        defaultValue={this.state.selectedPeriod}
                                                        className={`float-right bg-white ${styles.filterMaxWidth}`}>
                                                    <option value="last_3">
                                                        Last 3 Month
                                                    </option>
                                                    <option value="week">
                                                        Last Week
                                                    </option>
                                                    <option value="year">
                                                        Last year
                                                    </option>
                                                </select>
                                            </div>

                                            {this.state.showLineChart ? (
                                                <Line type="area" height={this.state.chartHeight}
                                                      data={this.state.LineData}
                                                      options={
                                                          {
                                                              plugins: {
                                                                  legend: {
                                                                      display: false,
                                                                  },
                                                              }
                                                          }
                                                      }/>
                                            ) : null}

                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                            {this.state.deviceHasPairOption ? (
                                <div className="col-12 mt-4">
                                    <motion.div initial={{scale: 0}}
                                                animate={{scale: 1}}
                                                transition={{duration: 0.2, delay: 0.8}}>
                                        <div className={`p-3 radius-8 border`}>
                                            <p className={'mb-0'}>Paired devices
                                                <Tooltip placement="top" trigger={['hover']}
                                                         overlay={<span>The computers / phones / tablets which are paired with your PktCube and are thus able to send PKT when logged in to your account, if there is a device which you do not recognize, you should immediately click “unpair” to remove it.</span>}>
                                                    <span className={`ml-1`}>
                                                        <i className="far fa-question-circle"/>
                                                    </span>
                                                </Tooltip>
                                            </p>
                                            <div className={`row`}>
                                                {this.state.pairedDevices.map(function (device, index) {
                                                    return (
                                                        <div className={'col-12 mt-3 col-sm-4 col-lg-3 p-2'}
                                                             key={index}>
                                                            <div className={`p-0 border radius-8`}>
                                                                <div
                                                                    className={`border-bottom  ${styles.deviceHeight}`}>
                                                                    <div
                                                                        className={`flex justify-content-end cursor-pointer px-2 dropdown`}>
                                                                        {!this.state.turnedOff ?
                                                                            (!this.state.showUnpairLoading && !this.state.unpairLoadingToken
                                                                            || (this.state.unpairLoadingToken !== device.device_unique_key)
                                                                                ? (
                                                                                    <button
                                                                                        className="btn p-3"
                                                                                        type="button"
                                                                                        id="dropdownMenuButton"
                                                                                        data-toggle="dropdown"
                                                                                        aria-haspopup="true"
                                                                                        aria-expanded="false">
                                                                                        <i className="fas fa-ellipsis-v"></i>
                                                                                    </button>

                                                                                ) : (
                                                                                    <div
                                                                                        className="spinner-border mt-2 spinner-border-sm color-dark-blue"
                                                                                        role="status">
                                                                                    </div>
                                                                                )) : (
                                                                                <Tooltip placement="top"
                                                                                         trigger={['hover']}
                                                                                         overlay={
                                                                                             <span>Your device is offline</span>}>
                                                                                    <button
                                                                                        className="btn p-3"
                                                                                        type="button">
                                                                                        <i className="fas fa-ellipsis-v"></i>
                                                                                    </button>
                                                                                </Tooltip>
                                                                            )
                                                                        }

                                                                        <div className="dropdown-menu"
                                                                             aria-labelledby="dropdownMenuButton">
                                                                            <button
                                                                                onClick={() => this.unpairDevice(device.device_unique_key)}
                                                                                className={`btn px-3 btn-link text-black`}>
                                                                                Unpair
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    <div className={`flex justify-content-center`}>
                                                                        <img src={`/images/devices/${device.logo}`}
                                                                             className={`img-fluid ${styles.deviceLogo}`}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className={`px-4 pt-3 ${styles.deviceHeight}`}>
                                                                    <p className={`font-weight-bold mb-1`}>{device.user_agent}</p>
                                                                    <p className={`mb-1`}>{device.country}</p>
                                                                    <p className={`mb-1`}>{moment(device.last_login) > moment() ? 'a few seconds ago' : moment(device.last_login).fromNow()}</p>
                                                                    {cookie.load('devicePaired_' + this.state.serviceId) && cookie.load('devicePaired_' + this.state.serviceId) == device.device_unique_key ? (
                                                                        <span
                                                                            className={`d-flex align-items-center`}>
                                                                            <img className={`mr-2`}
                                                                                 src={checkIcon}
                                                                                 alt="check"/>
                                                                            <span className={`text-nowrap`}>
                                                                            This Device
                                                                            </span>
                                                                        </span>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                }, this)}
                                                {!cookie.load('devicePaired_' + this.state.serviceId) ? (
                                                    this.state.turnedOff ? (
                                                        <Tooltip placement="top" trigger={['hover']}
                                                                 overlay={
                                                                     <span>Your device is offline</span>}>
                                                            <div className={'col-12 mt-3 col-sm-4 col-lg-3 p-2'}>
                                                                <div className={`p-0 border radius-8`}>
                                                                    <div
                                                                        className={`border-bottom  ${styles.deviceHeight}
                                                                        flex justify-content-center align-items-center p-1`}>
                                                                        <svg width="45" height="45" viewBox="0 0 39 39"
                                                                             fill="none"
                                                                             xmlns="http://www.w3.org/2000/svg">
                                                                            <rect x="17.4004" width="4.8" height="39"
                                                                                  rx="2.4"
                                                                                  fill="#212529"/>
                                                                            <rect y="21.5996" width="4.8" height="39"
                                                                                  rx="2.4"
                                                                                  transform="rotate(-90 0 21.5996)"
                                                                                  fill="#212529"/>
                                                                        </svg>
                                                                    </div>
                                                                    <div className={`p-4 ${styles.deviceHeight}`}>
                                                                        <p className={`font-weight-bold`}>Unpaired
                                                                            device</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </Tooltip>
                                                    ) : (
                                                        <Tooltip placement="top"
                                                                 trigger={[this.state.windowWidth ? 'hover' : '']}
                                                                 overlay={
                                                                     <span>Pair your device</span>}>
                                                            <div className={'col-12 mt-3 col-sm-4 col-lg-3 p-2'}>
                                                                <div className={`p-0 border radius-8`}>
                                                                    <div
                                                                        className={`border-bottom  ${styles.deviceHeight}
                                                                        flex justify-content-center align-items-center p-1`}
                                                                        onClick={() => this.handelShowPairModal()}>
                                                                        <svg width="45" height="45" viewBox="0 0 39 39"
                                                                             fill="none"
                                                                             xmlns="http://www.w3.org/2000/svg">
                                                                            <rect x="17.4004" width="4.8" height="39"
                                                                                  rx="2.4"
                                                                                  fill="#212529"/>
                                                                            <rect y="21.5996" width="4.8" height="39"
                                                                                  rx="2.4"
                                                                                  transform="rotate(-90 0 21.5996)"
                                                                                  fill="#212529"/>
                                                                        </svg>
                                                                    </div>
                                                                    <div className={`p-4 ${styles.deviceHeight}`}>
                                                                        <p className={`font-weight-bold`}>Unpaired
                                                                            device</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </Tooltip>
                                                    )
                                                ) : null}
                                            </div>

                                        </div>
                                    </motion.div>

                                </div>
                            ) : null}

                            <div className="col-12 mt-4">
                                <motion.div initial={{scale: 0}}
                                            animate={{scale: 1}}
                                            transition={{duration: 0.2, delay: 1}}>
                                    <div className={`p-3 radius-8 border`}>
                                        <div className={`pt-2`}>
                                            <div className={`pb-3 pl-0`}>
                                                <button
                                                    onClick={() => this.switchTransactions('transactions')}
                                                    className={`btn radius-0 col-sm-12 col-lg-2 col-md-3 mr-0 weight-500 ${this.state.transactionsTab == 'transactions' ? 'background-dark-blue text-white' : `${styles.blueBorder}`}`}>
                                                    Transactions
                                                </button>

                                                <button
                                                    onClick={() => this.switchTransactions('mining')}
                                                    className={`btn ml-0 col-sm-12 col-lg-2 col-md-3 text-black ml-0 weight-500 radius-0 ${this.state.transactionsTab == 'mining' ? 'background-dark-blue text-white' : `${styles.blueBorder}`}`}>
                                                    Mining income
                                                </button>
                                            </div>

                                            {this.state.transactionsTab === 'transactions' ? (
                                                this.state.filteredTransactions.length ? (
                                                    <div>

                                                        <div className={'border-bottom pb-4 mb-3'}>
                                                            <div className="row align-items-end">

                                                                <div className={`col-12 mt-3 mt-lg-0`}>
                                                                    <div
                                                                        className={`w-100 mb-3 mb-md-0 order-2 order-md-3 text-md-right text-center`}>
                                                                        <Link
                                                                            to={{pathname: "https://explorer.pktpal.com/address/" + this.state.walletAddress}}
                                                                            target={'_blank'}
                                                                            className="btn btn-link weight-500 color-dark-blue p-2 pl-4 pr-4 text-nowrap radius-8">
                                                                            View in Block Explorer
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                        </div>

                                                        <div className="d-flex">

                                                            <div className="ml-auto col-sm-auto col-md-auto">
                                                                <div
                                                                    className={`w-100 mb-3 mb-md-0 order-2 order-md-3 pb-3`}>
                                                                    <div
                                                                        className={`mr-1 ml-3 chevron-down`}>
                                                                        <select defaultValue={'none'} name=""
                                                                                onChange={e => this.changeTransactionType(e)}
                                                                                className={`${styles.mewFormControl} mb-0 w-100 border-0 radius-8 mr-4`}>
                                                                            <option value="none" disabled={true}>
                                                                                Transaction type
                                                                            </option>
                                                                            <option value="all">All</option>
                                                                            <option value="sent">Sent</option>
                                                                            <option value="received">Received</option>
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>


                                                        <TransactionsMobile
                                                            filteredTransactions={this.state.filteredTransactions}
                                                            walletAddress={this.state.walletAddress}/>


                                                        <div className={`table-responsive`}>
                                                            <table className="table d-none d-md-table">
                                                                <thead>
                                                                <tr>
                                                                    <th className={'border-0'}>Date</th>
                                                                    <th className={'border-0'}>Type</th>
                                                                    <th className={'border-0'}>Wallet address</th>
                                                                    <th className={'border-0'}>Transaction ID</th>
                                                                    <th className={'border-0'}>Amount</th>
                                                                </tr>
                                                                </thead>

                                                                {this.state.filteredTransactions.map((result, index) => {
                                                                    return (
                                                                        <tbody key={index}>
                                                                        <tr>
                                                                            <td data-toggle="collapse"
                                                                                data-target={`#result-${result.txid}`}
                                                                                className={'border-0 text-nowrap'}>
                                                                                {moment(result.blockTime).format("DD MMM YYYY HH:mm")}
                                                                            </td>
                                                                            <td data-toggle="collapse"
                                                                                data-target={`#result-${result.txid}`}
                                                                                className={'border-0'}>
                                                                                {result.input && result.input[0] && result.input[0].address == this.state.walletAddress ? (
                                                                                    <span>Sent</span>
                                                                                ) : (
                                                                                    <span>Received</span>
                                                                                )}
                                                                            </td>
                                                                            <td data-toggle="collapse"
                                                                                data-target={`#result-${result.txid}`}
                                                                                className={'border-0'}>
                                                                                {result.input && result.input[0] && result.input[0].address == this.state.walletAddress ? (
                                                                                    <span>
                                                                                {result.output.map(function (output) {
                                                                                    return (
                                                                                        output.address !== this.state.walletAddress ? (
                                                                                            output.address
                                                                                        ) : null
                                                                                    );
                                                                                }, this)}
                                                                                </span>
                                                                                ) : (
                                                                                    <span>
                                                                                {result.input.map(function (input) {
                                                                                    return (
                                                                                        input.address !== this.state.walletAddress ? (
                                                                                            input.address
                                                                                        ) : null
                                                                                    );
                                                                                }, this)}
                                                                                </span>
                                                                                )}
                                                                            </td>
                                                                            <td className={'border-0 text-nowrap pt-1'}>

                                                                                <Tooltip
                                                                                    placement="top"
                                                                                    trigger={['hover']}
                                                                                    overlay={
                                                                                        <span>{result.txid}</span>}>
                                                                                <span data-toggle="collapse"
                                                                                      data-target={`#result-${result.txid}`}>
                                                                                      {result.txid.substring(0, 20).toString()}...

                                                                                </span>
                                                                                </Tooltip>
                                                                                <Tooltip placement="top"
                                                                                         trigger={['click']}
                                                                                         overlay={
                                                                                             <span>Copied!</span>}>
                                                                                    <button
                                                                                        data-toggle="none"
                                                                                        onClick={(e) => copyAddress(result.txid, e)}
                                                                                        className="btn bg-white ml-1 p-2">
                                                                                        <svg width="23" height="23"
                                                                                             viewBox="0 0 18 23"
                                                                                             fill="none"
                                                                                             xmlns="http://www.w3.org/2000/svg">
                                                                                            <path
                                                                                                d="M10 6.5H4V4.5H10V6.5Z"
                                                                                                fill="#0F1114"/>
                                                                                            <path
                                                                                                d="M10 10.5H4V8.5H10V10.5Z"
                                                                                                fill="#0F1114"/>
                                                                                            <path
                                                                                                d="M4 14.5H10V12.5H4V14.5Z"
                                                                                                fill="#0F1114"/>
                                                                                            <path fillRule="evenodd"
                                                                                                  clipRule="evenodd"
                                                                                                  d="M0 18.5V0.5H14V4.5H18V22.5H4V18.5H0ZM12 16.5V2.5H2V16.5H12ZM14 6.5V18.5H6V20.5H16V6.5H14Z"
                                                                                                  fill="#0F1114"/>
                                                                                        </svg>
                                                                                    </button>
                                                                                </Tooltip>
                                                                            </td>
                                                                            <td data-toggle="collapse"
                                                                                data-target={`#result-${result.txid}`}
                                                                                className={'border-0 text-nowrap'}>
                                                                                {result.input && result.input[0] && result.input[0].address == this.state.walletAddress ? (
                                                                                    <span>-
                                                                                        {result.output.map(function (output, index) {
                                                                                            return (
                                                                                                output.address !== this.state.walletAddress ? (
                                                                                                    pktNumber(output.value, true)
                                                                                                ) : null
                                                                                            );
                                                                                        }, this)}
                                                                                </span>
                                                                                ) : (
                                                                                    <span>+
                                                                                        {result.output.map(function (output, index) {
                                                                                            return (
                                                                                                output.address === this.state.walletAddress ? (
                                                                                                    pktNumber(output.value, true)
                                                                                                ) : null
                                                                                            );
                                                                                        }, this)}
                                                                                </span>
                                                                                )} PKT
                                                                                {/*{pktNumber(result.value)} PKT*/}
                                                                            </td>
                                                                            <th className={'border-0 cursor-pointer'}
                                                                                data-toggle="collapse"
                                                                                data-target={`#result-${result.txid}`}>
                                                                                <button className={'bg-white'}>
                                                                                    <svg width="20" height="12"
                                                                                         viewBox="0 0 20 12"
                                                                                         fill="none"
                                                                                         xmlns="http://www.w3.org/2000/svg">
                                                                                        <path
                                                                                            d="M18.2969 1.48633L9.79688 9.98633L1.29687 1.48633"
                                                                                            stroke="#141414"
                                                                                            strokeWidth="2"/>
                                                                                    </svg>
                                                                                </button>
                                                                            </th>

                                                                        </tr>


                                                                        <tr>
                                                                            <td colSpan="12"
                                                                                className="hiddenRow background-gray radius-5 border-0 p-0">
                                                                                <div
                                                                                    className="accordian-body p-2 mt-3 collapse"
                                                                                    id={`result-${result.txid}`}>
                                                                                    <div className={'container'}>
                                                                                        <div className="row">

                                                                                            <div
                                                                                                className={'col-12 col-md-6 col-lg-6'}>
                                                                                                From
                                                                                            </div>
                                                                                            <div
                                                                                                className={'col-12 col-md-6 col-lg-6'}>
                                                                                                To
                                                                                            </div>

                                                                                            <div
                                                                                                className={'col-12 col-md-5 col-lg-5'}>
                                                                                                {result.input.map(function (input, index) {
                                                                                                    return (
                                                                                                        <div
                                                                                                            key={index}
                                                                                                            className={`${styles.transactionInfo} bg-white p-3  radius-8  flex justify-content-between ${index > 0 ? 'mt-3' : ''}`}>
                                                                                                        <span>
                                                                                                            <Tooltip
                                                                                                                placement="top"
                                                                                                                trigger={['hover']}
                                                                                                                overlay={
                                                                                                                    <span>{input.address}</span>}>
                                                                                                                <span>

                                                                                                            {input.address == this.state.walletAddress ? (
                                                                                                                <span> This Address</span>
                                                                                                            ) : (
                                                                                                                <span>{input.address.substring(0, 25).toString()}...</span>
                                                                                                            )}
                                                                                                                </span>
                                                                                                            </Tooltip>
                                                                                                        </span>
                                                                                                            <span>{pktNumber(input.value, true)} PKT</span>
                                                                                                        </div>
                                                                                                    );
                                                                                                }, this)}

                                                                                            </div>

                                                                                            <div
                                                                                                className={'col-12 col-md-1 col-lg-1 flex justify-content-center mt-4'}>
                                                                                                <svg width="24"
                                                                                                     height="10"
                                                                                                     viewBox="0 0 24 10"
                                                                                                     fill="none"
                                                                                                     xmlns="http://www.w3.org/2000/svg">
                                                                                                    <path
                                                                                                        d="M23.0676 5.07194L18.8178 0.908203L17.406 2.30081L19.2414 4.09904L0.932347 4.09707L0.932129 6.0632L19.2368 6.06516L17.4153 7.86183L18.8319 9.24974L23.0676 5.07194Z"
                                                                                                        fill="#141414"/>
                                                                                                </svg>
                                                                                            </div>


                                                                                            <div
                                                                                                className={'col-12 col-md-6 col-lg-5'}>

                                                                                                {result.output.map(function (output, index) {
                                                                                                    return (
                                                                                                        <div
                                                                                                            key={index}
                                                                                                            className={`${styles.transactionInfo} bg-white p-3 radius-8 flex justify-content-between ${index > 0 ? 'mt-3' : ''}`}>
                                                                                                        <span>
                                                                                                            <Tooltip
                                                                                                                placement="top"
                                                                                                                trigger={['hover']}
                                                                                                                overlay={
                                                                                                                    <span>{output.address}</span>}>
                                                                                                                <span>
                                                                                                                {output.address == this.state.walletAddress ? (
                                                                                                                    <span> This Address</span>
                                                                                                                ) : (
                                                                                                                    <span>{output.address.substring(0, 25).toString()}...</span>
                                                                                                                )}
                                                                                                                </span>
                                                                                                            </Tooltip>

                                                                                                        </span>
                                                                                                            <span>{pktNumber(output.value, true)} PKT</span>
                                                                                                        </div>
                                                                                                    );
                                                                                                }, this)}
                                                                                            </div>

                                                                                            <div
                                                                                                className={'col-12 col-md-5 col-lg-5 mt-3'}>
                                                                                                <Link
                                                                                                    to={{pathname: "https://explorer.pktpal.com/tx/" + result.txid}}
                                                                                                    target={'_blank'}
                                                                                                    className={'btn text-black underline pl-0'}>
                                                                                                    View transaction
                                                                                                    in
                                                                                                    Block
                                                                                                    Explorer
                                                                                                </Link>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>

                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                        </tbody>
                                                                    )
                                                                })}
                                                            </table>

                                                            {this.state.transactionsNextPage ? (
                                                                <div className={`text-center mt-4`}>
                                                                    <button
                                                                        onClick={() => this.loadMoreTransactions()}
                                                                        className={`${this.state.loadTransactions ? 'disabled' : null} btn font-weight-bold radius-0 background-black text-white `}
                                                                        disabled={this.state.loadTransactions}>
                                                                        See more transactions
                                                                        {this.state.loadTransactions ? (
                                                                            <div
                                                                                className="spinner-border spinner-border-sm font-14 ml-2"
                                                                                role="status">
                                                                            </div>) : null}
                                                                    </button>
                                                                </div>
                                                            ) : null}

                                                        </div>
                                                    </div>
                                                ) : (

                                                    !this.state.loadingTransactions ? (
                                                        <p className={'text-center p-3'}>You don't have any
                                                            transactions</p>
                                                    ) : (
                                                        <div>
                                                            <Load/>
                                                        </div>

                                                    )
                                                )
                                            ) : (

                                                <div>

                                                    <div className={`pb-3`}>

                                                        <span className={'weight-500'}>Export</span>

                                                    </div>

                                                    <div className={'border-bottom pb-4 mb-3'}>
                                                        <div className="row align-items-center">
                                                            <div className={`col-12 col-md-6 col-lg-4`}>
                                                                <div className={`row align-items-center`}>
                                                                    <div className={`col-md-6 col-sm-12`}>
                                                                        <DatePicker
                                                                            className={'background-gray p-2 mt-2 radius-8 w-100'}
                                                                            selected={this.state.startDate}
                                                                            wrapperClassName={`calendar-icon w-100`}
                                                                            onChange={(date) => this.handleStartChange(date)}/>
                                                                    </div>
                                                                    <div className={`col-md-6 col-sm-12`}>
                                                                        <DatePicker
                                                                            className={'background-gray p-2 mr-3 mt-2 radius-8 w-100'}
                                                                            wrapperClassName={`calendar-icon w-100`}
                                                                            selected={this.state.endDate}
                                                                            onChange={(date) => this.handleEndChange(date)}/>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className={`col-12 col-md-3 col-lg-2`}>
                                                                <button
                                                                    onClick={() => this.export('mining')}
                                                                    className="w-100 btn mt-2 btn-primary text-white p-2 pl-5 pr-5 text-nowrap radius-5">
                                                                    Export
                                                                </button>
                                                            </div>

                                                            <div className={`col-12 col-lg-6 mt-3 mt-lg-0`}>
                                                                <div
                                                                    className={`w-100 mb-3 mb-md-0 order-2 order-md-3 text-md-right text-center`}>
                                                                    <Link
                                                                        to={{pathname: "https://explorer.pktpal.com/address/" + this.state.walletAddress}}
                                                                        target={'_blank'}
                                                                        className="btn btn-link mt-2 weight-500 color-dark-blue p-2 pl-4 pr-4 text-nowrap radius-8">
                                                                        View in Block Explorer
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        </div>


                                                    </div>


                                                    <div className={`table-responsive`}>
                                                        <table className="table">
                                                            <thead>
                                                            <tr>
                                                                <th className={'border-0'}>Date</th>
                                                                <th className={'border-0'}>Amount</th>
                                                            </tr>
                                                            </thead>

                                                            {this.state.mining.map((result, index) => {
                                                                return (
                                                                    <tbody key={index}>
                                                                    <tr>
                                                                        <td className={'border-0'}>{moment(result.date).format('D MMM, YYYY')}</td>
                                                                        <td className={'border-0'}>+ {pktNumber(result.received)} PKT</td>
                                                                    </tr>
                                                                    </tbody>
                                                                )
                                                            })}
                                                        </table>
                                                        {this.state.miningNextPage ? (
                                                            <div className={`text-center`}>
                                                                <button
                                                                    onClick={() => this.loadMoreMinings()}
                                                                    className={`${this.state.loadMiningIncome ? 'disabled' : null} btn font-weight-bold  radius-0 background-black text-white`}
                                                                    disabled={this.state.loadMiningIncome}>
                                                                    Load more
                                                                    {this.state.loadMiningIncome ? (
                                                                        <div
                                                                            className="spinner-border spinner-border-sm font-14 ml-2"
                                                                            role="status">
                                                                        </div>) : null}
                                                                </button>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                ) : (

                    <div>
                        <Load/>
                    </div>

                )}
                <SendPkt wallet={this.state.walletAddress}
                         USDPrice={this.state.USDPrice}/>
                <TransactionSent show={this.state.showTransactionSentModal} to={this.state.transactionSentTo}
                                 amount={this.state.transactionAmount}/>
                <TransactionFailed/>
                <ChooseWallet service={this.state.selectedService}
                              wallet={this.state.rackModeWallet} history={this.props.history}/>
                <PairDevice show={this.state.showPairModal} url={this.state.devicePairUrl}
                            serviceId={this.state.serviceId} mac={this.state.macAddress}/>
                <DevicePaired show={this.state.showDevicePairedModal}/>
                <DevicePairingFailed show={this.state.showDevicePairingFailedModal}/>
                <ExportSeed/>
                <Footer/>

            </div>
        )
    }
}

export default withRouter(Statistics)
