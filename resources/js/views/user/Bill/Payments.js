import React, {Component} from 'react';
import {Link, withRouter} from "react-router-dom";
import Header from "../../../components/Header/Header";
import {motion} from "framer-motion";
import styles from "./Payments.module.scss";
import Tooltip from "rc-tooltip";
import {Load} from "../../../components/Loadings/Load";
import {copyAddress} from "../../Helpers/GlobalHelpers";
import {Line} from 'react-chartjs-2';
import Footer from "../../../components/Footer/Footer";
import {
    balance,
    getExchangeRate,
    getUserPktService,
    groupByMonthAndYear,
    mining, pktNumber,
} from "../../Helpers/StatisticsHelpers";
import moment from "moment";
import * as Sentry from "@sentry/react";

class Payments extends Component {
    constructor(props) {
        super(props);
        this.state = {
            serviceId: props.match.params.id,
            showLoading: true,
            pktServices: [],
            showDropDownContent: false,
            LineData: {
                labels: [],
                datasets: [
                    {
                        label: '',
                        data: [],
                        fill: true,
                        backgroundColor: "rgba(18, 150, 235, 0.18)",
                        borderColor: "#1296EB",
                        tension: 0.4,
                    },

                ],
            },
            walletAddress: '',
            macAddress: '',
            showLineChart: true,
            USDPrice: 0,
            balance: 0,
            realBalance: 0,
            mined24: 0,
            transactions: [],
            notifications: [],
            skipNotifications: 0,
            skipHistory: 0,
            disabledButton: false,
            showMoreNotifications: true,
            showMoreTransactions: true,
            showMobileSettings: window.innerWidth <= 768,
        }
    }

    componentDidMount() {
        this.mountComponent(this.state.serviceId);
    }

    generateLineChartData(json) {
        let groupedMonthsAndYears = groupByMonthAndYear(json.results);
        let firstMonth = 1;
        firstMonth = moment().subtract(1, 'years').format('YYYY-MM');
        Object.keys(groupedMonthsAndYears).reverse().map((month) => {
            let formattedMonth = moment(month, 'YYYY-MM').format('MMMM');
            this.state.LineData.labels.push(formattedMonth);
        });
        let data = [];

        Object.keys(groupedMonthsAndYears).reverse().map((month) => {
            if (month >= firstMonth) {
                data.push(groupedMonthsAndYears[month]);
            }
        });

        data.forEach(item => {
            let res = 0;
            item.forEach(i => {
                res += parseInt(i.received)
            });
            this.state.LineData.datasets[0].data.push(res / 2 ** 30);
        });
    }

    getUserPktServices() {
        return new Promise((resolve, reject) => {
            axios.get(api_routes.user.pktServices()).then(response => {
                return response;
            }).then(json => {
                this.setState({
                    pktServices: json.data.pkt_services,
                    showDropDownContent: true,
                });
                resolve(json);
            }).catch(error => {
                Sentry.captureException(error);
                reject(error)
            });
        });
    }

    mountComponent(id) {
        let _this = this;

        _this.getUserPktServices().then(() => {
            _this.setState({
                serviceId: id,
            });
            getUserPktService(id).then((data) => {
                _this.setState({
                    walletAddress: data.data ? data.data.wallet_address : '',
                    macAddress: data.data ? data.data.mac_address : '',
                });
                if (_this.state.walletAddress && _this.state.macAddress) {
                    getExchangeRate().then((data) => {
                        _this.setState({
                            USDPrice: data.price,
                        });
                    }).then(() => {
                        _this.minePeriod().then(() => {
                            balance(_this.state.walletAddress).then((data) => {
                                _this.setState({
                                    realBalance: (data.balance),
                                    balance: pktNumber(data.balance),
                                    mined24: pktNumber(data.mined24),
                                });
                            }).then(() => {
                                _this.setState({
                                    showLoading: false
                                });
                            });
                        });

                        _this.getTransactionsHistory().then((response) => {
                            if (response.data.transactions.length) {
                                _this.setState({
                                    transactions: response.data.transactions
                                })
                            }
                        });

                        _this.getTransactionsNotifications().then((response) => {
                            if (response.data.notifications.length) {
                                _this.setState({
                                    notifications: response.data.notifications
                                })
                            }
                        });
                    }).catch((error) => {
                        Sentry.captureException(error);
                        _this.setState({
                            showLoading: false
                        });
                    });
                } else {
                    _this.minePeriod().then(() => {
                        _this.setState({
                            showLoading: false
                        });
                    });
                }
            }).catch(e => {
                Sentry.captureException(e);
                return this.props.history.push('/404');
            })
        });

    }

