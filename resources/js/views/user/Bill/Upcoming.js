import React, {Component} from 'react';
import {Link, withRouter} from "react-router-dom";
import Header from "../../../components/Header/Header";
import {motion} from "framer-motion";
import Footer from "../../../components/Footer/Footer";
import {Load} from "../../../components/Loadings/Load";
import ProgressBar from "@ramonak/react-progress-bar";
import styles from "./Payments.module.scss";
import {getExchangeRate} from "../../Helpers/StatisticsHelpers";
import moment from "moment";
import {getUserFavoriteServices, toggleFavorite} from "../../Helpers/PaymentsHelpers";
import Emitter from "../../../services/emitter";
import Switch from "react-switch";
import Tooltip from "rc-tooltip";
import CustomServiceImg from "../../../../../public/images/PKT_Pal.svg"
import ServiceModal from "../../Modals/ServiceModal";
import cookie from "react-cookies";
import * as Sentry from "@sentry/react";

class Upcoming extends Component {
    constructor(props) {
        super(props);
        this.state = {
            serviceId: '',
            showLoading: true,
            services: [],
            filteredServices: [],
            searchQuery: '',
            upcoming: [],
            recent: [],
            favorites: [],
            skipUpcoming: 0,
            skipRecent: 0,
            skipFavorite: 0,
            showMoreUpcoming: true,
            showMoreRecent: true,
            showMoreFavorite: true,
            disabledUpcoming: false,
            disabledRecent: false,
            disabledFavorite: false,
            USDPrice: 0,
            removingPaymentId: '',
            deletingPaymentId: '',
            showRemoveLoading: false,
            showMobileSettings: window.innerWidth <= 768,
            onlineService: null,
        }
    }

    componentDidMount() {
        let _this = this
        _this.mountComponent();
        Emitter.on('firstServiceId', (id) => {
            this.setState({
                serviceId: id
            })
        })

        Emitter.on('updatedPayment', () => {
            _this.mountComponent();
        })

        push.subscribe('result-remove-direct-debit').bind('App\\Events\\RemoveDirectDebit', function (data) {
            console.log('removeDirectDebit-response', data)
            if (data.status === 'success') {
                _this.discardPayment(_this.state.removingPaymentId).then(response => {
                    return response;
                }).then(json => {
                    if (json.success) {
                        let item = _this.state.upcoming.findIndex(item => item.id === _this.state.removingPaymentId);
                        _this.state.upcoming.splice(item, 1);
                        _this.setState({
                            upcoming: _this.state.upcoming,
                            showRemoveLoading: false
                        })
                    }
                })
            } else {
                _this.setState({
                    showRemoveLoading: false
                })
            }
        })

    }

    mountComponent() {
        getExchangeRate().then((data) => {
            this.setState({
                USDPrice: data.price,
            });
        });
        this.getUserUpcomingPayments().then((data) => {
            this.setState({
                upcoming: data.upcoming,
                showLoading: false,
                showMoreUpcoming: data.upcoming.length >= 6
            })
        });
        this.getUserRecentPayments().then((data) => {
            this.setState({
                recent: data.recent,
                showLoading: false,
                showMoreRecent: data.recent.length >= 6
            })

        });
        getUserFavoriteServices(this.state.skipFavorite).then((data) => {
            this.setState({
                favorites: data.favorites,
                showLoading: false,
                showMoreFavorite: data.favorites.length >= 6,
                onlineService: data.onlineService
            })

        })
    }

    getUserUpcomingPayments() {
        let data = {
            params: {
                skipUpcoming: this.state.skipUpcoming
            }
        };
        return new Promise((resolve, reject) => {
            axios.get(api_routes.user.bill.upcomingPayments(), data).then(response => {
                return response.data;
            }).then(json => {
                resolve(json);
            }).catch(error => {
                Sentry.captureException(error);
                reject(error)
            });
        });
    }

    getUserRecentPayments() {
        let data = {
            params: {
                skipRecent: this.state.skipRecent,
            }
        };
        return new Promise((resolve, reject) => {
            axios.get(api_routes.user.bill.recentPayments(), data).then(response => {
                return response.data;
            }).then(json => {
                resolve(json);
            }).catch(error => {
                Sentry.captureException(error);
                reject(error)
            });
        });
    }

