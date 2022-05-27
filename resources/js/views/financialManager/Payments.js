import React, {Component} from 'react';
import {Link, withRouter} from "react-router-dom";
import styles from "../user/Bill/Payments.module.scss";
import Tooltip from "rc-tooltip/es";
import {Load} from "../../components/Loadings/Load";
import {balance, getExchangeRate, pktNumber} from "../Helpers/StatisticsHelpers";
import AdminHeader from "../admin/Dashboard/Layouts/Header";
import DatePicker from "react-datepicker";
import moment from "moment";
import Emitter from "../../services/emitter";
import PaymentConfirmation from "../Modals/PaymentConfirmation";
import TransactionFailed from "../Modals/TransactionFailed";
import * as Sentry from "@sentry/react";

class Payments extends Component {
    constructor(props) {
        super(props);
        this.state = {
            transactionsTab: 'upcoming',
            showLoading: true,
            skip: 0,
            billPayments: [],
            disabledNext: false,
            loadMoreLoading: false,
            disabledButton: false,
            USDPrice: 0,
            filterDate: '',
            datePickerIsOpen: false,
        }
    }

    componentDidMount() {
        let _this = this;
        _this.mountComponent();

        Emitter.on('paymentStatusChanged', (data) => {
            let index = this.state.billPayments.findIndex(element => element.id === data.id);
            if (data.enoughFunds) {
                this.state.billPayments[index].completed = !data.completed;
            }
            this.setState({
                billPayments: this.state.billPayments
            })
        })

        Emitter.on('transactionFailed', (data) => {
            Emitter.emit('showTransactionFailedModal', {data});
        });

        setInterval(function () {
            _this.setState({
                skip: 0
            }, () => {
                _this.mountComponent()
            })
        }, 60 * 1000);
    }

    mountComponent() {
        let _this = this;
        getExchangeRate().then((data) => {
            _this.setState({
                USDPrice: data.price,
            });
        }).then(() => {
            _this.getBillPayments(_this.state.transactionsTab).then(response => {
                _this.setState({
                    disabledNext: response.data.length < 10,
                })
                if (response.data.length) {
                    this.paymentsData(response).then(() => {
                        _this.setState({
                            showLoading: false,
                            loadMoreLoading: false,
                            disabledButton: false
                        })
                    })
                } else {
                    _this.setState({
                        showLoading: false,
                    })
                }
            })
        })
    }

    setPaymentData(payments, payment, balance) {
        let _this = this;
        payment.pkt_service.balance = balance;
        if (_this.state.skip > 0) {
            _this.state.billPayments.push(payment)
            _this.setState({
                billPayments: _this.state.billPayments,
            });
        } else {
            payments.push(payment);
            _this.setState({
                billPayments: payments,
            });
        }
        return payments;
    }

    getBillPayments(type) {
        return new Promise((resolve, reject) => {
            let data = {
                params: {
                    skip: this.state.skip,
                    type: type,
                }
            };
            if (this.state.filterDate) {
                data.params.date = moment(this.state.filterDate).format('YYYY-MM-DD')
            }
            axios.get(api_routes.financialManager.bill.getBillPayments(), data).then(response => {
                return response.data;
            }).then(json => {
                resolve(json);
            }).catch(error => {
                Sentry.captureException(error);
                reject(error)
            });
        });
    }

    switchTransactions(value) {
        if (value !== this.state.transactionsTab) {
            this.setState({
                transactionsTab: value,
                skip: 0,
                billPayments: [],
                showLoading: true,
                filterDate: "",
            }, () => {
                this.mountComponent()
            });
        }
    }

    nextPage() {
        this.setState({
            loadMoreLoading: true,
            disabledButton: true,
            skip: this.state.skip += 10,
        }, () => {
            this.mountComponent()
        });
    }

    setPaymentStatus(payment, pktPrice) {
        let data = {
            payment: payment,
            pktPrice: pktPrice
        }
        Emitter.emit('paymentConfirmation', data)
    }


