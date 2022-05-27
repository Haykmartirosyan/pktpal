import React, {Component} from 'react'
import Emitter from '../../services/emitter';
import Tooltip from 'rc-tooltip';
import {Load} from '../../components/Loadings/Load'
import {pasteAddress} from "../Helpers/GlobalHelpers";
import {balance, pktNumber, validateAddress} from "../Helpers/StatisticsHelpers";
import NotificationSystem from 'react-notification-system';
import styles from "../user/Dashboard/Pkt/Statisctics.module.scss";
import * as Sentry from "@sentry/react";
import cookie from "react-cookies";

class SendPkt extends Component {
    notificationSystem = React.createRef();

    constructor(props) {
        super(props);
        this.state = {
            transactionData: {
                from: '',
                to: '',
                amount: '',
                description: '',
                sign_req: '',
                msg: '',
            },
            waitTransactionResponse: false,
            macAddress: '',
            walletAddress: '',
            walletBalance: 0,
            errors: {},
            activeDevices: []
        };
        this.handleChange = this.handleChange.bind(this);
    }

    componentDidMount() {
        let _this = this;

        Emitter.on('showSendPktModal', (data) => {
            if (!data.devices) {
                let wallet = _this.props.wallet ? _this.props.wallet : data.walletAddress;

                if (wallet) {
                    balance(wallet).then(data => {
                        if (data.balance) {
                            _this.setState({
                                walletBalance: pktNumber(data.balance),
                            });
                        } else {
                            _this.setState({
                                walletBalance: 0,
                            });
                        }
                    })
                }
                _this.setState({
                    macAddress: data.macAddress,
                    walletAddress: data.walletAddress ? data.walletAddress : '',
                });
            } else {
                _this.setState({
                    activeDevices: data.devices,
                    macAddress: data.devices[0].mac_address,
                    walletAddress: data.devices[0].wallet_address,
                });

                balance(data.devices[0].wallet_address).then(data => {
                    if (data.balance) {
                        _this.setState({
                            walletBalance: pktNumber(data.balance),
                        });
                    } else {
                        _this.setState({
                            walletBalance: 0,
                        });
                    }
                });
            }
            $('#sendPktModal').modal('show');

        });
        push.subscribe('transaction').bind('App\\Events\\TransactionCompleted', function (data) {

            if (_this.state.macAddress === data.transaction.mac_address) {
                _this.setState({
                    waitTransactionResponse: false,
                });

                if (data.data.status == 'success' && data.transactionId) {
                    console.log('success-log', data)
                    Emitter.emit('transactionSent', {
                        to: _this.state.transactionData.to,
                        amount: _this.state.transactionData.amount,
                        transactionId: data.transactionId
                    });
                } else {
                    console.log('error-log', data)
                    Emitter.emit('transactionFailed', {details: data.transactionId});
                }

                $('#sendPktModal').modal('hide');
            }
        });
    }

    closeModal() {
        Emitter.emit('closingModal', true);
        $('#sendPktModal').modal('hide');
    }

    handleChange(e) {
        let value = e.target.value;
        this.setState(prevState => ({
            transactionData: {
                ...prevState.transactionData, [e.target.name]: value
            }
        }));
    }

    addNotification(message, level) {
        const notification = this.notificationSystem.current;
        notification.addNotification({
            level: level,
            position: 'br',
            children: (
                <div>
                    <h6 className={'p-2'}>{message}</h6>
                </div>
            )
        });
    };

    validateTransactionData() {
        let _this = this;
        let isValid = true;
        let errors = {};
        if (!_this.state.transactionData.to && !document.getElementById("toAddress").value) {
            errors["to"] = "To Address is required";
            isValid = false;
        } else {
            _this.state.transactionData.to = document.getElementById("toAddress").value
            _this.setState({
                transactionData: _this.state.transactionData
            })
        }

        if (!_this.state.transactionData.amount) {
            errors["amount"] = "Amount is required";
            isValid = false;
        } else {
            if (_this.state.transactionData.amount == 0 || _this.state.transactionData.amount < 0) {
                errors["amount"] = "Transaction amount cannot be 0";
                isValid = false;
            }
            if (_this.state.walletBalance == 0 || _this.state.transactionData.amount && parseFloat(_this.state.transactionData.amount) > parseFloat(_this.state.walletBalance.replace(/,/g, ''))) {
                errors["amount"] = " You don\'t have enough funds for this transaction";
                isValid = false;
            }
        }
        this.setState({errors: errors});
        return isValid;
    }

