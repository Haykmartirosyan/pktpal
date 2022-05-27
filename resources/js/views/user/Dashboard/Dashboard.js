import React, {Component} from 'react'
import Header from '../../../components/Header/Header';
import Footer from '../../../components/Footer/Footer';
import styles from './Dashboard.module.css';
import {Link} from "react-router-dom";
import Tooltip from 'rc-tooltip';
import CubeImg from "../../../../../public/images/cube.png"
import Switch from "react-switch";
import ChooseWallet from "../../Modals/ChooseWallet";
import Emitter from '../../../services/emitter';
import {
    pktNumber,
    balance,
    getExchangeRate,
    getUserPktServices,
    getUserPktServicesWallets
} from '../../Helpers/StatisticsHelpers'
import {copyAddress} from "../../Helpers/GlobalHelpers";
import {Load} from "../../../components/Loadings/Load";
import cookie from "react-cookies";
import SendPkt from "../../Modals/SendPkt";
import TransactionSent from "../../Modals/TransactionSent";
import TransactionFailed from "../../Modals/TransactionFailed";
import DeviceMobile from "./DeviceMobile";
import {motion} from "framer-motion"
import {connect} from "react-redux";
import ReactPaginate from "react-paginate";
import * as Sentry from "@sentry/react";

class Home extends Component {
    constructor() {
        super();
        this.state = {
            pktServices: [],
            totalBalance: 0,
            totalMined24: 0,
            showEditPktName: false,
            showEditBlockId: null,
            changedValue: null,
            showChooseWalletModal: false,
            rackModeWallet: '',
            selectedService: '',
            showLoading: true,
            USDPrice: 0,
            rackModeDisabled: false,
            rackModeHide: false,
            showDisableRackModeLoading: false,
            disableRackModeId: '',
            selectedPeriod: 'year',
            activeDevices: [],
            showTransactionSentModal: false,
            transactionSentTo: '',
            transactionAmount: '',
            skip: 0,
            pagesCount: 0,
            walletAddresses: [],
            showTotalAndMined24: false
        };

        this.handleRackModeChange = this.handleRackModeChange.bind(this);
        this.handleName = this.handleName.bind(this);

    }

    componentDidMount() {
        let _this = this;
        _this.mountComponent();
        getUserPktServicesWallets().then((json) => {
            _this.setState({
                walletAddresses: json.data.wallet_addresses,
            }, () => {
                _this.getTotalBalance()
            })
        })

        push.subscribe('result-rackmode').bind('App\\Events\\RackModeResultEvent', function (data) {
            if (data.status === 'success' && data.type === 'rack' && _this.state.showDisableRackModeLoading) {
                _this.updatePkt(_this.state.disableRackModeId, {type: 'node'});
            }
        });

        Emitter.on('closingModal', (data) => {
            _this.setState({
                selectedService: '',
                showChooseWalletModal: false,
                showTransactionSentModal: false,
            });
        });

        Emitter.on('transactionSent', (data) => {
            _this.setState({
                showTransactionSentModal: true,
                transactionSentTo: data.to,
                transactionAmount: data.amount,
            });
        });

        Emitter.on('transactionFailed', (data) => {
            Emitter.emit('showTransactionFailedModal', {data});
        });

        Emitter.on('rackModeEnabled', (data) => {
            _this.mountComponent();
        });

    }