    minePeriod() {
        return new Promise((resolve) => {
            let start = moment().subtract(1, 'years').format('YYYY-MM-DD');
            let end = moment().endOf('month').format('YYYY-MM-DD');
            let period = start + '/' + end;
            mining(this.state.walletAddress, period).then((data) => {
                this.generateLineChartData(data);
                resolve()
            })
        })

    }

    getTransactionsHistory() {
        let data = {
            params: {
                skip: this.state.skipHistory
            }
        }
        return new Promise((resolve, reject) => {
            axios.get(api_routes.user.bill.transactionsHistory(this.state.serviceId), data).then(response => {
                return response;
            }).then(json => {
                resolve(json);
            }).catch(error => {
                Sentry.captureException(error);
                reject(error)
            });
        });
    }

    getTransactionsNotifications() {
        let data = {
            params: {
                skip: this.state.skipNotifications
            }
        }
        return new Promise((resolve, reject) => {
            axios.get(api_routes.user.bill.transactionsNotifications(this.state.serviceId), data).then(response => {
                return response;
            }).then(json => {
                resolve(json);
            }).catch(error => {
                Sentry.captureException(error);
                reject(error)
            });
        });
    }

    loadMore(type) {
        if (type == 'notifications') {
            this.setState({
                skipNotifications: this.state.skipNotifications += 5,
                disabledButton: true
            })
            this.getTransactionsNotifications().then(response => {
                if (!response.data.notifications.length || response.data.notifications.length < 5) {
                    this.setState({
                        showMoreNotifications: false
                    })
                }
                const result = [...this.state.notifications, ...response.data.notifications];

                this.setState({
                    notifications: result,
                    disabledButton: false,
                })

            })
        }

        if (type == 'history') {
            this.setState({
                skipHistory: this.state.skipHistory += 5,
                disabledButton: true,
            })
            this.getTransactionsHistory().then(response => {
                if (!response.data.transactions.length || response.data.transactions.length < 5) {
                    this.setState({
                        showMoreTransactions: false
                    })
                }

                const result = [...this.state.transactions, ...response.data.transactions];

                this.setState({
                    transactions: result,
                    disabledButton: false,
                })

            })
        }
    }

    changeWallet(e) {
        let service = this.state.pktServices.find(elem => {
            return elem.wallet_address === e.target.value
        })
        return location.href = '/payments/' + service.id
    }

