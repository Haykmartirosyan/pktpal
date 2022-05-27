import React, {Component} from 'react'
import Tooltip from "rc-tooltip/es";
import {balance, getExchangeRate, pktNumber} from "../Helpers/StatisticsHelpers";
import {Load} from "../../components/Loadings/Load";
import styles from "../user/Bill/Payments.module.scss"
import AdminHeader from "../admin/Dashboard/Layouts/Header";
import Emitter from "../../services/emitter";
import PaymentConfirmation from "../Modals/PaymentConfirmation";
import TransactionFailed from "../Modals/TransactionFailed";
import * as Sentry from "@sentry/react";

class Details extends Component {
    constructor(props) {
        super(props);
        this.state = {
            paymentId: props.match.params.id,
            USDPrice: 0,
            payment: {},
            showLoading: true,
            skip: 0,
            logs: [],
            showMore: true,
            disabledButton: false
        };
    }

    componentDidMount() {
        let _this = this;

        Emitter.on('paymentStatusChanged', (data) => {
            if (data.enoughFunds) {
                this.state.payment.completed = !this.state.payment.completed
            }
            this.setState({
                payment: data
            })
        });

        Emitter.on('transactionFailed', (data) => {
            Emitter.emit('showTransactionFailedModal', {data});
        });

        getExchangeRate().then((data) => {
            _this.setState({
                USDPrice: data.price,
            });
        }).then(() => {
            _this.getDetails().then(response => {
                if (response.data) {
                    let payment = response.data;

                    let paymentData = async () => {
                        let pktService = payment.pkt_service;
                        let promises = await balance(pktService.wallet_address).then((data) => {
                            payment.pkt_service.balance = data.balance ? pktNumber(data.balance) : null;
                            payment.enoughFunds = parseFloat(payment.pkt_service.balance.replace(/,/g, '')) > parseFloat(payment.amount / this.state.USDPrice);
                            return [payment];
                        });
                        return Promise.all(promises)
                    };

                    paymentData().then(() => {
                        _this.setState({
                            loadMoreLoading: false,
                            disabledButton: false,
                            showLoading: false,
                            payment: payment,
                        })
                    }).then(() => {
                        _this.getPaymentLogs().then((response) => {
                            if (response.logs.length < 5) {
                                this.setState({
                                    showMore: false
                                })
                            }
                            _this.setState({
                                logs: response.logs
                            })
                        })
                    })
                } else {
                    _this.setState({
                        showLoading: false
                    })
                }
            }).catch((error) => {
                Sentry.captureException(error);
                return _this.props.history.push('/financial');
            })
        })
    }


    getDetails() {
        return new Promise((resolve, reject) => {
            axios.get(api_routes.financialManager.bill.getPaymentDetails(this.state.paymentId)).then(response => {
                return response.data;
            }).then(json => {
                resolve(json);
            }).catch(error => {
                Sentry.captureException(error);
                reject(error)
            });
        });
    }

    setPaymentStatus(payment) {
        Emitter.emit('paymentConfirmation', payment)
    }

    getPaymentLogs() {
        let data = {
            params: {
                billPaymentId: this.state.payment.id,
                skip: this.state.skip
            }
        };
        return new Promise((resolve, reject) => {
            axios.get(api_routes.financialManager.bill.getPaymentLogs(), data).then(response => {
                return response.data;
            }).then(json => {
                resolve(json);
            }).catch(error => {
                Sentry.captureException(error);
                reject(error)
            });
        });
    }

    loadMore() {
        this.setState({
            skip: this.state.skip += 5,
            disabledButton: true

        });
        this.getPaymentLogs().then((response) => {
            if (!response.logs.length || response.logs.length < 5) {
                this.setState({
                    showMore: false
                })
            }
            const result = [...this.state.logs, ...response.logs];
            this.setState({
                logs: result,
                disabledButton: false
            })
        })
    }