    loadMore(type) {
        if (type === 'upcoming') {
            this.setState({
                skipUpcoming: this.state.skipUpcoming += 6,
                disabledUpcoming: true
            });
            this.getUserUpcomingPayments().then((data) => {
                if (data.upcoming.length < 6) {
                    this.setState({
                        showMoreUpcoming: false
                    })
                }
                const result = [...this.state.upcoming, ...data.upcoming];
                this.setState({
                    upcoming: result,
                    showLoading: false,
                    disabledUpcoming: false,
                })
            })
        }
        if (type == 'favorite') {
            this.setState({
                skipFavorite: this.state.skipFavorite += 6,
                disabledFavorite: true
            });
            getUserFavoriteServices(this.state.skipFavorite).then((data) => {
                if (data.favorites.length < 6) {
                    this.setState({
                        showMoreFavorite: false
                    })
                }
                const result = [...this.state.favorites, ...data.favorites];
                const arrayUniqueByKey = [...new Map(result.map(item =>
                    [item['id'], item])).values()];

                this.setState({
                    favorites: arrayUniqueByKey,
                    showLoading: false,
                    disabledFavorite: false,
                })
            })
        }
        if (type == 'recent') {
            this.setState({
                skipRecent: this.state.skipRecent += 6,
                disabledRecent: true
            });
            this.getUserRecentPayments().then((data) => {
                if (data.recent.length < 6) {
                    this.setState({
                        showMoreRecent: false
                    })
                }
                const result = [...this.state.recent, ...data.recent];
                this.setState({
                    recent: result,
                    showLoading: false,
                    disabledRecent: false,
                })
            })
        }
    }

    makeFavorite(serviceId, type = null) {
        let _this = this;
        toggleFavorite(serviceId).then(() => {
            let object = {};
            if (type == 'upcoming') {
                object = this.state.upcoming.filter(item => item.bill_service_id === serviceId)
            } else if (type == 'recent') {
                object = this.state.recent.filter(item => item.bill_service_id === serviceId)

            }
            if (type) {
                _this.arrayMap(object, serviceId, type)
            } else {
                let foundFavoriteIndex = this.state.favorites.findIndex(item => item.id === serviceId);
                if (foundFavoriteIndex > -1) {
                    this.state.favorites.splice(foundFavoriteIndex, 1)
                }
                let foundRecent = this.state.recent.filter(item => item.bill_service_id === serviceId)
                let foundUpcoming = this.state.upcoming.filter(item => item.bill_service_id === serviceId)
                if (foundRecent.length) {
                    foundRecent.forEach(item => {
                        item.bill_service_with_favorite.user_favorite = []
                    })
                }

                if (foundUpcoming.length) {
                    foundUpcoming.forEach(item => {
                        item.bill_service_with_favorite.user_favorite = []
                    })
                }
            }

            const arrayUniqueByKey = [...new Map(_this.state.favorites.map(item =>
                [item['id'], item])).values()];

            _this.setState({
                upcoming: _this.state.upcoming,
                recent: _this.state.recent,
                favorites: arrayUniqueByKey,
            })
        })
    }

    arrayMap(array, serviceId, type) {
        let foundRecent = this.state.recent.filter(item => item.bill_service_id === serviceId)
        let foundUpcoming = this.state.upcoming.filter(item => item.bill_service_id === serviceId)

        array.forEach(elem => {
            if (elem.bill_service_with_favorite?.user_favorite.length) {
                elem.bill_service_with_favorite.user_favorite = [];
                let foundFavoriteIndex = this.state.favorites.findIndex(item => item.id === serviceId);
                if (foundFavoriteIndex > -1) {
                    this.state.favorites.splice(foundFavoriteIndex, 1)
                }
                if (type === 'upcoming') {
                    if (foundRecent.length) {
                        foundRecent.forEach(item => {
                            item.bill_service_with_favorite.user_favorite = []
                        })
                    }
                }
                if (type === 'recent') {
                    if (foundUpcoming.length) {
                        foundUpcoming.forEach(item => {
                            item.bill_service_with_favorite.user_favorite = []
                        })
                    }
                }
            } else {
                elem.bill_service_with_favorite.user_favorite.push({bill_service_id: serviceId});
                this.state.favorites.push(elem.bill_service_with_favorite)
                if (type === 'upcoming') {
                    if (foundRecent.length) {
                        foundRecent.forEach(item => {
                            item.bill_service_with_favorite.user_favorite.push({bill_service_id: serviceId})
                        })
                    }
                }
                if (type === 'recent') {
                    if (foundUpcoming.length) {
                        foundUpcoming.forEach(item => {
                            item.bill_service_with_favorite.user_favorite.push({bill_service_id: serviceId})
                        })
                    }
                }

            }
        })
    }