    changeWalletAddress(e) {
        let _this = this;
        let wallet = e.target.value;

        this.state.activeDevices.map(function (device, index) {
            if (device.wallet_address == wallet) {

                _this.setState({
                    macAddress: device.mac_address,
                    walletAddress: device.wallet_address,
                });
            }
        });

        balance(wallet).then(data => {
            if (data.balance) {
                _this.setState({
                    walletBalance: pktNumber(data.balance),
                });
            } else {
                _this.setState({
                    walletBalance: 0,
                });
            }
        })
    }

    sendPkt() {
        let _this = this;
        let isValid = _this.validateTransactionData();
        let errors = {};

        if (_this.state.transactionData.amount) {
            try {
                validateAddress(_this.state.transactionData.to).then((data) => {
                    if (!data.isValid) {
                        errors["to"] = "Wrong wallet address";
                        this.setState({errors: errors});
                        return false;
                    } else {
                        if (data.type != "addr") {
                            errors["to"] = "Wrong wallet address";
                            this.setState({errors: errors});
                            return false;
                        }
                        if (isValid) {
                            let signReq = {}
                            if (_this.state.transactionData.to && _this.state.transactionData.amount) {
                                signReq = {
                                    to: _this.state.transactionData.to,
                                    amount: parseFloat(_this.state.transactionData.amount).toFixed(2),
                                    description: _this.state.transactionData.description,
                                }
                            } else {
                                return;
                            }
                            Sentry.captureMessage('Send PKT');

                            window.pkteerSignReq(_this.state.macAddress, signReq, function (error, ret) {
                                Sentry.captureMessage('Send PKT Error ' + error);
                                Sentry.captureMessage('Send PKT Success ' + ret);

                                if (error) {
                                    Sentry.captureMessage('Send PKT Error');

                                    Sentry.captureMessage(error);
                                    return null;
                                } else {
                                    Sentry.captureMessage('Send PKT +');

                                    _this.state.transactionData.from = _this.props.wallet ? _this.props.wallet : _this.state.walletAddress;
                                    _this.state.transactionData.sign_req = ret.sig;
                                    _this.state.transactionData.msg = ret.msg;
                                    _this.setState({
                                        transactionData: _this.state.transactionData,
                                    });
                                    let data = {
                                        transactionData: _this.state.transactionData,
                                        macAddress: _this.state.macAddress
                                    };
                                    axios.post(api_routes.user.sendPkt(), data).then(response => {
                                        return response;
                                    }).then(json => {
                                        if (json.status === 201) {
                                            _this.setState({
                                                waitTransactionResponse: true,
                                            });
                                        }
                                    }).catch(error => {
                                        Sentry.captureException(error);
                                        _this.addNotification(error.response.data.message, 'error');
                                        console.log('error', error)
                                    });
                                }
                            });
                        }
                    }
                })
            } catch (e) {
                Sentry.captureException(e);

            }

        }


    }