    handleDateChange(date) {
        this.setState({
            filterDate: date,
            datePickerIsOpen: !this.state.datePickerIsOpen
        }, () => {
            this.getBillPayments(this.state.transactionsTab).then(response => {
                this.setState({
                    disabledNext: response.data.length < 10,
                })
                if (response.data.length) {
                    this.paymentsData(response).then(() => {
                        this.setState({
                            showLoading: false,
                            loadMoreLoading: false,
                            disabledButton: false
                        })
                    })
                } else {
                    this.setState({
                        billPayments: [],
                        showLoading: false,
                    })
                }
            })
        })
    }

    async paymentsData(response) {
        let payments = []
        let promises = response.data.map(async payment => {
            let pktService = payment.pkt_service;
            if (pktService.wallet_address) {
                await balance(pktService.wallet_address).then((data) => {
                    this.setPaymentData(payments, payment, data.balance ? pktNumber(data.balance) : null)
                });
                payment.enoughFunds = parseFloat(payment.pkt_service.balance.replace(/,/g, '')) > parseFloat(payment.amount / this.state.USDPrice)

            } else {
                this.setPaymentData(payments, payment, null)
            }
        });
        return Promise.all(promises)
    }

    handleClick() {
        this.setState({
            datePickerIsOpen: !this.state.datePickerIsOpen
        })
    }