    mountComponent() {
        let _this = this;
        let token = cookie.load('accessToken');
        if (token) {

            getUserPktServices(_this.state.skip).then((json) => {

                let activeDevices = [];
                this.setDisabledRackMode();

                if (json.data.pkt_services.length) {
                    if (json.data.pkt_services.length === 1 && Math.ceil(+json.data.count / 10) === 1) {
                        return json.data.pkt_services[0].type === 'node'
                            ? this.props.history.push('/pkt/details/' + json.data.pkt_services[0].id)
                            : this.props.history.push('/pkt/rack/details/' + json.data.pkt_services[0].id);
                    }
                    this.setState({
                        pktServices: json.data.pkt_services,
                        pagesCount: Math.ceil(+json.data.count / 10)
                    });

                } else {
                    _this.setState({
                        showLoading: false
                    })
                }

                getExchangeRate().then((data) => {
                    _this.setState({
                        USDPrice: data.price,
                    });
                });

                _this.state.pktServices.forEach(async (item, index) => {
                    if (item.wallet_address) {
                        if (cookie.load('devicePaired_' + item.id) && item.type === 'node') {
                            if (item.online && item.freeze === 0) {
                                activeDevices.push(item);
                            }
                        }
                        _this.balance(item, index);
                    }
                    await _this.setState({
                        activeDevices: activeDevices,
                        showLoading: false
                    })
                });
            });
        } else {
            return this.props.history.push('/login');
        }
    }


    handleName(e) {
        let value = e.target.value;
        this.setState({
            changedValue: value,
        });
    }

    balance(item, index) {
        balance(item.wallet_address).then((data) => {
            if (data.balance) {
                this.state.pktServices[index].balance = pktNumber(data.balance);
                this.state.pktServices[index].mined24 = pktNumber(data.mined24);

                this.setState({
                    pktServices: this.state.pktServices,
                });
            }
        });
    }