    render() {
        return (
            <div>

                <div className="modal fade" id="sendPktModal" tabIndex="-1" role="dialog"
                     aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
                        <div className="modal-content p-2">
                            <div className="modal-body">
                                {!this.state.waitTransactionResponse ? (
                                    <div>
                                        <button type="button" className="close"
                                                onClick={(e) => this.closeModal()}
                                                aria-label="Close">
                                            <span aria-hidden="true">&times;</span>
                                        </button>
                                        <h4 className="modal-title mb-3 font-weight-bold" id="exampleModalLabel">
                                            Send PKT
                                        </h4>

                                        <div className="form-group">
                                            <label className={''}>From</label>
                                            {!this.state.activeDevices.length ? (
                                                <input type="text" className="p-4 background-gray border-0 form-control"
                                                       placeholder={this.props.wallet ? this.props.wallet : this.state.walletAddress}
                                                       disabled={true}/>
                                            ) : (

                                                <div
                                                    className={`chevron-down`}>
                                                    <select defaultValue={this.state.walletAddress}
                                                            onChange={(e) => this.changeWalletAddress(e)}

                                                            className={`${styles.mewFormControl} ${styles.mewFormControlHeight} background-gray w-100 border-0 radius-8 form-control pr-5`}>

                                                        {this.state.activeDevices.map(function (device, index) {
                                                            return (

                                                                <option key={index}
                                                                        value={device.wallet_address}>{device.wallet_address}</option>

                                                            )
                                                        }, this)}
                                                    </select>
                                                </div>
                                            )}


                                        </div>
                                        <div className="form-group">
                                            <label className={''}>To</label>
                                            <div className="flex justify-content-between">

                                                <input type="text"
                                                       id={'toAddress'}
                                                       name={`to`}
                                                       onChange={this.handleChange}
                                                       className={
                                                           `p-4 background-gray form-control 
                                                           ${this.state.errors["to"] ? 'borderDanger' : 'border-0'}`
                                                       }/>

                                                <Tooltip placement="top" trigger={['hover']}
                                                         overlay={<span>Paste address</span>}>
                                                    <button onClick={(e) => pasteAddress()}
                                                            className={'pl-3 pr-3 ml-2 bg-white border radius-8 btn'}>
                                                        <svg width="18" height="23" viewBox="0 0 18 23" fill="none"
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
                                            <p className={'text-danger font-14'}>{this.state.errors["to"]}</p>

                                        </div>

                                        <div className="form-group">
                                            <label className={''}>Amount</label>
                                            <div className="flex justify-content-between">
                                                <input type="number"
                                                       min="1"
                                                       name={`amount`}
                                                       onChange={this.handleChange}
                                                       className={`p-4 background-gray form-control text-left 
                                                       ${this.state.errors["amount"] ? 'borderDanger' : 'border-0'}`}
                                                       placeholder="PKT"/>


                                                {/*<div className={'p-3'}>*/}
                                                {/*    <svg width="24" height="9" viewBox="0 0 24 9" fill="none"*/}
                                                {/*         xmlns="http://www.w3.org/2000/svg">*/}
                                                {/*        <path*/}
                                                {/*            d="M4.24267 0.257812L5.65688 1.67203L3.82842 3.50049H20.1716L18.3431 1.67203L19.7573 0.257812L24 4.50045L19.7572 8.7431L18.343 7.32889L20.1714 5.50049H3.82845L5.65685 7.32889L4.24264 8.7431L0 4.50046L4.24267 0.257812Z"*/}
                                                {/*            fill="#424A52"/>*/}
                                                {/*    </svg>*/}
                                                {/*</div>*/}
                                                {/*<input type="text"*/}
                                                {/*       disabled={true}*/}
                                                {/*       value={this.state.transactionData.amount ? (exchangeNumber(parseInt(this.state.transactionData.amount) / parseInt(this.state.USDPrice))) : ''}*/}
                                                {/*       className="text-right p-4 background-gray border-0 form-control"*/}
                                                {/*       placeholder="USD"/>*/}
                                            </div>
                                            <p className={'text-danger font-14'}>{this.state.errors["amount"]}</p>

                                        </div>

                                        <div className="form-group">
                                            <label className={''}>Description</label>
                                            <input type="text"
                                                   name={`description`}
                                                   onChange={this.handleChange}
                                                   className="p-4 background-gray border-0 form-control"
                                                   placeholder="Text"/>
                                        </div>

                                        <div className="mb-2">
                                            <button type="button"
                                                    disabled={this.state.waitTransactionResponse}
                                                    onClick={(e) => this.sendPkt()}
                                                    className={`btn btn-primary w-100 font-weight-bold ${this.state.waitTransactionResponse ? 'disabled' : ''}`}>
                                                Send
                                            </button>
                                        </div>
                                    </div>
                                ) : (

                                    <div>
                                        <Load/>
                                    </div>

                                )}

                            </div>
                        </div>
                    </div>
                </div>
                <NotificationSystem ref={this.notificationSystem}/>
            </div>
        )
    }
}

export default SendPkt
