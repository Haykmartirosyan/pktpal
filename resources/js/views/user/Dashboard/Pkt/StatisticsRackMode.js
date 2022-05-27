import React, {Component} from 'react';
import {Link, withRouter} from "react-router-dom";
import Header from "../../../../components/Header/Header";
import Footer from "../../../../components/Footer/Footer";
import styles from './Statisctics.module.scss';
import DatePicker from "react-datepicker";
import SendPkt from '../../../Modals/SendPkt'
import "react-datepicker/dist/react-datepicker.css";
import {Line, defaults} from 'react-chartjs-2';
import Emitter from "../../../../services/emitter";
import TransactionSent from "../../../Modals/TransactionSent";
import Tooltip from 'rc-tooltip';
import {copyAddress} from "../../../Helpers/GlobalHelpers";
import {Load} from "../../../../components/Loadings/Load";
import Switch from "react-switch";
import {motion} from "framer-motion"

import {
    balance,
    mining,
    pktNumber,
    groupByMonth,
    getUserPktService,
    getStatusReport,
    groupByMonthAndYear,
    getUserPktServices
} from '../../../Helpers/StatisticsHelpers'
import DeviceDropDown from "./DeviceDropDown";
import * as Sentry from "@sentry/react";

defaults.animation = false;

class StatisticsRackMode extends Component {
    constructor(props) {

        super(props);
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
            mined24: '',
            mining: [],
            miningNextPage: '',
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

            UsedBandwidthData: {
                labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                datasets: [
                    {
                        label: '',
                        data: [12, 15, 19, 23, 12, 17, 3],
                        fill: true,
                        backgroundColor: "rgba(18, 150, 235, 0.18)",
                        borderColor: "#1296EB",
                        tension: 0.4
                    },

                ],
            },
            showSendPktModal: false,
            showTransactionSentModal: false,
            transactionSentTo: '',
            selectedPeriod: 'year',
            showLoading: true,
            rackModeDisabled: false,
            pktServices: {},
            rackModeWallet: '',
            selectedService: '',
            showDropDownContent: false,
            usedBandwidth: 0,
            encryptionTime: 0,
            showDisableRackModeLoading: false,
            turnedOff: false,
            loadMiningIncome: false,
            windowWidth: window.innerWidth >= 420,

        };
    }

    componentDidMount() {
        let _this = this;
        Emitter.on('closingModal', (data) => {
            _this.setState({
                showTransactionSentModal: false,
                showSendPktModal: false,
            });
        });

        this.mountComponent(this.state.serviceId);

        setInterval(function () {
            _this.mountComponent(_this.state.serviceId,false)
        }, 60 * 1000);

        push.subscribe('result-rackmode').bind('App\\Events\\RackModeResultEvent', function (data) {
            console.log('result-rackmode', data)
            if (data.status === 'success' && data.type === 'rack' && _this.state.showDisableRackModeLoading) {
                _this.updatePkt(_this.state.serviceId);
            } else {
                _this.setState({
                    showDisableRackModeLoading: false
                })
            }
        });
    }

    componentDidUpdate(prevProps, nextProps) {
        if (this.props.location !== prevProps.location) {
            this.mountComponent(this.props.match.params.id)
        }
    }

    mountComponent(id, updateMining = true) {
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
                if (_this.state.pktType == 'node') {
                    return this.props.history.push('/pkt/details/' + this.state.serviceId)
                }
                if (_this.state.walletAddress) {
                    balance(_this.state.walletAddress).then((dataBalance) => {
                        _this.setState({
                            balance: pktNumber(dataBalance.balance),
                            mined24: pktNumber(dataBalance.mined24),
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
                        if (updateMining) {
                            mining(_this.state.walletAddress).then((data) => {
                                _this.state.showLineChart = true;
                                _this.setState({
                                    mining: data.results,
                                    miningNextPage: data.next,
                                });
                                _this.changeSelectedPeriod();
                            });
                        }
                    });
                } else {
                    _this.changeSelectedPeriod();

                    _this.setState({
                        turnedOff: true,
                    });
                }
                this.setState({showLoading: false});
            }).catch(e => {
                Sentry.captureException(e);
                return this.props.history.push('/404');
            })
        }
    }


    setDisabledRackMode() {
        if (this.state.pktServices.length === 1) {
            this.setState({
                rackModeDisabled: true,
            });
        } else {
            let nodeCount = 0;
            this.state.pktServices.map((pktService) => {
                if (pktService.type === 'node') {
                    nodeCount += 1;
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
            firstMonth = moment().subtract(1, 'years').format('YYYY-MM')
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


    loadMoreMinings() {
        this.setState({
            loadMiningIncome: true
        })
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
        }).catch(error => {
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


    changeSelectedPeriod(event) {
        let _this = this;
        let period = null;
        let value = event ? event.target.value : 'year';
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

    setRackModeData(serviceId) {
        let data = {
            service_id: serviceId,
        }
        return new Promise((resolve, reject) => {
            axios.post(api_routes.user.disableRackMode(), data).then(response => {
                return response;
            }).then(json => {
                resolve(json);
            }).catch(error => {
                Sentry.captureException(error);
                reject(error)
            });
        }).then((response) => {
            if (response.data.success) {
                this.setState({
                    showDisableRackModeLoading: true
                })
            }
        });
    }


    updatePkt(id) {
        let data = {
            'type': 'node'
        };
        axios.put(api_routes.user.updateService(id), data).then(response => {
            return response;
        }).then(json => {

            if (json.data.success) {
                this.props.history.push('/pkt/details/' + id)
            }

        }).catch(error => {
            Sentry.captureException(error);
            console.log('error', error)
        });
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
                                            className={`background-dark-blue ${styles.paddingBox} radius-8 text-white h-100`}>
                                    <div className="dropdown">
                                        <button
                                            className={`btn dropdown-toggle btn-block bg-white color-dark-blue d-flex align-items-center ${styles.warningItem}`}
                                            type="button"
                                            id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true"
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

                                    <div className="flex justify-content-between border-bottom mt-3 pb-3">
                                        <p className={`mb-0`}>Total mined</p>
                                        <h5 className={`mb-0`}>{this.state.balance} PKT</h5>
                                    </div>
                                    <div>
                                        <div className={'flex justify-content-between mt-3'}>
                                            <p className={`mb-0`}>Mined last 24h</p>
                                            <h5 className={`mb-0`}>{this.state.mined24} PKT</h5>
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
                                                    <span className={`ml-1`}>
                                                        <i className="far fa-question-circle"/>
                                                    </span>
                                                </p>
                                                <p className={`py-2`}>
                                                    {this.state.macAddress}
                                                </p>
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
                                                             overlay={<span>The number of data-encryptions which are being performed per second as part of the PacketCrypt algorithm. Since PacketCrypt proof-of-work is based on encryption, this number is very similar to the number of packets which could be encrypted in a VPN context.</span>}>
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

                                    <div className={`mt-3`}>
                                        {this.state.pktServices.length > 1 ? (
                                            <div>
                                                <p className={`mb-2`}>Rack mode
                                                    <Tooltip placement="top" trigger={['hover']}
                                                             overlay={<span>If this is enabled, your PktCube will automatically forward all of its coins to another PktCube of your choice so you don’t need to manage multiple wallets.</span>}>
                                                    <span className={`ml-1`}>
                                                        <i className="far fa-question-circle"/>
                                                    </span>
                                                    </Tooltip>
                                                </p>
                                                {!this.state.showDisableRackModeLoading ? (
                                                    <Switch
                                                        onChange={e => this.setRackModeData(this.state.serviceId)}
                                                        disabled={this.state.turnedOff}
                                                        onColor={'#023DB5'}
                                                        offColor={'#F6F7F8'}
                                                        checkedIcon={false}
                                                        uncheckedIcon={false}
                                                        width={36}
                                                        height={22}
                                                        checked={this.state.pktType === 'rack' ? true : false}/>
                                                ) : (

                                                    <div
                                                        className="spinner-border  spinner-border-sm color-dark-blue"
                                                        role="status">
                                                    </div>

                                                )}
                                            </div>
                                        ) : null}

                                    </div>
                                </motion.div>
                            </div>

                            <div className="col-12 col-md-12 col-lg-12 mt-4">

                                <motion.div initial={{scale: 0}}
                                            animate={{scale: 1}}
                                            transition={{duration: 0.2, delay: 0.6}}
                                            className={`p-3 radius-8 border`}>
                                    <div className={`pt-2`}>
                                        <div>
                                            <p className="float-left">Mining Income
                                                <Tooltip placement="top" trigger={['hover']}
                                                         overlay={<span>The aggregate amount of coins which this address has accumulated in daily increments.</span>}>
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
                                            <Line type="area" height={80} data={this.state.LineData} options={
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
                                </motion.div>
                            </div>

                            <div className="col-12 col-md-12 col-lg-12 mt-4">
                                <motion.div initial={{scale: 0}}
                                            animate={{scale: 1}}
                                            transition={{duration: 0.2, delay: 0.8}}
                                            className={`p-3 radius-8 border`}>
                                    <div className={`pt-2`}>
                                        <div className={`pb-3`}>

                                            <button
                                                className={`btn ml-1 text-black font-weight-bold`}>
                                                Mining income
                                            </button>
                                        </div>
                                        <div>
                                            <div className={`pb-3`}>
                                                <span>Export</span>
                                            </div>

                                            <div className={'border-bottom pb-4 mb-3'}>
                                                <div className="row align-items-center">
                                                    <div className={`col-12 col-md-6 col-lg-4`}>
                                                        <div className={`row align-items-center`}>
                                                            <div className={`col-6`}>
                                                                <DatePicker
                                                                    className={'background-gray p-2  radius-8 w-100'}
                                                                    wrapperClassName={`calendar-icon`}
                                                                    selected={this.state.endDate}
                                                                    onChange={(date) => this.handleEndChange(date)}/>
                                                            </div>

                                                            <div className={`col-6`}>
                                                                <DatePicker
                                                                    className={'background-gray p-2 mr-3  radius-8 w-100'}
                                                                    wrapperClassName={`calendar-icon`}
                                                                    selected={this.state.startDate}
                                                                    onChange={(date) => this.handleStartChange(date)}/>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className={`col-12 col-lg-8 mt-3 mt-lg-0`}>
                                                        <div
                                                            className={`row align-items-center flex-md-nowrap flex-wrap`}>

                                                            <div
                                                                className={`w-100 mt-md-0 mt-3 text-center text-md-left`}>
                                                                <button
                                                                    className="background-dark-blue text-white p-2 pl-4 pr-4 text-nowrap radius-8">View
                                                                    in Block Explorer
                                                                </button>
                                                            </div>
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
                <SendPkt show={this.state.showSendPktModal} wallet={this.state.walletAddress}/>
                <TransactionSent show={this.state.showTransactionSentModal} to={this.state.transactionSentTo}/>
                <Footer/>

            </div>
        )
    }
}

export default withRouter(StatisticsRackMode)