    render() {
        return (
            <div className="content">
                <Header/>
                {!this.state.showLoading ? (

                    <div className="container mt-4">
                        <div className="row">
                            <div className="col-12 col-md-12 col-lg-5 mt-2">

                                <motion.div initial={{scale: 0}}
                                            animate={{scale: 1}}
                                            transition={{duration: 0.2}}
                                            className={`background-dark-blue  ${styles.paddingBox} radius-8 text-white h-100`}>

                                    <div className="flex">
                                        <p className={`m-0`}>Total balance</p>
                                        <Tooltip placement="top" trigger={['hover']}
                                                 overlay={<span>This is the total balance of your PKT Cube</span>}>
                                             <span className={`ml-1`}>
                                                 <i className="far fa-question-circle"/>
                                             </span>
                                        </Tooltip>
                                    </div>

                                    <div className="flex">
                                        <h5>{this.state.balance} PKT</h5>
                                        <p className="ml-3">{this.state.realBalance ? pktNumber(parseFloat(this.state.realBalance) * parseFloat(this.state.USDPrice)) : 0} USD</p>
                                    </div>
                                    <div className={`container p-0`}>
                                        <p className='font-14 mb-0'>My deposit address</p>
                                        <div
                                            className={`d-flex flex-nowrap justify-content-between`}>
                                            <div
                                                className={`${styles.chevronDown} mw-100 ${this.state.showMobileSettings ? 'mr-1 pr-1' : ''}`}>
                                                <Tooltip placement="top" trigger={['hover']}
                                                         overlay={<span>{this.state.walletAddress}</span>}>
                                                    <select
                                                        className={`text-white text-truncate ${styles.textMedia} mr-1 p-3 radius-5 ${styles.mewFormControl} w-100`}
                                                        onChange={(e) => {
                                                            this.changeWallet(e)
                                                        }}
                                                        defaultValue={this.state.walletAddress}>
                                                        {this.state.pktServices.map((pktService) => {
                                                            return (
                                                                <option key={pktService.id} className={`text-black`}
                                                                        value={pktService.wallet_address}>
                                                                    {pktService.wallet_address ? pktService.wallet_address : '-'}
                                                                </option>
                                                            )
                                                        })
                                                        }
                                                    </select>
                                                </Tooltip>
                                            </div>

                                            <Tooltip placement="top" trigger={['click']}
                                                     overlay={<span>Copied!</span>}>
                                                <button
                                                    onClick={() => copyAddress(this.state.walletAddress)}
                                                    className={`btn  ${styles.bgTransparent}`}>
                                                    <svg width="18" height="23" viewBox="0 0 18 23" fill="none"
                                                         xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M10 6.5H4V4.5H10V6.5Z" fill="white"/>
                                                        <path d="M10 10.5H4V8.5H10V10.5Z" fill="white"/>
                                                        <path d="M4 14.5H10V12.5H4V14.5Z" fill="white"/>
                                                        <path fillRule="evenodd" clipRule="evenodd"
                                                              d="M0 18.5V0.5H14V4.5H18V22.5H4V18.5H0ZM12 16.5V2.5H2V16.5H12ZM14 6.5V18.5H6V20.5H16V6.5H14Z"
                                                              fill="white"/>
                                                    </svg>
                                                </button>
                                            </Tooltip>

                                        </div>

                                    </div>
                                    <div className='container mt-3'>
                                        <div className='row'>
                                            <Link
                                                to={{pathname: "/payments/services/" + this.state.serviceId}}
                                                className={`font-weight-bold color-dark-blue text-decoration-none bg-white col-12 flex justify-content-center align-items-center p-2 radius-5`}>Pay
                                                Bill</Link>
                                        </div>
                                    </div>

                                </motion.div>
                            </div>
                            <div className="col-12 col-md-12 col-lg-7 mt-2">
                                <motion.div initial={{scale: 0}}
                                            animate={{scale: 1}}
                                            transition={{duration: 0.2, delay: 0.2}}
                                            className={`background-gray ${styles.paddingBox} radius-8 h-100`}>
                                    <div className={`container`}>
                                        <div
                                            className={`flex justify-content-between ${this.state.showMobileSettings ? 'align-items-center' : ''}`}>
                                            <h6 className={`font-weight-bold ${this.state.showMobileSettings ? 'mt-1' : ''}`}>Mining
                                                details</h6>
                                            <Link
                                                to={{pathname: "/pkt/details/" + this.state.serviceId}}
                                                className='text-black font-weight-bold color-dark-blue text-decoration-none btn bg-light'>View
                                                more
                                            </Link>
                                        </div>

                                        <div className={`row mt-3`}>
                                            <div className={'col-md-4 col-12'}>
                                                <div>
                                                    <h6>Mining Balance</h6>
                                                    <h4 className={`font-weight-bold text-nowrap`}>{this.state.balance} PKT</h4>
                                                </div>
                                                <div>
                                                    <h6>Mined last 24h</h6>
                                                    <h4 className={`font-weight-bold text-nowrap`}>{this.state.mined24} PKT</h4>
                                                </div>
                                            </div>
                                            <div className={'col-md-8 col-12'}>

                                                {this.state.showLineChart ? (
                                                    <Line type="area" height={23}
                                                          width={80}
                                                          data={this.state.LineData}
                                                          options={
                                                              {
                                                                  scales: {
                                                                      yAxis: {
                                                                          display: false,
                                                                      },
                                                                      xAxis: {
                                                                          display: false,
                                                                      }
                                                                  },
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
                                    </div>

                                </motion.div>
                            </div>

                        </div>
                        <div className='row'>
                            <div className="col-12 col-md-12 col-lg-5 mt-4">
                                <motion.div initial={{scale: 0}}
                                            animate={{scale: 1}}
                                            transition={{duration: 0.2, delay: 0.4}}
                                            className={`bg-white border ${!this.state.notifications.length ? 'h-100' : ''} ${styles.paddingBox} radius-8`}>
                                    <h6 className='font-weight-bold'>Notifications</h6>
                                    {this.state.notifications.length ? (
                                        <div className={'table-responsive'}>
                                            <div id="accordion">

                                                {this.state.notifications.map((notification, index) => {
                                                    return (
                                                        <div key={index}>
                                                            <div
                                                                className={`p-3 ${styles.changeBackground} radius-8 ${styles.notificationBlock}`}
                                                                id={`heading${index}`}>

                                                                <div
                                                                    className={'flex align-items-center justify-content-between'}>
                                                                    <div className={'w-50 flex align-items-center'}>

                                                                        {notification.type === 'payment_succeeded' &&
                                                                        <button
                                                                            data-toggle="collapse"
                                                                            data-target={`#collapse${index}`}
                                                                            aria-expanded="true"
                                                                            aria-controls={`collapse${index}`}
                                                                            className={`btn bg-transparent p-0`}>
                                                                            <svg width="22" height="22"
                                                                                 viewBox="0 0 14 14"
                                                                                 fill="none"
                                                                                 xmlns="http://www.w3.org/2000/svg">
                                                                                <path
                                                                                    d="M5.46156 9.049L2.95455 6.54198L3.79022 5.70631L5.46156 7.37765L8.80425 4.03497L9.63992 4.87064L5.46156 9.049Z"
                                                                                    fill="#4174DB"/>
                                                                                <path fillRule="evenodd"
                                                                                      clipRule="evenodd"
                                                                                      d="M0 6.5C0 2.91015 2.91015 0 6.5 0C10.0899 0 13 2.91015 13 6.5C13 10.0899 10.0899 13 6.5 13C2.91015 13 0 10.0899 0 6.5ZM6.5 11.8182C3.56285 11.8182 1.18182 9.43715 1.18182 6.5C1.18182 3.56285 3.56285 1.18182 6.5 1.18182C9.43715 1.18182 11.8182 3.56285 11.8182 6.5C11.8182 9.43715 9.43715 11.8182 6.5 11.8182Z"
                                                                                      fill="#4174DB"/>
                                                                            </svg>
                                                                        </button>
                                                                        }

                                                                        {notification.type === 'payment_failed' &&
                                                                        <button
                                                                            data-toggle="collapse"
                                                                            data-target={`#collapse${index}`}
                                                                            aria-expanded="true"
                                                                            aria-controls={`collapse${index}`}
                                                                            className={`btn bg-transparent p-0`}>
                                                                            <svg width="22" height="22"
                                                                                 viewBox="0 0 14 14"
                                                                                 fill="none"
                                                                                 xmlns="http://www.w3.org/2000/svg">
                                                                                <path
                                                                                    d="M9.53132 5.4381C9.767 5.21845 9.77998 4.84933 9.56033 4.61366C9.34067 4.37798 8.97155 4.36499 8.73588 4.58465L7.02897 6.17553L5.43809 4.46862C5.21843 4.23295 4.84932 4.21996 4.61364 4.43962C4.37797 4.65927 4.36498 5.02839 4.58463 5.26407L6.17552 6.97097L4.46861 8.56186C4.23293 8.78151 4.21995 9.15063 4.4396 9.3863C4.65926 9.62198 5.02838 9.63497 5.26405 9.41531L6.97096 7.82443L8.56184 9.53134C8.7815 9.76701 9.15061 9.78 9.38629 9.56034C9.62196 9.34069 9.63495 8.97157 9.4153 8.73589L7.82441 7.02899L9.53132 5.4381Z"
                                                                                    fill="#EE152F"/>
                                                                                <path fillRule="evenodd"
                                                                                      clipRule="evenodd"
                                                                                      d="M0.583328 7.00001C0.583328 3.45618 3.45617 0.583344 6.99999 0.583344C10.5438 0.583344 13.4167 3.45618 13.4167 7.00001C13.4167 10.5438 10.5438 13.4167 6.99999 13.4167C3.45617 13.4167 0.583328 10.5438 0.583328 7.00001ZM6.99999 12.25C4.1005 12.25 1.74999 9.8995 1.74999 7.00001C1.74999 4.10052 4.1005 1.75001 6.99999 1.75001C9.89949 1.75001 12.25 4.10052 12.25 7.00001C12.25 9.8995 9.89949 12.25 6.99999 12.25Z"
                                                                                      fill="#EE152F"/>
                                                                            </svg>
                                                                        </button>
                                                                        }

                                                                        <span className={`ml-2 font-16`}>
                                                                            {notification.bill_service ? notification.bill_service.title : notification.service_name}
                                                                        </span>
                                                                    </div>

                                                                    <span>
                                                                        {moment(notification.payment_date).format('MMMM D')}
                                                                    </span>
                                                                    <span className={'font-weight-bold'}>
                                                                          {notification.type && notification.type == 'payment_succeeded' ? "-" : ''} {(notification.amount / this.state.USDPrice).toFixed(2)} PKT
                                                                    </span>
                                                                </div>

                                                                {notification.type &&
                                                                <div id={`collapse${index}`}
                                                                     className={`collapse`}
                                                                     aria-labelledby={`heading${index}`}
                                                                     data-parent="#accordion">
                                                                    <div className="card-body px-0">

                                                                        {notification.type === 'payment_succeeded' &&
                                                                        <p>
                                                                            Your payment
                                                                            for {notification.bill_service ? notification.bill_service.title : notification.service_name} has
                                                                            been successfully done. You have been charged
                                                                            ${notification.amount}
                                                                        </p>
                                                                        }

                                                                        {notification.type === 'payment_failed' &&
                                                                        <p>
                                                                            Your payment
                                                                            for {notification.bill_service ? notification.bill_service.title : notification.service_name} failed.
                                                                            You have not enough funds on your balance to
                                                                            proceed with a payment
                                                                        </p>
                                                                        }
                                                                    </div>
                                                                </div>
                                                                }
                                                            </div>


                                                        </div>
                                                    )
                                                })}

                                            </div>
                                        </div>
                                    ) : (
                                        <div className={'mt-5'}>
                                            <div className="text-center pt-2">
                                                <h5>You don't have any notifications</h5>
                                            </div>
                                        </div>
                                    )}

                                    {this.state.showMoreNotifications ? (
                                        <div className='mt-5 mb-0'>
                                            <button onClick={() => {
                                                this.loadMore('notifications')
                                            }}
                                                    disabled={this.state.disabledButton}
                                                    className={`text-black font-weight-bold bg-transparent 
                                               ${this.state.disabledButton ? 'disabled' : ''}`}>
                                                <u>View more</u>
                                            </button>
                                        </div>
                                    ) : null}

                                </motion.div>
                            </div>
                            <div className="col-12 col-md-12 col-lg-7 mt-4">
                                <motion.div initial={{scale: 0}}
                                            animate={{scale: 1}}
                                            transition={{duration: 0.2, delay: 0.6}}
                                            className={`bg-white border ${!this.state.transactions.length ? 'h-100' : ''} ${styles.paddingBox} radius-8`}>
                                    <h6 className={`font-weight-bold`}>Transactions history</h6>
                                    {this.state.transactions.length ? (
                                        <div className={'table-responsive'}>
                                            <table className="table table-borderless">
                                                <tbody>

                                                {this.state.transactions.map((transaction, index) => {
                                                    return (
                                                        <tr key={index} className={`${styles.changeBackground}`}>
                                                            <td className={`radius-left-bottom-8 radius-left-top-8 align-top`}>
                                                                <div className={`d-flex align-items-center`}>
                                                                    <span
                                                                        className={`font-weight-bold`}>{transaction.bill_service ? transaction.bill_service.title : transaction.service_name}</span>
                                                                </div>
                                                            </td>
                                                            <td className='align-top text-center'>
                                                                {moment(transaction.created_at).format('HH:mm MMMM D')}
                                                            </td>
                                                            <td className='font-weight-bold align-top text-right radius-right-bottom-8 radius-right-top-8'>
                                                                -{(transaction.amount / this.state.USDPrice).toFixed(2)} PKT
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className={'mt-5'}>
                                            <div className="text-center pt-2">
                                                <h5>You don't have any transactions</h5>
                                            </div>
                                        </div>
                                    )}

                                    {
                                        this.state.showMoreTransactions ? (
                                            <div className='mt-5 mb-0'>
                                                <button onClick={() => this.loadMore('history')}
                                                        disabled={this.state.disabledButton}
                                                        className={`text-black font-weight-bold bg-transparent                                             
                                                   ${this.state.disabledButton ? 'disabled' : ''}`}>
                                                    <u>View more</u>
                                                </button>
                                            </div>
                                        ) : null
                                    }
                                </motion.div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>
                        <Load/>
                    </div>
                )}
                <Footer/>
            </div>
        )
    }

}

export default withRouter(Payments)