    render() {
        return (
            <div>
                <AdminHeader/>
                {!this.state.showLoading ? (

                    <div className={`p-3 radius-8 container`}>
                        <div className={`pt-2`}>
                            <div className={`pb-3 pl-0 d-inline`}>
                                <button
                                    onClick={() => this.switchTransactions('previous')}
                                    className={`btn ml-0 col-sm-12 col-lg-2 col-md-3 text-black ml-0 weight-500 radius-0 ${this.state.transactionsTab == 'previous' ? 'background-dark-blue text-white' : `${styles.blueBorder}`}`}>
                                    Previous
                                </button>

                                <button
                                    onClick={() => this.switchTransactions('upcoming')}
                                    className={`btn radius-0 col-sm-12 col-lg-2 col-md-3 mr-0 weight-500 ${this.state.transactionsTab == 'upcoming' ? 'background-dark-blue text-white' : `${styles.blueBorder}`}`}>
                                    Upcoming
                                </button>
                            </div>
                            {this.state.billPayments.length || this.state.filterDate ? (
                                <div className={`float-right`}>
                                    <button className={`btn bg-white text-center`}
                                            onClick={() => this.handleClick()}>
                                        <span className={`d-inline-block`}>Filter by date</span>
                                        <span className={`d-inline-block ml-2 ${styles.filterIcon}`}>
                                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
                                             xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z"
                                            fill="#141414"/>
                                        <path fillRule="evenodd" clipRule="evenodd"
                                              d="M3 0C1.34315 0 0 1.34315 0 3V15C0 16.6569 1.34315 18 3 18H15C16.6569 18 18 16.6569 18 15V3C18 1.34315 16.6569 0 15 0H3ZM2 15V4H16V15C16 15.5523 15.5523 16 15 16H3C2.44772 16 2 15.5523 2 15Z"
                                              fill="#141414"/>
                                        </svg>
                                    </span>
                                    </button>
                                    {this.state.datePickerIsOpen ? (
                                        <DatePicker
                                            selected={this.state.filterDate}
                                            calendarClassName={`position-absolute ${styles.calendarBox}`}
                                            inline
                                            onChange={(date) => this.handleDateChange(date)}/>
                                    ) : null}

                                </div>
                            ) : null}

                        </div>
                        {this.state.billPayments.length ? (
                            <div>
                                <table
                                    className={`d-md-table table table-borderless table-responsive mt-2 ${styles.devicesTable}`}>
                                    <thead>
                                    <tr className={`flex`}>
                                        <th scope="col"
                                            className={`font-weight-normal text-nowrap text-secondary font-14 col-2`}>
                                            Full name
                                        </th>
                                        <th scope="col"
                                            className={`font-weight-normal text-nowrap text-secondary font-14 col-3`}>
                                            Service name
                                        </th>
                                        <th scope="col"
                                            className={`font-weight-normal text-nowrap text-secondary font-14 col-2 col-md-3`}>
                                            Amount paid
                                        </th>
                                        <th scope="col"
                                            className={`font-weight-normal text-nowrap text-secondary font-14 col-3 col-md-2`}>
                                            Payment due date
                                        </th>
                                        <th scope="col"
                                            className={`font-weight-normal text-nowrap text-secondary font-14 col-2`}>
                                            Payment status
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody>

                                    {this.state.billPayments.map((payment, index) => {
                                        return (
                                            <tr className={`background-gray radius-8 mb-3 flex`} key={index}>
                                                <td className={'align-middle radius-left-top-8 radius-left-bottom-8 col-2'}>
                                                    <Link
                                                        to={{pathname: "/financial/payment/details/" + payment.id}}
                                                        className={`text-black`}>
                                                        {payment.holder_name}
                                                    </Link>
                                                </td>
                                                <td className={'align-middle col-3'}>
                                                    <Link
                                                        to={{pathname: "/financial/payment/details/" + payment.id}}
                                                        className={`text-black`}>
                                                        {payment.bill_service ? payment.bill_service.title : payment.service_name}
                                                    </Link>
                                                </td>
                                                <td className={'align-middle col-2 col-md-3'}>
                                                    <Link
                                                        to={{pathname: "/financial/payment/details/" + payment.id}}
                                                        className={`text-black`}>
                                                        <div className="flex justify-content-start align-items-center">
                                                            {payment.enoughFunds ? (
                                                                <Tooltip placement="top"
                                                                         trigger={['hover']}
                                                                         overlay={
                                                                             <span>{'OK'}</span>}>
                                                                    <svg width="14" height="14" viewBox="0 0 14 14"
                                                                         fill="none"
                                                                         xmlns="http://www.w3.org/2000/svg">
                                                                        <path
                                                                            d="M5.46156 9.049L2.95455 6.54198L3.79022 5.70631L5.46156 7.37765L8.80425 4.03497L9.63992 4.87064L5.46156 9.049Z"
                                                                            fill="#4174DB"/>
                                                                        <path fillRule="evenodd" clipRule="evenodd"
                                                                              d="M0 6.5C0 2.91015 2.91015 0 6.5 0C10.0899 0 13 2.91015 13 6.5C13 10.0899 10.0899 13 6.5 13C2.91015 13 0 10.0899 0 6.5ZM6.5 11.8182C3.56285 11.8182 1.18182 9.43715 1.18182 6.5C1.18182 3.56285 3.56285 1.18182 6.5 1.18182C9.43715 1.18182 11.8182 3.56285 11.8182 6.5C11.8182 9.43715 9.43715 11.8182 6.5 11.8182Z"
                                                                              fill="#4174DB"/>
                                                                    </svg>
                                                                </Tooltip>
                                                            ) : (

                                                                <Tooltip placement="top"
                                                                         trigger={['hover']}
                                                                         overlay={
                                                                             <span>{'No enough funds'}</span>}>
                                                                    <svg width="14" height="14" viewBox="0 0 14 14"
                                                                         fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                        <path
                                                                            d="M9.53132 5.4381C9.767 5.21845 9.77998 4.84933 9.56033 4.61366C9.34067 4.37798 8.97155 4.36499 8.73588 4.58465L7.02897 6.17553L5.43809 4.46862C5.21843 4.23295 4.84932 4.21996 4.61364 4.43962C4.37797 4.65927 4.36498 5.02839 4.58463 5.26407L6.17552 6.97097L4.46861 8.56186C4.23293 8.78151 4.21995 9.15063 4.4396 9.3863C4.65926 9.62198 5.02838 9.63497 5.26405 9.41531L6.97096 7.82443L8.56184 9.53134C8.7815 9.76701 9.15061 9.78 9.38629 9.56034C9.62196 9.34069 9.63495 8.97157 9.4153 8.73589L7.82441 7.02899L9.53132 5.4381Z"
                                                                            fill="#EE152F"/>
                                                                        <path fillRule="evenodd" clipRule="evenodd"
                                                                              d="M0.583328 7.00001C0.583328 3.45618 3.45617 0.583344 6.99999 0.583344C10.5438 0.583344 13.4167 3.45618 13.4167 7.00001C13.4167 10.5438 10.5438 13.4167 6.99999 13.4167C3.45617 13.4167 0.583328 10.5438 0.583328 7.00001ZM6.99999 12.25C4.1005 12.25 1.74999 9.8995 1.74999 7.00001C1.74999 4.10052 4.1005 1.75001 6.99999 1.75001C9.89949 1.75001 12.25 4.10052 12.25 7.00001C12.25 9.8995 9.89949 12.25 6.99999 12.25Z"
                                                                              fill="#EE152F"/>
                                                                    </svg>

                                                                </Tooltip>
                                                            )}
                                                            <span className={'ml-3'}>
                                                            {parseFloat(payment.amount / this.state.USDPrice).toFixed(2)} PKT = ${payment.amount}
                                                        </span>
                                                        </div>
                                                    </Link>

                                                </td>

                                                <td className={'align-middle col-3 col-md-2'}>
                                                    <Link
                                                        to={{pathname: "/financial/payment/details/" + payment.id}}
                                                        className={`text-black`}>
                                                        {moment(payment.payment_date).format('MM/DD/YYYY')}
                                                    </Link>
                                                </td>
                                                <td className="align-middle radius-right-top-8 radius-right-bottom-8 col-2">
                                                    {payment.pkt_service.online == 0 ? (
                                                        <Tooltip placement="top"
                                                                 trigger={['hover']}
                                                                 overlay={
                                                                     <span>{'The Device is offline'}</span>}>
                                                            <button
                                                                onClick={() => !payment.completed && payment.pkt_service.online == 1 && payment.pkt_service.freeze == 0 ? this.setPaymentStatus(payment) : null}>
                                                                {!payment.completed ? (
                                                                    <svg width="22" height="22" viewBox="0 0 22 22"
                                                                         fill="none"
                                                                         xmlns="http://www.w3.org/2000/svg">
                                                                        <path
                                                                            d="M9.24264 15.3137L5 11.071L6.41421 9.65683L9.24264 12.4853L14.8995 6.8284L16.3137 8.24262L9.24264 15.3137Z"
                                                                            fill="black"/>
                                                                        <path fillRule="evenodd" clipRule="evenodd"
                                                                              d="M0 4C0 1.79086 1.79086 0 4 0H18C20.2091 0 22 1.79086 22 4V18C22 20.2091 20.2091 22 18 22H4C1.79086 22 0 20.2091 0 18V4ZM4 2H18C19.1046 2 20 2.89543 20 4V18C20 19.1046 19.1046 20 18 20H4C2.89543 20 2 19.1046 2 18V4C2 2.89543 2.89543 2 4 2Z"
                                                                              fill="black"/>
                                                                    </svg>
                                                                ) : (
                                                                    <svg width="22" height="22" viewBox="0 0 22 22"
                                                                         fill="none"
                                                                         xmlns="http://www.w3.org/2000/svg">
                                                                        <path
                                                                            d="M9.24264 15.3137L5 11.071L6.41421 9.65683L9.24264 12.4853L14.8995 6.8284L16.3137 8.24262L9.24264 15.3137Z"
                                                                            fill="#026900"/>
                                                                        <path fillRule="evenodd" clipRule="evenodd"
                                                                              d="M0 4C0 1.79086 1.79086 0 4 0H18C20.2091 0 22 1.79086 22 4V18C22 20.2091 20.2091 22 18 22H4C1.79086 22 0 20.2091 0 18V4ZM4 2H18C19.1046 2 20 2.89543 20 4V18C20 19.1046 19.1046 20 18 20H4C2.89543 20 2 19.1046 2 18V4C2 2.89543 2.89543 2 4 2Z"
                                                                              fill="#026900"/>
                                                                    </svg>
                                                                )}

                                                            </button>
                                                        </Tooltip>
                                                    ) : (
                                                        <button
                                                            onClick={() => !payment.completed ? this.setPaymentStatus(payment, (parseFloat(payment.amount / this.state.USDPrice).toFixed(2))) : null}>
                                                            {!payment.completed ? (
                                                                <svg width="22" height="22" viewBox="0 0 22 22"
                                                                     fill="none"
                                                                     xmlns="http://www.w3.org/2000/svg">
                                                                    <path
                                                                        d="M9.24264 15.3137L5 11.071L6.41421 9.65683L9.24264 12.4853L14.8995 6.8284L16.3137 8.24262L9.24264 15.3137Z"
                                                                        fill="black"/>
                                                                    <path fillRule="evenodd" clipRule="evenodd"
                                                                          d="M0 4C0 1.79086 1.79086 0 4 0H18C20.2091 0 22 1.79086 22 4V18C22 20.2091 20.2091 22 18 22H4C1.79086 22 0 20.2091 0 18V4ZM4 2H18C19.1046 2 20 2.89543 20 4V18C20 19.1046 19.1046 20 18 20H4C2.89543 20 2 19.1046 2 18V4C2 2.89543 2.89543 2 4 2Z"
                                                                          fill="black"/>
                                                                </svg>
                                                            ) : (
                                                                <svg width="22" height="22" viewBox="0 0 22 22"
                                                                     fill="none"
                                                                     xmlns="http://www.w3.org/2000/svg">
                                                                    <path
                                                                        d="M9.24264 15.3137L5 11.071L6.41421 9.65683L9.24264 12.4853L14.8995 6.8284L16.3137 8.24262L9.24264 15.3137Z"
                                                                        fill="#026900"/>
                                                                    <path fillRule="evenodd" clipRule="evenodd"
                                                                          d="M0 4C0 1.79086 1.79086 0 4 0H18C20.2091 0 22 1.79086 22 4V18C22 20.2091 20.2091 22 18 22H4C1.79086 22 0 20.2091 0 18V4ZM4 2H18C19.1046 2 20 2.89543 20 4V18C20 19.1046 19.1046 20 18 20H4C2.89543 20 2 19.1046 2 18V4C2 2.89543 2.89543 2 4 2Z"
                                                                          fill="#026900"/>
                                                                </svg>
                                                            )}

                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    </tbody>
                                </table>
                                {!this.state.disabledNext ? (
                                    <div className={`text-center`}>
                                        <button
                                            onClick={() => this.nextPage()}
                                            className={`${this.state.disabledButton ? 'disabled' : null} btn font-weight-bold  radius-0 background-black text-white`}
                                            disabled={this.state.disabledButton}>
                                            Load more
                                            {this.state.loadMoreLoading ? (
                                                <div className="spinner-border spinner-border-sm font-14 ml-2"
                                                     role="status">
                                                </div>) : null}
                                        </button>
                                    </div>
                                ) : null}

                            </div>
                        ) : (
                            <div className={`mt-5 col-12`}>
                                <div className="text-center pt-2">
                                    <h4 className="">You don't have any payments</h4>
                                </div>
                            </div>
                        )
                        }
                        <PaymentConfirmation/>
                        <TransactionFailed/>
                    </div>
                ) : (
                    <div>
                        <Load/>
                    </div>
                )}
            </div>
        )
    }
}

export default withRouter(Payments)