    render() {
        return (
            <div>
                <div className="content">
                    <AdminHeader/>
                    {!this.state.showLoading ? (
                        <div className={`p-3 radius-8 container`}>
                            <div className={`pt-2`}>
                                <div className="flex justify-content-start align-items-center">
                                    <h3>Payment details</h3>
                                    <p className={'ml-3 mt-2'}>
                                        {this.state.payment.pkt_service.online == 0 || this.state.payment.pkt_service.freeze == 1 ? (
                                            <Tooltip placement="top"
                                                     trigger={['hover']}
                                                     overlay={
                                                         <span>{'The Device is offline'}</span>}>
                                                <button className={'bg-white'}
                                                        onClick={() => !this.state.payment.completed && this.state.payment.pkt_service.online == 1 ? this.setPaymentStatus(this.state.payment) : null}>

                                                    {!this.state.payment.completed ? (
                                                        <svg width="22" height="22" viewBox="0 0 22 22" fill="none"
                                                             xmlns="http://www.w3.org/2000/svg">
                                                            <path
                                                                d="M9.24264 15.3137L5 11.071L6.41421 9.65683L9.24264 12.4853L14.8995 6.8284L16.3137 8.24262L9.24264 15.3137Z"
                                                                fill="black"/>
                                                            <path fillRule="evenodd" clipRule="evenodd"
                                                                  d="M0 4C0 1.79086 1.79086 0 4 0H18C20.2091 0 22 1.79086 22 4V18C22 20.2091 20.2091 22 18 22H4C1.79086 22 0 20.2091 0 18V4ZM4 2H18C19.1046 2 20 2.89543 20 4V18C20 19.1046 19.1046 20 18 20H4C2.89543 20 2 19.1046 2 18V4C2 2.89543 2.89543 2 4 2Z"
                                                                  fill="black"/>
                                                        </svg>
                                                    ) : (
                                                        <svg width="22" height="22" viewBox="0 0 22 22" fill="none"
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
                                            <button className={'bg-white'}
                                                    onClick={() => !this.state.payment.completed ? this.setPaymentStatus(this.state.payment) : null}>

                                                {!this.state.payment.completed ? (
                                                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none"
                                                         xmlns="http://www.w3.org/2000/svg">
                                                        <path
                                                            d="M9.24264 15.3137L5 11.071L6.41421 9.65683L9.24264 12.4853L14.8995 6.8284L16.3137 8.24262L9.24264 15.3137Z"
                                                            fill="black"/>
                                                        <path fillRule="evenodd" clipRule="evenodd"
                                                              d="M0 4C0 1.79086 1.79086 0 4 0H18C20.2091 0 22 1.79086 22 4V18C22 20.2091 20.2091 22 18 22H4C1.79086 22 0 20.2091 0 18V4ZM4 2H18C19.1046 2 20 2.89543 20 4V18C20 19.1046 19.1046 20 18 20H4C2.89543 20 2 19.1046 2 18V4C2 2.89543 2.89543 2 4 2Z"
                                                              fill="black"/>
                                                    </svg>
                                                ) : (
                                                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none"
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
                                    </p>

                                </div>
                                <div className={'row mt-4'}>
                                    <div className={'col-xs-12 col-md-6'}>
                                        <div className={'mt-2'}>
                                            <span className="font-14 text-secondary">Account holder’s name</span>
                                            <div className={`mt-3 p-3 radius-5 background-gray ${styles.detailDiv}`}>
                                                {this.state.payment.holder_name}
                                            </div>
                                        </div>

                                        <div className={'mt-3'}>
                                            <span
                                                className="font-14 text-secondary">Account number</span>
                                            <div
                                                className={`p-3 mt-2 radius-5 background-gray text-nowrap ${styles.detailDiv}`}>
                                                {this.state.payment.account_number}
                                            </div>
                                        </div>

                                        <div className={'mt-3'}>
                                            <span className="font-14 text-secondary">Service name</span>
                                            <div className={`mt-2 p-3 radius-5 background-gray ${styles.detailDiv}`}>
                                                {this.state.payment.bill_service ? this.state.payment.bill_service.title : this.state.payment.service_name}
                                            </div>
                                        </div>

                                        {this.state.payment.description ? (
                                            <div className={'mt-3'}>
                                                <span className="font-14 text-secondary ">Service description</span>
                                                <div
                                                    className={`mt-2 p-3 radius-5 background-gray text-break ${styles.detailDiv}`}>
                                                    {this.state.payment.description}
                                                </div>
                                            </div>
                                        ) : null}


                                        <div className={'mt-3'}>
                                            <span className="font-14 text-secondary">Amount paid</span>
                                            <div
                                                className={`mt-2 p-3 radius-5 background-gray flex justify-content-between align-items-center ${styles.detailDiv}`}>
                                            <span>
                                        {parseFloat(this.state.payment.amount / this.state.USDPrice).toFixed(2)} PKT = ${this.state.payment.amount}
                                            </span>
                                                <span>
                                        {this.state.payment.enoughFunds ? (
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

                                            </span>
                                            </div>
                                        </div>


                                        <div className={'mt-3'}>
                                            <span className="font-14 text-secondary">Payment due date</span>
                                            <div className={`mt-2 p-3 radius-5 background-gray ${styles.detailDiv}`}>
                                                {moment(this.state.payment.payment_date).format('MM/DD/YYYY')}
                                            </div>
                                        </div>


                                    </div>

                                    <div className={'col-xs-12 col-md-6'}>

                                        <div className={'mt-3'}>
                                            <span className="font-14 text-secondary">Account holder's email</span>
                                            <div className={`mt-2 p-3 radius-5 background-gray ${styles.detailDiv}`}>
                                                {this.state.payment.user.user_email}
                                            </div>
                                        </div>

                                        <div className={'mt-3'}>
                                            <span className="font-14 text-secondary ">Account holder's address</span>
                                            <div
                                                className={`mt-2 p-3 radius-5 background-gray text-break ${styles.detailDiv}`}>
                                                {this.state.payment.address} {this.state.payment.apartment} {this.state.payment.city} {this.state.payment.state} {this.state.payment.country} {this.state.payment.zip_code}
                                            </div>
                                        </div>

                                        <div className={'mt-3'}>
                                            <span className="font-14 text-secondary ">Wallet address</span>
                                            <div
                                                className={`mt-2 p-3 radius-5 background-gray text-break ${styles.detailDiv}`}>
                                                {this.state.payment.pkt_service.wallet_address}
                                            </div>
                                        </div>

                                        <div className={'mt-3'}>
                                            <span
                                                className="font-14 text-secondary">Account holder’s mobile number</span>
                                            <div className={`mt-2 p-3 radius-5 background-gray ${styles.detailDiv}`}>
                                                {this.state.payment.phone}
                                            </div>
                                        </div>

                                        <div className={'mt-3'}>
                                            <span className="font-14 text-secondary">Payment is scheduled</span>
                                            <div className={`mt-2 p-3 radius-5 background-gray ${styles.detailDiv}`}>
                                                {this.state.payment.recurring ? 'Yes' : 'No'}
                                            </div>
                                        </div>

                                        <div className={'mt-3'}>
                                            <span className="font-14 text-secondary">Payment is done by</span>
                                            <div className={`mt-2 p-3 radius-5 background-gray ${styles.detailDiv}`}>
                                                <a href={`https://pktpal.com/wp-admin/user-edit.php?user_id=${this.state.payment.user.ID}`}>
                                                    {this.state.payment.user.first_name ? this.state.payment.user.first_name + ' ' + this.state.payment.user.last_name : this.state.payment.user.display_name}
                                                </a>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                                <div className={`row mt-5 border radius-8 p-4`}>
                                    <p>Activity log</p>
                                    {this.state.logs.length ? (
                                        <div className={`col-12 table-responsive`}>
                                            <table
                                                className={`table table-borderless ${styles.devicesTable}`}>
                                                <thead>
                                                <tr>
                                                    <th scope="col" className={`font-weight-normal pl-5`}>Date</th>
                                                    <th scope="col" className={`font-weight-normal`}>Alert</th>
                                                    <th scope="col" className={`font-weight-normal`}>Type</th>
                                                    <th scope="col" className={`font-weight-normal`}>Source</th>
                                                    <th scope="col" className={`font-weight-normal`}>Description
                                                    </th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {this.state.logs.map((log, index) => {
                                                    return (
                                                        <tr key={index}
                                                            className={`background-gray`}>
                                                            <td className={`radius-left-bottom-8 radius-left-top-8 pl-5`}>
                                                                {moment(log.created_at).utc(false).format('DD/MM/YY')}
                                                            </td>
                                                            <td>

                                                                <div
                                                                    className="flex justify-content-start align-items-center">
                                                                    {!log.type ? (
                                                                        <div className={`flex align-items-center`}>
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
                                                                            <span className={'pl-2'}>Alert</span>
                                                                        </div>
                                                                    ) : ('-')}

                                                                </div>

                                                            </td>
                                                            <td>
                                                                Payment
                                                            </td>
                                                            <td>
                                                                {log.user ? (
                                                                    <span>{log.user.first_name ? log.user.first_name + ' ' + log.user.last_name : log.user.display_name}</span>
                                                                ) : (
                                                                    <span>Server</span>
                                                                )}
                                                            </td>
                                                            <td className={`radius-right-top-8 radius-right-bottom-8`}>
                                                                {log.text.length > 80 ? log.text.substring(0, 80).toString() + '...' : log.text}
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                                </tbody>
                                            </table>

                                            {this.state.showMore ? (
                                                <div className={`text-center mb-3`}>
                                                    <button
                                                        onClick={() => this.loadMore()}
                                                        className={`${this.state.disabledButton ? 'disabled' : null}  btn font-weight-bold  radius-0 background-black text-white `}
                                                        disabled={this.state.disabledButton}>
                                                        Load more
                                                        {this.state.disabledButton ? (
                                                            <div
                                                                className="spinner-border spinner-border-sm font-14 ml-2"
                                                                role="status">
                                                            </div>) : null}
                                                    </button>
                                                </div>
                                            ) : null
                                            }


                                        </div>


                                    ) : null}
                                </div>
                            </div>
                            <PaymentConfirmation/>
                            <TransactionFailed/>
                        </div>
                    ) : (
                        <div>
                            <Load/>
                        </div>
                    )}
                </div>
            </div>
        )
    }
}

export default Details