    getTotalBalance() {
        let _this = this;
        let i = 0;
        setTimeout(function getBalance() {
            if (i < _this.state.walletAddresses.length) {
                balance(_this.state.walletAddresses[i]).then((data) => {
                    if (data.balance) {
                        _this.state.totalBalance += parseInt(data.balance);
                        _this.state.totalMined24 += parseInt(data.mined24);
                    }
                    _this.setState({
                        totalBalance: _this.state.totalBalance,
                        totalMined24: _this.state.totalMined24,
                    })
                    i++;
                    setTimeout(getBalance, 300)
                })
            } else {
                _this.setState({
                    showTotalAndMined24: true
                })
            }
        }, 300)

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
                if (pktService.online && pktService.freeze === 0) {
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

    editPktName(pktService) {
        this.setState({
            showEditPktName: true,
            showEditBlockId: pktService.id,
            changedValue: pktService.name,
        });
    }

    handleRackModeChange(checked, id) {
        let service = '';

        this.state.pktServices.filter(item => {
            if (item.id == id) {
                service = item;
            }
        });

        if (checked) {
            let rackWallet = '';

            for (let i = 0; i < this.state.pktServices.length; i++) {

                let item = this.state.pktServices[i];
                if (item.id != id && item.type === 'node') {
                    rackWallet = item.wallet_address;
                    break;
                }
            }

            Emitter.emit('openChooseWalletModal', {
                macAddress: service.mac_address,
                rackWallet: rackWallet
            });
            this.setState({
                pktServices: this.state.pktServices,
                selectedService: service,
                rackModeWallet: rackWallet,
            });
        } else {
            this.setRackModeData(id)
        }
    }

    setRackModeData(serviceId) {
        let data = {
            service_id: serviceId,
        };
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
                    showDisableRackModeLoading: true,
                    disableRackModeId: serviceId
                })
            }
        });
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
                showDisableRackModeLoading: false,
                disableRackModeId: '',
            });

            this.mountComponent();
        }).catch(error => {
            Sentry.captureException(error);
            console.log('error', error)
        });
    }

    selectDevicesForSend(devices) {
        Emitter.emit('showSendPktModal',
            {
                devices: devices
            }
        );
    }

    nextPage(e) {
        this.setState({
            skip: this.state.skip = e.selected * 10,
        });
        this.mountComponent()
    }

    render() {
        return (
            <div>
                <Header/>
                {!this.state.showLoading ? (
                    !this.state.pktServices.length ? (
                        <motion.div initial={{scale: 0}}
                                    animate={{scale: 1}}
                                    transition={{duration: 0.6}}>
                            <div className="container mt-4">

                                <div className="row align-items-start align-items-lg-stretch">

                                    <div className="col-12 col-md-6 col-lg-4">
                                        <div className={`background-dark-blue p-4 h-100 radius-8 text-white`}>
                                            <div className={`pt-3 pb-2 border-bottom`}>
                                                <h5 className={'font-weight-bold '}>Hello {this.props.init.user.display_name}</h5>

                                                <h6>You have no active devices</h6>

                                                <p className={'font-14 mt-4 mb-2'}>
                                                    Balance
                                                </p>

                                                <h6 className={'pt-0'}>0.00 PKT</h6>
                                            </div>
                                            <div className={`mt-4 text-center`}>
                                                <a href={"https://pktpal.com/my-account/orders/"}
                                                   className="btn bg-white mb-3 color-dark-blue font-weight-bold btn-wide">
                                                    View orders
                                                </a>
                                                <a href={"https://pktpal.com/pkt-cube/"}
                                                   className="btn bg-white mb-3 color-dark-blue font-weight-bold btn-wide">
                                                    Shop now
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`background-gray col-12 col-md-6 col-lg-8 radius-8 mt-3 mt-md-0`}>
                                        <div className={`row ${styles.noDevices}`}>
                                            <div className={`col-12 col-lg-7`}>
                                                <div className={`pt-3 pb-3`}>
                                                    <h3 className={'font-weight-bold'}>
                                                        PKT Cube
                                                    </h3>
                                                    <p className="text-black">
                                                        Now the internet pays you.
                                                    </p>
                                                    <p>
                                                        The PKT Cube is the latest edge node
                                                        from PKT Pal, perfect for your home or office! The device is
                                                        plug & play and allows people with no technical background earn
                                                        money
                                                        from their internet. Just plug it in, set it and forget it, and
                                                        get
                                                        paid
                                                        every 60 seconds for your wasted bandwidth. Now you can turn the
                                                        unused
                                                        internet bandwidth you are already paying for into CASH!
                                                    </p>

                                                    <a href={'https://pktpal.com/learn/'}
                                                       className={`btn-wide btn-primary pt-3 pb-3 btn  text-white font-weight-bold radius-8`}>
                                                        Start learning today
                                                    </a>
                                                </div>
                                            </div>
                                            <div className={`col-12 col-lg-5`}>
                                                <img className={`${styles.dashboardDeviceImg} mt-3 mt-lg-5 img-fluid`}
                                                     src={CubeImg}
                                                     alt=""/>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </motion.div>
                    ) : (
                        <div>
                            <div className={`mt-4 p-3 text-white background-dark-blue ${styles['bg-none']}`}>
                                <motion.div initial={{scale: 0}}
                                            animate={{scale: 1}}
                                            transition={{duration: 0.2}}>

                                    <div className={`container`}>
                                        <div
                                            className={`row align-items-center background-dark-blue ${styles['device-box']}`}>
                                            <div className={'col-md-4 col-12 mb-4 mb-md-0'}>
                                                <motion.h4 initial={{scale: 0}}
                                                           animate={{scale: 1}}
                                                           transition={{duration: 0.3, delay: 0.2}}
                                                           className={'font-weight-bold pr-5 m-0'}>
                                                    Hello {this.props.init.user.first_name && this.props.init.user.last_name ? this.props.init.user.first_name + ' ' + this.props.init.user.last_name : this.props.init.user.display_name}
                                                </motion.h4>
                                            </div>
                                            <div className={'col-md-4 col-12 mb-4 mb-md-0'}>
                                                <motion.div initial={{scale: 0}}
                                                            animate={{scale: 1}}
                                                            transition={{duration: 0.3, delay: 0.5}}>
                                                    <div
                                                        className={'m-0 d-flex justify-content-between justify-content-md-center'}>
                                                        <span>Balance: </span>
                                                        {this.state.showTotalAndMined24 ? (
                                                            <div className={`d-flex justify-content-end flex-wrap`}>
                                                                    <span
                                                                        className={'ml-3'}>{pktNumber(this.state.totalBalance)} PKT</span>
                                                                <span className={'ml-3'}>
                                                                        $ {this.state.totalBalance ? pktNumber(parseFloat(this.state.totalBalance) * parseFloat(this.state.USDPrice)) : 0}
                                                                    </span>
                                                            </div>
                                                        ) : (
                                                            <div
                                                                className="spinner-border spinner-border-sm font-14 ml-2 mt-1"
                                                                role="status">
                                                            </div>
                                                        )}

                                                    </div>
                                                </motion.div>
                                            </div>

                                            <div className={'col-md-4 col-12'}>
                                                <motion.div initial={{scale: 0}}
                                                            animate={{scale: 1}}
                                                            transition={{duration: 0.3, delay: 0.8}}>
                                                    <div
                                                        className={'d-flex justify-content-between justify-content-md-end'}>
                                                        <span>Mined last 24h:</span>
                                                        {this.state.showTotalAndMined24 ? (
                                                            <span
                                                                className={'ml-3'}>{pktNumber(this.state.totalMined24)} PKT</span>
                                                        ) : (
                                                            <div
                                                                className="spinner-border spinner-border-sm font-14 ml-2 mt-1"
                                                                role="status">
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                            <motion.div initial={{scale: 0}}
                                        animate={{scale: 1}}
                                        transition={{
                                            duration: 0.5,
                                            delay: 1.1
                                        }}
                            >
                                <div className={'container'}>
                                    <div className={`mt-3`}>
                                        <div>
                                            <div className={`pb-3 pl-0 text-md-right text-center`}>
                                                <div className="dropdown">
                                                    {this.state.activeDevices.length ? (
                                                        <button className={` btn background-dark-blue text-white btn-wide radius-5 col-2 mr-0 weight-500
                                                                        ${!this.state.activeDevices.length ? 'disabled' : null}`}
                                                                onClick={() => this.selectDevicesForSend(this.state.activeDevices)}>
                                                            Send
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className={` btn background-dark-blue text-white btn-wide disabled radius-5 col-2 mr-0 weight-500`}>
                                                            Send
                                                        </button>
                                                    )}
                                                </div>

                                            </div>


                                        </div>

                                        <DeviceMobile pktServices={this.state.pktServices}
                                                      showEditPktName={this.state.showEditPktName}
                                                      showEditBlockId={this.state.showEditBlockId}
                                                      disableRackModeId={this.state.disableRackModeId}
                                                      showDisableRackModeLoading={this.state.showDisableRackModeLoading}
                                                      rackModeHide={this.state.rackModeHide}
                                                      rackModeDisabled={this.state.rackModeDisabled}
                                                      parent={this}/>

                                        <table
                                            className={`d-none d-md-table table table-borderless table-responsive mt-2 ${styles.devicesTable}`}>
                                            <thead>
                                            <tr>
                                                <th scope="col" className={`font-weight-normal`}>Name</th>
                                                <th scope="col" className={`font-weight-normal text-nowrap`}>Wallet
                                                    address
                                                </th>
                                                <th scope="col" className={`font-weight-normal text-nowrap`}>Mac
                                                    address
                                                </th>
                                                <th scope="col" className={`font-weight-normal`}>Balance</th>
                                                <th scope="col" className={`font-weight-normal`}>Rack mode</th>
                                            </tr>
                                            </thead>

                                            <tbody>

                                            {this.state.pktServices.map(function (pktService, index) {
                                                return (
                                                    <tr key={index}
                                                        className={`background-gray radius-8 mb-3`}>
                                                        <td className={'align-middle radius-left-top-8 radius-left-bottom-8'}>

                                                            {(!this.state.showEditPktName && !this.state.showEditBlockId) || this.state.showEditBlockId && this.state.showEditBlockId != pktService.id ? (
                                                                <div className={'flex justify-content-between w-100'}>

                                                                    <div>
                                                                        {pktService.name ? pktService.name : 'My PKT Cube'}
                                                                        {this.state.pktServices.length > 1 && !pktService.name && index > 0 ? (
                                                                            <span> {index + 1}</span>
                                                                        ) : null}
                                                                    </div>
                                                                    <div className={''}
                                                                         id={`pkt-name-${pktService.id}`}>
                                                                        <button className={'mr-2 background-gray'}
                                                                                onClick={(e) => this.editPktName(pktService)}>
                                                                            <svg width="17" height="17"
                                                                                 viewBox="0 0 17 17"
                                                                                 fill="none"
                                                                                 xmlns="http://www.w3.org/2000/svg">
                                                                                <path fillRule="evenodd"
                                                                                      clipRule="evenodd"
                                                                                      d="M15.6072 0.71967C15.3022 0.426777 14.8077 0.426777 14.5027 0.71967L13.8213 1.37394C12.9504 0.974408 11.8757 1.12101 11.1543 1.81373L2.87031 9.76869L7.28843 14.0113L15.5724 6.05638C16.2938 5.36365 16.4465 4.3316 16.0304 3.49526L16.7117 2.84099C17.0167 2.5481 17.0167 2.07322 16.7117 1.78033L15.6072 0.71967ZM12.2738 7.10265L7.28843 11.89L5.07937 9.76869L10.0647 4.98133L12.2738 7.10265ZM13.6939 5.73894L14.4679 4.99572C14.7729 4.70282 14.7729 4.22795 14.4679 3.93506L13.3633 2.87439C13.0583 2.5815 12.5638 2.5815 12.2588 2.87439L11.4849 3.61762L13.6939 5.73894Z"
                                                                                      fill="#141414"/>
                                                                                <path
                                                                                    d="M0.562012 16.2127L2.21911 10.3787L6.63693 14.6217L0.562012 16.2127Z"
                                                                                    fill="#141414"/>
                                                                            </svg>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className={'flex justify-content-between'}>

                                                                    <div>
                                                                        <input type="text"
                                                                               onChange={this.handleName}
                                                                               className={`p-2 radius-5 bg-white w-100`}
                                                                               placeholder={`PKT name`}
                                                                               defaultValue={pktService.name}/>
                                                                    </div>
                                                                    <div className={'flex justify-content-between'}>
                                                                        <button className={'mr-2 background-gray'}
                                                                                onClick={() => this.updatePkt(pktService.id)}>
                                                                            <svg width="12" height="10"
                                                                                 viewBox="0 0 12 10"
                                                                                 fill="none"
                                                                                 xmlns="http://www.w3.org/2000/svg">
                                                                                <path
                                                                                    d="M4.5859 6.41467L1.75748 3.58624L0.343262 5.00045L4.5859 9.24309L11.657 2.17203L10.2428 0.757812L4.5859 6.41467Z"
                                                                                    fill="#141414"/>
                                                                            </svg>

                                                                        </button>

                                                                    </div>
                                                                </div>
                                                            )}

                                                        </td>
                                                        <td className={'align-middle'}>
                                                            {pktService.wallet_address && pktService.type == 'node' ? (
                                                                <div>
                                                                    {pktService.wallet_address}
                                                                    <button
                                                                        onClick={() => copyAddress(pktService.wallet_address)}
                                                                        className="btn background-gray ml-1 p-2">
                                                                        <Tooltip placement="top" trigger={['click']}
                                                                                 overlay={<span>Copied!</span>}>
                                                                            <svg width="23" height="23"
                                                                                 viewBox="0 0 18 23"
                                                                                 fill="none"
                                                                                 xmlns="http://www.w3.org/2000/svg">
                                                                                <path d="M10 6.5H4V4.5H10V6.5Z"
                                                                                      fill="#0F1114"/>
                                                                                <path d="M10 10.5H4V8.5H10V10.5Z"
                                                                                      fill="#0F1114"/>
                                                                                <path d="M4 14.5H10V12.5H4V14.5Z"
                                                                                      fill="#0F1114"/>
                                                                                <path fillRule="evenodd"
                                                                                      clipRule="evenodd"
                                                                                      d="M0 18.5V0.5H14V4.5H18V22.5H4V18.5H0ZM12 16.5V2.5H2V16.5H12ZM14 6.5V18.5H6V20.5H16V6.5H14Z"
                                                                                      fill="#0F1114"/>
                                                                            </svg>
                                                                        </Tooltip>
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                '-'
                                                            )}

                                                        </td>
                                                        <td className={'align-middle'}>
                                                            {pktService.mac_address}
                                                        </td>
                                                        <td className={'align-middle'}>
                                                            {pktService.balance ? (
                                                                <span> {pktService.balance} PKT</span>
                                                            ) : (
                                                                '-'
                                                            )}
                                                        </td>

                                                        <td className={`align-middle ${styles.recsMode}`}>

                                                            {(!this.state.disableRackModeId && !this.state.showDisableRackModeLoading) || (this.state.disableRackModeId !== pktService.id) ? (

                                                                this.state.pktServices.length > 1 && !this.state.rackModeHide ? (

                                                                    !cookie.load('devicePaired_' + pktService.id) || (this.state.rackModeDisabled && pktService.type == 'node') ? (
                                                                        <Switch
                                                                            disabled={true}
                                                                            onChange={e => e}
                                                                            onColor={'#023DB5'}
                                                                            checkedIcon={false}
                                                                            uncheckedIcon={false}
                                                                            width={36}
                                                                            height={22}
                                                                            checked={pktService.type === 'rack' ? true : false}/>
                                                                    ) : (
                                                                        <Switch
                                                                            disabled={this.state.rackModeDisabled && pktService.type == 'node'}
                                                                            onChange={e => this.handleRackModeChange(e, pktService.id)}
                                                                            onColor={'#023DB5'}
                                                                            checkedIcon={false}
                                                                            uncheckedIcon={false}
                                                                            width={36}
                                                                            height={22}
                                                                            checked={pktService.type === 'rack' ? true : false}/>
                                                                    )

                                                                ) : '-'

                                                            ) : (

                                                                <div
                                                                    className="spinner-border  spinner-border-sm color-dark-blue"
                                                                    role="status">
                                                                </div>

                                                            )}
                                                        </td>

                                                        <td className={'align-middle radius-right-top-8 radius-right-bottom-8'}>
                                                            <Link
                                                                to={{pathname: pktService.type == 'node' ? "/pkt/details/" + pktService.id : "/pkt/rack/details/" + pktService.id}}

                                                                className={`font-500 btn btn-link text-black p-0 color-dark-blue`}>
                                                                <u>See Details</u>
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                );
                                            }, this)}

                                            </tbody>
                                        </table>
                                        {this.state.pagesCount > 1 ? (
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
                                            />
                                        ) : null}

                                    </div>

                                </div>
                            </motion.div>
                        </div>

                    )
                ) : (

                    <div>
                        <Load/>
                    </div>

                )}
                <ChooseWallet show={this.state.showChooseWalletModal} service={this.state.selectedService}
                              wallet={this.state.rackModeWallet}/>
                <SendPkt wallet={null}
                         USDPrice={this.state.USDPrice}/>

                <TransactionSent show={this.state.showTransactionSentModal} to={this.state.transactionSentTo}
                                 amount={this.state.transactionAmount}/>
                <TransactionFailed/>
                <Footer/>
            </div>
        )
    }
}

const init = state => ({
    init: state.init,
});


export default connect(init, null)(Home)

