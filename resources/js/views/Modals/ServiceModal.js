import React, {Component} from 'react';
import Emitter from "../../services/emitter";
import {balance, getExchangeRate, pktNumber} from "../Helpers/StatisticsHelpers";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from "../user/Bill/Payments.module.scss";
import {connect} from "react-redux";
import {createPayment, toggleFavorite, updatePayment} from "../Helpers/PaymentsHelpers";
import {CountryDropdown, RegionDropdown} from 'react-country-region-selector';
import CompletedSubscription from "./CompletedSubscription";
import FailedSubscription from "./FailedSubscription";
import Tooltip from "rc-tooltip";
import moment from "moment";
import * as Sentry from "@sentry/react";

class ServiceModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            billService: "",
            agreement: false,
            errors: {},
            USDPrice: 0,
            balance: 0,
            isFavorite: false,
            sig: '',
            msg: '',
            disabledButton: false,
            onlineService: false,
            subscriptionData: {
                email: '',
                bill_service_id: '',
                service_name: '',
                service_id: '',
                user_id: '',
                address: '',
                account_number: '',
                holder_name: '',
                apartment: '',
                city: '',
                phone: '',
                amount: '',
                recurring: false,
                payment_date: "",
                country: '',
                state: '',
                zip_code: '',
                description: '',
                direct_debit_id: ''
            },
            macAddress: '',
            type: ''
        };
        this.baseState = this.state;
        this.handleDueDateChange = this.handleDueDateChange.bind((this));
        this.handleChange = this.handleChange.bind(this);
        this.handleCountry = this.handleCountry.bind(this);
        this.handleState = this.handleState.bind(this);
    }

    componentDidMount() {
        let _this = this;
        Emitter.on('showServiceModal', (data) => {
            if (data.type == 'new-payment') {
                _this.setState(_this.baseState, () => {
                    _this.myFormRef.reset();
                    if (data.billService) {
                        _this.setState(prevState => ({
                            subscriptionData: {
                                ...prevState.subscriptionData, bill_service_id: data.billService.id,
                            }
                        }));
                    }

                    _this.setState(prevState => ({
                        subscriptionData: {
                            ...prevState.subscriptionData, service_id: data.serviceId
                        }
                    }));

                    _this.setState({
                        billService: data.billService ? data.billService : null,
                        isFavorite: data.billService?.user_favorite?.length ? data.billService.user_favorite.length : null,
                        onlineService: data.onlineService,
                        macAddress: data.macAddress,
                    });

                    _this.getBalance(data.walletAddress)
                });
            } else {
                if (data.payment.bill_service_with_favorite) {
                    _this.setState(prevState => ({
                        subscriptionData: {
                            ...prevState.subscriptionData, bill_service_id: data.payment.bill_service_with_favorite.id,
                        }
                    }));
                }

                _this.setState(prevState => ({
                    subscriptionData: {
                        ...prevState.subscriptionData, service_id: data.payment.pkt_service.id
                    }
                }));

                Object.keys(data.payment).map(key => {
                    _this.setState(prevState => ({
                        subscriptionData: {
                            ...prevState.subscriptionData,
                            [key]: key == 'payment_date' ? new Date(data.payment[key]) : data.payment[key]
                        }
                    }), () => {
                        if (key == 'amount') {
                            _this.getExchangeRate()
                        }
                    });
                });

                _this.setState({
                    billService: data.payment.bill_service_with_favorite ? data.payment.bill_service_with_favorite : null,
                    isFavorite: data.payment.bill_service_with_favorite?.user_favorite.length ? data.payment.bill_service_with_favorite?.user_favorite.length : null,
                    onlineService: data.onlineService,
                    macAddress: data.payment.pkt_service.mac_address
                });

                _this.getBalance(data.payment.pkt_service.wallet_address)
            }
            _this.setState(prevState => ({
                subscriptionData: {
                    ...prevState.subscriptionData, user_id: this.props.init.user.ID
                }
            }));

            _this.setState(prevState => ({
                subscriptionData: {
                    ...prevState.subscriptionData, email: this.props.init.user.user_email
                }
            }));

            _this.setState({
                type: data.type
            });
            $('#subscriptionForm').modal('show');

        });

        push.subscribe('result-add-direct-debit').bind('App\\Events\\AddDirectDebit', function (data) {
            console.log('addDirectDebit-response', data);
            if (data.status === 'success') {
                _this.setState(prevState => ({
                    subscriptionData: {
                        ...prevState.subscriptionData, direct_debit_id: data.detail
                    }
                }));
                createPayment(_this.state.subscriptionData).then(response => {
                    if (response.data) {
                        _this.setState({
                            disabledButton: false
                        });
                        _this.closeModal();
                        Emitter.emit('openSubscriptionCompletedModal')
                    }
                })
            } else {
                _this.closeModal();
                Emitter.emit('openSubscriptionFailedModal', data.detail);
                _this.setState({
                    disabledButton: false
                })
            }
        });

        push.subscribe('result-alter-direct-debit').bind('App\\Events\\AlterDirectDebit', function (data) {
            if (data.directDebitId == _this.state.subscriptionData.direct_debit_id) {
                console.log('alterDirectDebit-response', data);
                if (data.status === 'success') {
                    updatePayment(_this.state.subscriptionData).then(response => {
                        if (response.data) {
                            _this.setState({
                                disabledButton: false
                            });
                            _this.closeModal();
                            Emitter.emit('updatedPayment');
                            Emitter.emit('openSubscriptionCompletedModal')
                        }
                    })
                } else {
                    let reasonData = {
                        payment_id: _this.state.payment.id,
                        reason: "The transaction is not made"
                    };
                    _this.addFailedLog(reasonData).then(r => {
                        Emitter.emit('transactionFailed', {details: reasonData.reason});
                    })
                }
            }
        });
    }

    closeModal() {
        $('#subscriptionForm').modal('hide');
    }

    getBalance(wallet_address) {
        balance(wallet_address).then((data) => {
            this.setState({
                balance: data.balance ? pktNumber(data.balance) : null
            });
        });
    }

    checkIfEditable() {
        return this.state.type == 'recent-payment' || moment(this.state.subscriptionData.payment_date).diff(moment().format('YYYY-MM-DD'), 'days') <= 1
    }

    makeBillPayment() {
        let _this = this;
        let isValid = this.validateSubscriptionData();
        if (isValid) {
            let enoughFunds = parseFloat(this.state.balance.replace(/,/g, '')) > parseFloat(this.state.subscriptionData.amount / this.state.USDPrice);
            if (enoughFunds) {
                if (this.state.type == 'new-payment') {
                    let signReq = {
                        purpose: this.state.billService?.title ? this.state.billService.title : this.state.subscriptionData.service_name,
                        recipient_id: '' + this.state.subscriptionData.user_id,
                        asset: 'PKT',
                        day: parseFloat((this.state.subscriptionData.amount / this.state.USDPrice).toFixed(2)),
                        week: parseFloat((this.state.subscriptionData.amount / this.state.USDPrice).toFixed(2)),
                        month: parseFloat((this.state.subscriptionData.amount / this.state.USDPrice).toFixed(2)),
                    };
                    window.pkteerSignReq(this.state.macAddress, signReq, function (error, ret) {
                        if (error) {
                            Sentry.captureMessage(error);
                            return null;
                        } else {
                            _this.setState({
                                sig: ret.sig,
                                msg: ret.msg
                            });

                            _this.addDirectDebit().then(() => {
                                _this.setState({
                                    disabledButton: true
                                })

                            }).catch(e => {
                                Sentry.captureException(e);
                                _this.setState({
                                    disabledButton: false
                                })
                            })
                        }
                    });
                } else {
                    _this.alterDebit().then(() => {
                        _this.setState({
                            disabledButton: true
                        })

                    }).catch(e => {
                        Sentry.captureException(e);
                        _this.setState({
                            disabledButton: false
                        })
                    })
                }
            } else {
                this.closeModal();
                Emitter.emit('openSubscriptionFailedModal')
            }

        }
    }

    alterDebit() {
        return new Promise((resolve, reject) => {
            let data = {
                event: 'alter_spending_limits',
                amount: parseFloat((this.state.subscriptionData.amount / parseFloat(this.state.USDPrice)).toFixed(2)),
                directDebitId: this.state.subscriptionData.direct_debit_id
            };
            axios.post(api_routes.financialManager.bill.alterDirectDebit(this.state.subscriptionData.service_id), data).then(response => {
                return response.data;
            }).then(json => {
                resolve(json);
            }).catch(error => {
                Sentry.captureException(error);
                reject(error)
            });
        });
    }

    addDirectDebit() {
        return new Promise((resolve, reject) => {
            let data = {
                event: 'add_direct_debit',
                sig: this.state.sig,
                msg: this.state.msg
            };
            axios.post(api_routes.user.bill.addDirectDebit(this.state.subscriptionData.service_id), data).then(response => {
                return response.data;
            }).then(json => {
                resolve(json);
            }).catch(error => {
                Sentry.captureException(error);
                reject(error)
            });
        });
    }

    validateSubscriptionData() {
        let isValid = true;
        let errors = {};

        let validationArray = [
            'address',
            'account_number',
            'holder_name',
            'apartment',
            'city',
            'phone',
            'amount',
            'country',
            'state',
            'zip_code',
            'payment_date'
        ];

        if (!this.state.billService) {
            validationArray.push('service_name', 'description')
        }

        validationArray.map(key => {
                if (!this.state.subscriptionData[key] && !document.getElementById(key).value) {
                    errors[key] = "This field is required";
                    isValid = false;
                } else if (key == 'amount') {
                    if (document.getElementById('amount').value <= 0) {
                        errors["amount"] = "Invalid amount";
                        isValid = false;
                    }
                } else {
                    this.state.subscriptionData[key] = key == 'payment_date' ? new Date(document.getElementById(key).value) : document.getElementById(key).value;
                    this.setState({
                        subscriptionData: this.state.subscriptionData
                    })
                }
            }
        );
        this.setState({errors: errors});
        return isValid;
    }

    getExchangeRate() {
        getExchangeRate().then((data) => {
            this.setState({
                USDPrice: data.price,
            });
        }).then(() => {
            document.getElementById('pktPrice').value = +(this.state.subscriptionData.amount / parseFloat(this.state.USDPrice)).toFixed(2)
        })
    }

    handleDueDateChange(date) {
        this.setState(prevState => ({
            subscriptionData: {
                ...prevState.subscriptionData, payment_date: date
            }
        }));
    }

    handleAgreement() {
        this.setState({
            agreement: !this.state.agreement,
        });
    }

    handleCountry(e) {
        this.setState(prevState => ({
            subscriptionData: {
                ...prevState.subscriptionData, country: e
            }
        }));
    }

    handleState(e) {
        this.setState(prevState => ({
            subscriptionData: {
                ...prevState.subscriptionData, state: e
            }
        }));
    }

    makeFavorite() {
        toggleFavorite(this.state.billService.id).then(() => {
            this.setState({
                isFavorite: !this.state.isFavorite
            });
            Emitter.emit('toggleFavorite', {
                serviceId: this.state.billService.id,
            });
        })
    }

    handleChange(e) {
        let value = e.target.name == 'recurring' ? e.target.checked : e.target.value;
        this.setState(prevState => ({
            subscriptionData: {
                ...prevState.subscriptionData, [e.target.name]: value
            }
        }));
        if (e.target.name == 'amount') {
            if (document.getElementById('amount').value > 0) {
                this.getExchangeRate()
            } else {
                document.getElementById('pktPrice').value = 0
            }
        }
    }

    render() {
        return (
            <div>
                <div className="modal fade" id="subscriptionForm" tabIndex="-1" role="dialog"
                     aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
                        <div className="modal-content p-3">
                            <div className="modal-body">
                                <button type="button" className="close"
                                        onClick={() => this.closeModal()}
                                        aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                                {this.state.billService ? (
                                    <div className='d-md-flex'>
                                        <div
                                            className={`flex align-items-start justify-content-center my-4 my-md-0`}>
                                            <img src={`/images/services/${this.state.billService.logo}`}
                                                 className={`${styles.serviceLogoModal} img-fluid pt-2`}
                                                 alt={this.state.billService.title}/>
                                        </div>
                                        <div>
                                            <div className='d-flex'>
                                                <h2 className={'ml-3 font-weight-bold text-break'}>{this.state.billService.title}</h2>
                                                <button className='bg-white flex align-items-start mt-2'
                                                        onClick={() => this.makeFavorite()}>
                                                    <i className={`${this.state.isFavorite ? 'fas fa-star' : 'far fa-star'} fa-lg text-primary`}
                                                       aria-hidden="true"/>
                                                </button>
                                            </div>
                                            <div className='ml-3'>
                                                {this.state.billService.description}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`w-50`}>
                                        <h3 className={`font-weight-bold my-2`}>Please choose a service</h3>
                                        <p className={`mb-2`}>You can choose any utility payment service to pay your
                                            bills.</p>
                                    </div>
                                )}

                                <form className={'mt-3'} ref={(el) => this.myFormRef = el}>
                                    <h3 className='font-weight-bold'>Subscription details</h3>
                                    {!this.state.billService ? (
                                        <input type='text' placeholder='Service name'
                                               id={'service_name'}
                                               value={this.state.subscriptionData.service_name}
                                               disabled={this.checkIfEditable()}
                                               onChange={this.handleChange}
                                               name={`service_name`}
                                               className={`form-control p-4 bg-light radius-8 mt-3
                                               ${this.state.errors["service_name"] ? 'borderDanger' : 'border-0'}
                                               ${this.checkIfEditable() ? 'disabled' : ''}`}/>
                                    ) : null
                                    }
                                    <p className={'text-danger font-14'}>{this.state.errors["service_name"]}</p>

                                    <input type='text' placeholder='Your email'
                                           id={'email'}
                                           value={this.props.init.user.user_email}
                                           disabled={true}
                                           className={`form-control bg-light radius-8 mt-3 px-4 disabled ${styles.divHeight}
                                               ${this.state.errors["email"] ? 'borderDanger' : 'border-0'}`}/>
                                    <p className={'text-danger font-14'}>{this.state.errors["email"]}</p>

                                    <input type='text' placeholder="Account holder's full name"
                                           id={'holder_name'}
                                           value={this.state.subscriptionData.holder_name}
                                           disabled={this.checkIfEditable()}
                                           onChange={this.handleChange}
                                           name={`holder_name`}
                                           className={`form-control px-4 bg-light radius-8 mt-3 ${styles.divHeight}
                                           ${this.checkIfEditable() ? 'disabled' : ''}
                                               ${this.state.errors["holder_name"] ? 'borderDanger' : 'border-0'}`}/>
                                    <p className={'text-danger font-14'}>{this.state.errors["holder_name"]}</p>

                                    <input type='text' placeholder="Account number"
                                           id={'account_number'}
                                           value={this.state.subscriptionData.account_number}
                                           disabled={this.checkIfEditable()}
                                           onChange={this.handleChange}
                                           name={`account_number`}
                                           className={`form-control px-4 bg-light radius-8 mt-3 ${styles.divHeight}
                                           ${this.checkIfEditable() ? 'disabled' : ''}
                                           ${this.state.errors["account_number"] ? 'borderDanger' : 'border-0'}`}/>
                                    <p className={'text-danger font-14'}>{this.state.errors["account_number"]}</p>

                                    <input type='text' placeholder="Account holder's address"
                                           id={'address'}
                                           value={this.state.subscriptionData.address}
                                           disabled={this.checkIfEditable()}
                                           onChange={this.handleChange}
                                           name={`address`}
                                           className={`form-control px-4 bg-light radius-8 mt-3 ${styles.divHeight}
                                           ${this.checkIfEditable() ? 'disabled' : ''}
                                           ${this.state.errors["address"] ? 'borderDanger' : 'border-0'}`}/>
                                    <p className={'text-danger font-14'}>{this.state.errors["address"]}</p>

                                    <div className={`flex justify-content-between mt-3`}>
                                        <div className={`w-50 pr-2`}>
                                            <input type='text' placeholder='Apartment, suite, etc'
                                                   id={`apartment`} onChange={this.handleChange}
                                                   name={`apartment`}
                                                   value={this.state.subscriptionData.apartment}
                                                   disabled={this.checkIfEditable()}
                                                   className={`form-control px-4 bg-light radius-8 ${styles.divHeight}
                                                   ${this.checkIfEditable() ? 'disabled' : ''}
                                        ${this.state.errors["apartment"] ? 'borderDanger' : 'border-0'}`}/>
                                            <p className={'text-danger font-14'}>{this.state.errors["apartment"]}</p>

                                        </div>
                                        <div className={`w-50 pl-2`}>
                                            <input type='text' placeholder='City'
                                                   id={`city`} onChange={this.handleChange}
                                                   value={this.state.subscriptionData.city}
                                                   name={`city`}
                                                   disabled={this.checkIfEditable()}
                                                   className={`form-control px-4 bg-light radius-8 ${styles.divHeight}
                                                   ${this.checkIfEditable() ? 'disabled' : ''}
                                               ${this.state.errors["city"] ? 'borderDanger' : 'border-0'}`}/>
                                            <p className={'text-danger font-14 ml-2'}>{this.state.errors["city"]}</p>

                                        </div>
                                    </div>

                                    <div className={`flex justify-content-between ${styles.wrapDiv}`}>
                                        <div
                                            className={`w-50 chevron-down ${styles.divHeight} ${styles.selectDiv}`}>
                                            <CountryDropdown
                                                value={this.state.subscriptionData.country} id={'country'}
                                                classes={`px-4 bg-light form-control ${styles.mewFormControl} radius-8 ${styles.divHeight}
                                                ${this.checkIfEditable() ? 'disabled' : ''}
                                                ${this.state.errors["country"] ? 'borderDanger' : 'border-0'}`}
                                                defaultOptionLabel={`Country`}
                                                disabled={this.checkIfEditable()}
                                                onChange={(e) => this.handleCountry(e)}/>

                                            <p className={'text-danger font-14'}>{this.state.errors["country"]}</p>
                                        </div>

                                        <div
                                            className={`w-30 chevron-down ${styles.divHeight} ${styles.selectDiv} mt-3 mt-md-0`}>
                                            <RegionDropdown
                                                country={this.state.subscriptionData.country}
                                                value={this.state.subscriptionData.state}
                                                id={'state'}
                                                blankOptionLabel={`State`}
                                                defaultOptionLabel={`State`}
                                                disabled={this.checkIfEditable()}
                                                classes={`px-4 bg-light form-control radius-8 ${styles.divHeight} ${styles.mewFormControl} 
                                                ${this.checkIfEditable() ? 'disabled' : ''}
                                                ${this.state.errors["state"] ? 'borderDanger' : 'border-0'}`}
                                                onChange={(e) => this.handleState(e)}/>
                                            <p className={'text-danger font-14'}>{this.state.errors["state"]}</p>
                                        </div>

                                        <div className={`w-15 ${styles.selectDiv} mt-3 mt-md-0`}>
                                            <input type='text' placeholder='Zip code' id={'zip_code'}
                                                   value={this.state.subscriptionData.zip_code}
                                                   disabled={this.checkIfEditable()}
                                                   onChange={this.handleChange}
                                                   name={`zip_code`}
                                                   className={`px-4 bg-light form-control radius-8 ${styles.divHeight}
                                                   ${this.checkIfEditable() ? 'disabled' : ''}
                                                ${this.state.errors["zip_code"] ? 'borderDanger' : 'border-0'}`}/>
                                            <p className={'text-danger font-14'}>{this.state.errors["zip_code"]}</p>
                                        </div>

                                    </div>
                                    <input type='text' placeholder='Account holder’s contact phone number'
                                           id={'phone'} onChange={this.handleChange}
                                           name={`phone`}
                                           value={this.state.subscriptionData.phone}
                                           disabled={this.checkIfEditable()}
                                           className={`form-control px-4 bg-light radius-8 ${styles.divHeight}
                                           ${this.checkIfEditable() ? 'disabled' : ''}
                                            ${this.state.errors["phone"] ? 'borderDanger' : 'border-0'}`}/>
                                    <p className={'text-danger font-14'}>{this.state.errors["phone"]}</p>
                                    <p className='ml-1'>Amount</p>

                                    <div className='d-flex justify-content-between align-item-start'>
                                        <input type='number'
                                               min="1"
                                               placeholder='USD'
                                               value={this.state.subscriptionData.amount}
                                               disabled={this.checkIfEditable()}
                                               id={'amount'} onChange={this.handleChange}
                                               name={`amount`}
                                               className={`px-4 bg-light radius-8 text-right form-control ${styles.divHeight}
                                               ${this.checkIfEditable() ? 'disabled' : ''}
                                                ${this.state.errors["amount"] ? 'borderDanger' : 'border-0'}`}/>
                                        <div className='mx-3 d-flex align-items-center'>
                                            <svg width="24" height="9" viewBox="0 0 24 9" fill="none"
                                                 xmlns="http://www.w3.org/2000/svg">
                                                <path
                                                    d="M4.24267 0.257812L5.65688 1.67203L3.82842 3.50049H20.1716L18.3431 1.67203L19.7573 0.257812L24 4.50045L19.7572 8.7431L18.343 7.32889L20.1714 5.50049H3.82845L5.65685 7.32889L4.24264 8.7431L0 4.50046L4.24267 0.257812Z"
                                                    fill="#0F1114"/>
                                            </svg>
                                        </div>
                                        <input type='text' placeholder='PKT' disabled={true} id={'pktPrice'}
                                               className={`px-4 border-0 bg-light disabled radius-8 text-right form-control ${styles.divHeight}`}/>
                                    </div>
                                    <p className={'text-danger font-14'}>{this.state.errors["amount"]}</p>

                                    <div className={`mt-1`}>
                                        <DatePicker
                                            className={`form-control px-4 bg-light radius-8 
                                            ${this.checkIfEditable() ? 'disabled' : ''}
                                            ${styles.divHeight} ${this.state.errors["payment_date"] ? 'borderDanger' : 'border-0'}`}
                                            wrapperClassName={`w-100 calendar-icon`}
                                            popperPlacement="top-end"
                                            id="payment_date" placeholderText='Payment due date'
                                            selected={this.state.subscriptionData.payment_date === "" ? null : this.state.subscriptionData.payment_date}
                                            minDate={new Date().setDate(new Date().getDate() + 2)}
                                            disabled={this.checkIfEditable()}
                                            dateFormat={`yyyy-MM-dd`}
                                            onChange={(date) => this.handleDueDateChange(date)}/>
                                    </div>
                                    <p className={'text-danger font-14'}>{this.state.errors["payment_date"]}</p>

                                    {!this.state.billService ? (
                                        <input type='text' placeholder='Description'
                                               id={'description'}
                                               value={this.state.subscriptionData.description}
                                               disabled={this.checkIfEditable()}
                                               onChange={this.handleChange}
                                               name={`description`}
                                               className={`form-control px-4 bg-light radius-8 mt-3 ${styles.divHeight}
                                               ${this.checkIfEditable() ? 'disabled' : ''}
                                               ${this.state.errors["description"] ? 'borderDanger' : 'border-0'}`}/>
                                    ) : null
                                    }
                                    <p className={'text-danger font-14'}>{this.state.errors["description"]}</p>

                                    <div className='mt-3 flex'>
                                        <input type="checkbox" id="recurring"
                                               name="recurring"
                                               checked={this.state.subscriptionData.recurring}
                                               disabled={this.checkIfEditable()}
                                               className={`largeCheckbox ${this.checkIfEditable() ? 'disabled' : ''}`}
                                               onChange={this.handleChange}/>
                                        <label htmlFor='recurring' className='ml-2'>Schedule recurring
                                            payments</label>
                                    </div>

                                    {this.state.type != 'recent-payment' ? (
                                        <div>
                                            <div className='mt-3 flex'>
                                                <input type="checkbox" id="personalData" name="personalData" value="yes"
                                                       className={`largeCheckbox ${this.checkIfEditable() ? 'disabled' : ''}`}
                                                       disabled={this.checkIfEditable()}
                                                       onChange={() => {
                                                           this.handleAgreement()
                                                       }}/>
                                                <label htmlFor='personalData' className='ml-2 pt-0'>I agree to process
                                                    my personal data</label>
                                            </div>
                                            {!this.state.onlineService ? (
                                                <Tooltip placement="top" trigger={['hover']}
                                                         overlay={<span>Your device is offline</span>}>
                                                    <button type='button'
                                                            className={`btn background-dark-blue flex mt-3 w-100 disabled`}>
                                                        <h5 className='text-white font-weight-bold pt-2'>Make payment</h5>
                                                    </button>
                                                </Tooltip>
                                            ) : (
                                                <button type='button'
                                                        className={`btn background-dark-blue mt-3 w-100 ${!this.state.agreement || this.state.disabledButton
                                                        || !this.state.onlineService || this.checkIfEditable() ?
                                                            "disabled" : ""}`}
                                                        disabled={!this.state.agreement || this.state.disabledButton || !this.state.onlineService || this.checkIfEditable()}
                                                        onClick={() => this.makeBillPayment()}>
                                                    <h5 className='text-white font-weight-bold pt-2 flex align-items-center justify-content-center'>Make
                                                        payment
                                                        {this.state.disabledButton ? (
                                                            <div
                                                                className="spinner-border spinner-border-sm font-14 ml-2 text-white"
                                                                role="status">
                                                            </div>) : null
                                                        }
                                                    </h5>
                                                </button>
                                            )}
                                        </div>
                                    ) : null}

                                </form>
                            </div>
                        </div>
                    </div>
                </div>
                <CompletedSubscription/>
                <FailedSubscription/>
            </div>
        )
    }
}

const init = state => ({
    init: state.init,
});

export default connect(init, null)(ServiceModal)