    discardPayment(id) {
        let data = {
            paymentId: id
        };
        return new Promise((resolve, reject) => {
            axios.post(api_routes.user.bill.discardPayment(), data).then(response => {
                return response.data;
            }).then(json => {
                resolve(json);
            }).catch(error => {
                Sentry.captureException(error);
                reject(error)
            });
        });
    }

    deletePayment(id, deletingPaymentId) {
        this.setState({
            showRemoveLoading: true,
            deletingPaymentId: deletingPaymentId
        }, () => {
            this.removeDirectDebit().then(() => {
                this.setState({
                    removingPaymentId: id,
                })
            })
        })
    }

    removeDirectDebit() {
        return new Promise((resolve, reject) => {
            let data = {
                event: 'remove_direct_debit',
                directDebitId: this.state.deletingPaymentId
            };
            axios.post(api_routes.user.bill.removeDirectDebit(this.state.serviceId), data).then(response => {
                return response.data;
            }).then(json => {
                resolve(json);
            }).catch(error => {
                Sentry.captureException(error);
                reject(error)
            });
        });
    }

    openServiceModal(payment, type) {
        if (type == 'new-payment') {
            Emitter.emit('showServiceModal', {
                type: type,
                billService: payment,
                onlineService: this.state.onlineService,
                serviceId: this.state.onlineService?.id,
                walletAddress: this.state.onlineService?.wallet_address,
                macAddress: this.state.onlineService?.mac_address
            });
        } else {
            Emitter.emit('showServiceModal', {
                type: type,
                payment: payment,
                onlineService: payment.pkt_service.freeze == 0 && payment.pkt_service.online == 1
            });
        }
    }

    checkPaired(id) {
        return !!cookie.load('devicePaired_' + id)
    }


    render() {
        return (
            <div className="content ">
                <Header/>
                {!this.state.showLoading ? (
                    <div className="background-gray pb-4 mh-100">
                        <div className={'container'}>
                            <div className={'row'}>
                                <motion.div initial={{scale: 0}}
                                            animate={{scale: 1}}
                                            transition={{duration: 0.2}}
                                            className={`col-12 col-md-3 col-lg-2 col-sm-6 ml-0 pt-4`}>
                                    <Link to={"/payments/services/" + this.state.serviceId}
                                          className={`btn bg-white w-100 font-weight-bold`}>
                                        Browse
                                    </Link>
                                </motion.div>

                                <motion.div initial={{scale: 0}}
                                            animate={{scale: 1}}
                                            transition={{duration: 0.2, delay: 0.2}}
                                            className={'col-12 col-md-4 col-lg-2 col-sm-6 ml-0 pt-4'}>
                                    <button type="button"
                                            className={`btn text-nowrap background-dark-blue text-white border w-100 font-weight-bold`}>
                                        My payments
                                    </button>
                                </motion.div>

                                <motion.div initial={{scale: 0}}
                                            animate={{scale: 1}}
                                            transition={{duration: 0.2, delay: 0.6}}
                                            className={'col-12 pt-4 mt-4 mb-2'}>
                                    <h2 className="font-weight-bold">Recurring payments</h2>
                                </motion.div>
                                {!this.state.upcoming.length ? (
                                        <motion.div
                                            initial={{scale: 0}}
                                            animate={{scale: 1}}
                                            transition={{duration: 0.2, delay: 0.8}}
                                            className={'mt-5 col-12'}>

                                            <div className="text-center pt-2">
                                                <h4 className="">You don't have any upcoming payments</h4>
                                            </div>

                                        </motion.div>
                                    ) :
                                    this.state.upcoming.map((upcomingService, index) => {
                                        return (
                                            <motion.div key={index}
                                                        initial={{scale: 0}}
                                                        animate={{scale: 1}}
                                                        transition={{duration: 0.2, delay: 0.8}}
                                                        className={'col-12 mt-3 col-sm-6 col-lg-4'}>
                                                <Tooltip placement="top" trigger={['hover']}
                                                         overlay={
                                                             <span> {!this.checkPaired(upcomingService.pkt_service.id) ?
                                                                 'Your Cube is not paired with your device please pair them to be able to make payment' : 'Edit payment'} </span>}>
                                                    <div
                                                        className={`px-3 bg-white radius-8 pt-3 shadow ${styles.upcomingDiv}`}>
                                                        {!this.state.showMobileSettings ? (
                                                            <div
                                                                className={`row h-75 ${!upcomingService.bill_service_with_favorite ? 'pl-2' : ''}`}>
                                                                <div className={'col-md-4 cursor-pointer'}
                                                                     onClick={() => this.checkPaired(upcomingService.pkt_service.id) ? this.openServiceModal(upcomingService, 'recurring-payment') : null}>
                                                                    <img
                                                                        src={upcomingService.bill_service_with_favorite ? `/images/services/${upcomingService.bill_service_with_favorite?.logo} ` : CustomServiceImg}
                                                                        className={`img-fluid ${styles.upcomingImage}
                                                                ${!upcomingService.bill_service_with_favorite ? 'pl-1' : ''}`}/>
                                                                </div>
                                                                <div
                                                                    className={`col-md-6 cursor-pointer`}
                                                                    onClick={() => this.checkPaired(upcomingService.pkt_service.id) ? this.openServiceModal(upcomingService, 'recurring-payment') : null}>
                                                                    <p className={'font-weight-bold font-14 mb-1'}>{upcomingService.bill_service_with_favorite ? upcomingService.bill_service_with_favorite.title : upcomingService.service_name}</p>
                                                                    <div
                                                                        className="flex justify-content-start align-items-center text-nowrap">
                                                                        <h5 className={'text-nowrap'}>$ {upcomingService.amount}</h5>
                                                                        <span
                                                                            className={'ml-3 font-14'}>{parseFloat(upcomingService.amount / this.state.USDPrice).toFixed(2)} PKT</span>
                                                                    </div>
                                                                    {upcomingService.recurring ? (
                                                                        <p className={`font-14`}>per month</p>
                                                                    ) : null}

                                                                </div>
                                                                {upcomingService.bill_service_with_favorite ? (
                                                                    <div className={`col-md-2`}>
                                                                        <button
                                                                            className={`bg-white float-right p-1`}
                                                                            onClick={() => upcomingService.bill_service_with_favorite ? this.makeFavorite(upcomingService.bill_service_with_favorite.id, 'upcoming') : null}>
                                                                            <i className={`${upcomingService.bill_service_with_favorite?.user_favorite.length ? 'fas fa-star' : 'far fa-star'} float-right fa-lg text-primary`}
                                                                               aria-hidden="true"/>
                                                                        </button>
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        ) : (
                                                            <div
                                                                className={`row h-75 ${!upcomingService.bill_service_with_favorite ? 'pl-2' : ''}`}>
                                                                <div className={'col-6'}
                                                                     onClick={() => this.checkPaired(upcomingService.pkt_service.id) ? this.openServiceModal(upcomingService, 'recurring-payment') : null}>
                                                                    <img
                                                                        src={upcomingService.bill_service_with_favorite ? `/images/services/${upcomingService.bill_service_with_favorite?.logo} ` : CustomServiceImg}
                                                                        className={`img-fluid ${styles.upcomingImage}
                                                                ${!upcomingService.bill_service_with_favorite ? 'pl-1' : ''}`}/>
                                                                </div>
                                                                {upcomingService.bill_service_with_favorite ? (
                                                                    <div className={`col-6 float-right`}>
                                                                        <button
                                                                            className={`bg-white float-right p-1`}
                                                                            onClick={() => upcomingService.bill_service_with_favorite ? this.makeFavorite(upcomingService.bill_service_with_favorite.id, 'upcoming') : null}>
                                                                            <i className={`${upcomingService.bill_service_with_favorite?.user_favorite.length ? 'fas fa-star' : 'far fa-star'} float-right fa-lg text-primary`}
                                                                               aria-hidden="true"/>
                                                                        </button>
                                                                    </div>
                                                                ) : null}

                                                                <div
                                                                    className={`col-12`}
                                                                    onClick={() => this.checkPaired(upcomingService.pkt_service.id) ? this.openServiceModal(upcomingService, 'recurring-payment') : null}>
                                                                    <p className={'font-weight-bold font-14 mb-1'}>{upcomingService.bill_service_with_favorite ? upcomingService.bill_service_with_favorite.title : upcomingService.service_name}</p>
                                                                    <div
                                                                        className="flex justify-content-start align-items-center text-nowrap">
                                                                        <h5 className={'text-nowrap'}>$ {upcomingService.amount}</h5>
                                                                        <span
                                                                            className={'ml-3 font-14'}>{parseFloat(upcomingService.amount / this.state.USDPrice).toFixed(2)} PKT</span>
                                                                    </div>
                                                                    {upcomingService.recurring ? (
                                                                        <p className={`font-14`}>per month</p>
                                                                    ) : null}

                                                                </div>

                                                            </div>
                                                        )}
                                                        <div className={`col-md-12`}>
                                                            <ProgressBar isLabelVisible={false}
                                                                         height={'5px'}
                                                                         baseBgColor={'#F1F2F4'}
                                                                         bgColor={'#3490dc'}
                                                                         completed={100 - `${moment(upcomingService.payment_date).diff(moment(), 'days')}` * 100 / (upcomingService.recurring ? 30
                                                                             : 365)}/>
                                                            {moment(upcomingService.payment_date).diff(moment().format('YYYY-MM-DD'), 'days') > 0 ? (
                                                                <span
                                                                    className={'font-14'}>{moment(upcomingService.payment_date).diff(moment().format('YYYY-MM-DD'), 'days')} days until due</span>
                                                            ) : moment(upcomingService.payment_date).diff(moment().format('YYYY-MM-DD'), 'days') === 0 ? (
                                                                <span
                                                                    className={'font-14'}>Today</span>
                                                            ) : (
                                                                <span
                                                                    className={'font-14'}>{Math.abs(moment(upcomingService.payment_date).diff(moment().format('YYYY-MM-DD'), 'days'))} days ago</span>
                                                            )}
                                                            {this.state.showRemoveLoading && upcomingService.id === this.state.removingPaymentId ? (
                                                                <div
                                                                    className="spinner-border spinner-border-sm float-right mt-3"
                                                                    role="status">
                                                                </div>
                                                            ) : (
                                                                <Tooltip placement="topRight"
                                                                         trigger={['hover']}
                                                                         overlay={
                                                                             <span>{!upcomingService.pkt_service.online || upcomingService.pkt_service.freeze !== 0 ?
                                                                                 'Your device is offline' : 'Disable payment'}</span>}>
                                                                    <div>
                                                                        <Switch
                                                                            onChange={() => this.deletePayment(upcomingService.id, upcomingService.direct_debit_id)}
                                                                            onColor={'#023DB5'}
                                                                            offColor={'#F6F7F8'}
                                                                            checkedIcon={false}
                                                                            uncheckedIcon={false}
                                                                            width={35}
                                                                            className={`float-right ${!upcomingService.pkt_service.online || upcomingService.pkt_service.freeze !== 0 ? 'disabled' : ''}`}
                                                                            height={20}
                                                                            checked={true}
                                                                            disabled={!upcomingService.pkt_service.online || upcomingService.pkt_service.freeze !== 0}/>
                                                                    </div>
                                                                </Tooltip>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Tooltip>
                                            </motion.div>
                                        )
                                    })}
                                <motion.div
                                    initial={{scale: 0}}
                                    animate={{scale: 1}}
                                    transition={{duration: 0.2, delay: 0.8}}
                                    className={`col-12 pt-4 my-2 text-center`}>
                                    {this.state.showMoreUpcoming ? (
                                        <button className={`btn shadow bg-white radius-8 py-2 px-3 font-weight-bold
                                                ${this.state.disabledUpcoming ? "disabled" : ""}`}
                                                onClick={() => this.loadMore('upcoming')}
                                                disabled={!!this.state.disabledUpcoming}
                                        >Load More
                                            {this.state.disabledUpcoming ? (
                                                <div
                                                    className="spinner-border spinner-border-sm font-14 ml-2"
                                                    role="status">
                                                </div>) : null}
                                        </button>
                                    ) : null
                                    }

                                </motion.div>

                                <motion.div initial={{scale: 0}}
                                            animate={{scale: 1}}
                                            transition={{duration: 0.2, delay: 0.6}}
                                            className={'col-12 pt-4 mt-4 mb-2'}>
                                    <h2 className="font-weight-bold">Favorite</h2>
                                </motion.div>


                                {!this.state.favorites.length ? (
                                        <motion.div
                                            initial={{scale: 0}}
                                            animate={{scale: 1}}
                                            transition={{duration: 0.2, delay: 0.8}}
                                            className={'mt-5 col-12'}>

                                            <div className="text-center pt-2">
                                                <h4>You don't have any favorite
                                                    services</h4>
                                            </div>

                                        </motion.div>
                                    ) :
                                    this.state.favorites.map((favoriteService, index) => {
                                        return (
                                            <motion.div key={index}
                                                        initial={{scale: 0}}
                                                        animate={{scale: 1}}
                                                        transition={{
                                                            duration: 0.2,
                                                            delay: 0.8
                                                        }}
                                                        className={'col-12 mt-3 col-sm-6 col-lg-4'}>
                                                <Tooltip placement="top" trigger={['hover']}
                                                         overlay={
                                                             <span> {!this.checkPaired(this.state.onlineService?.id) ?
                                                                 'Your Cube is not paired with your device please pair them to be able to make payment' : 'Create payment'} </span>}>
                                                    <div
                                                        className={`px-2 bg-white radius-8 py-3 shadow ${styles.favoriteDiv}`}>
                                                        <button
                                                            className={`bg-white float-right p-1`}
                                                            onClick={() => this.makeFavorite(favoriteService.id)}>
                                                            <i className={`fas fa-star float-right fa-lg text-primary`}
                                                               aria-hidden="true"/>
                                                        </button>

                                                        <div className={'row'}>
                                                            <div
                                                                className={'col-md-4 cursor-pointer'}
                                                                onClick={() => this.state.onlineService && this.checkPaired(this.state.onlineService.id) ? this.openServiceModal(favoriteService, 'new-payment') : null}>
                                                                <img
                                                                    src={`/images/services/${favoriteService.logo}`}
                                                                    className={`img-fluid ${styles.upcomingImage}`}
                                                                />
                                                            </div>
                                                            <div
                                                                className={'col-md-7 cursor-pointer'}
                                                                onClick={() => this.state.onlineService && this.checkPaired(this.state.onlineService.id) ? this.openServiceModal(favoriteService, 'new-payment') : null}>
                                                                <p className={'font-weight-bold mb-1'}>{favoriteService.title}</p>
                                                            </div>

                                                        </div>
                                                    </div>
                                                </Tooltip>
                                            </motion.div>
                                        )
                                    })}
                                <motion.div
                                    initial={{scale: 0}}
                                    animate={{scale: 1}}
                                    transition={{duration: 0.2, delay: 0.8}}
                                    className={`col-12 pt-4 my-2 text-center`}>
                                    {this.state.showMoreFavorite ? (
                                        <button className={`btn shadow bg-white radius-8 py-2 px-3 font-weight-bold
                                                ${this.state.disabledFavorite ? "disabled" : ""}`}
                                                onClick={() => this.loadMore('favorite')}
                                                disabled={!!this.state.disabledFavorite}
                                        >Load More
                                            {this.state.disabledFavorite ? (
                                                <div
                                                    className="spinner-border spinner-border-sm font-14 ml-2"
                                                    role="status">
                                                </div>) : null}
                                        </button>
                                    ) : null
                                    }

                                </motion.div>


                                <motion.div initial={{scale: 0}}
                                            animate={{scale: 1}}
                                            transition={{duration: 0.2, delay: 0.6}}
                                            className={'col-12 pt-4 mt-4 mb-2'}>
                                    <h2 className="font-weight-bold">Recent payments</h2>
                                </motion.div>
                                {!this.state.recent.length ? (
                                        <motion.div
                                            initial={{scale: 0}}
                                            animate={{scale: 1}}
                                            transition={{duration: 0.2, delay: 0.8}}
                                            className={'mt-5 col-12'}>

                                            <div className="text-center pt-2">
                                                <h4 className="">You don't have any recent
                                                    payments</h4>
                                            </div>

                                        </motion.div>
                                    ) :
                                    this.state.recent.map((recentService, index) => {
                                        return (
                                            <motion.div key={index}
                                                        initial={{scale: 0}}
                                                        animate={{scale: 1}}
                                                        transition={{
                                                            duration: 0.2,
                                                            delay: 0.8
                                                        }}
                                                        className={'col-12 mt-3 col-sm-6 col-lg-4'}>
                                                <Tooltip placement="top" trigger={['hover']}
                                                         overlay={
                                                             <span>View payment</span>}>
                                                    <div
                                                        className={`p-2 bg-white radius-8 pt-3 shadow ${styles.recentDiv}`}>
                                                        {recentService.bill_service_with_favorite ? (
                                                            <button
                                                                className={`bg-white float-right p-1`}
                                                                onClick={() => recentService.bill_service_with_favorite ? this.makeFavorite(recentService.bill_service_with_favorite.id, 'recent') : null}>
                                                                <i className={`${recentService.bill_service_with_favorite?.user_favorite.length ? 'fas fa-star' : 'far fa-star'} float-right fa-lg text-primary`}
                                                                   aria-hidden="true"/>
                                                            </button>
                                                        ) : null}

                                                        <div
                                                            className={`row h-75 ${!recentService.bill_service_with_favorite ? 'pl-2' : ''}`}>
                                                            <div
                                                                className={'col-md-4 cursor-pointer'}
                                                                onClick={() => this.openServiceModal(recentService, 'recent-payment')}>
                                                                <img
                                                                    src={recentService.bill_service_with_favorite ? `/images/services/${recentService.bill_service_with_favorite?.logo} ` : CustomServiceImg}
                                                                    className={`img-fluid ${styles.upcomingImage}
                                                                ${!recentService.bill_service_with_favorite ? 'pl-1' : ''}`}
                                                                />
                                                            </div>
                                                            <div
                                                                className={`col-md-7 cursor-pointer`}
                                                                onClick={() => this.openServiceModal(recentService, 'recent-payment')}>
                                                                <p className={'font-weight-bold font-14 mb-1'}>{recentService.bill_service_with_favorite ? recentService.bill_service_with_favorite.title : recentService.service_name}</p>
                                                                <div
                                                                    className="flex justify-content-start align-items-center text-nowrap">
                                                                    <h5 className={'text-nowrap'}>$ {recentService.amount}</h5>
                                                                    <span
                                                                        className={'ml-3 font-14'}>{parseFloat(recentService.amount / this.state.USDPrice).toFixed(2)} PKT</span>
                                                                </div>
                                                                {recentService.recurring ? (
                                                                    <p className={`font-14 mb-1`}>per
                                                                        month</p>
                                                                ) : null}

                                                                <p>{moment(recentService.updated_at).format('YYYY-MM-DD')}</p>
                                                            </div>

                                                        </div>
                                                    </div>
                                                </Tooltip>
                                            </motion.div>
                                        )
                                    })}
                                <motion.div
                                    initial={{scale: 0}}
                                    animate={{scale: 1}}
                                    transition={{duration: 0.2, delay: 0.8}}
                                    className={`col-12 pt-4 my-2 text-center`}>
                                    {this.state.showMoreRecent ? (
                                        <button className={`btn shadow bg-white radius-8 py-2 px-3 font-weight-bold
                                                ${this.state.disabledRecent ? "disabled" : ""}`}
                                                onClick={() => this.loadMore('recent')}
                                                disabled={!!this.state.disabledRecent}
                                        >Load More
                                            {this.state.disabledRecent ? (
                                                <div
                                                    className="spinner-border spinner-border-sm font-14 ml-2"
                                                    role="status">
                                                </div>) : null}
                                        </button>
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
                <Footer stripMargin={true}/>
                <ServiceModal/>
            </div>
        )
    }
}

export default withRouter(Upcoming)
