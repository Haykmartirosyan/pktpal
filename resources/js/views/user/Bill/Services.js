import React, {Component} from 'react';
import {Link, withRouter} from "react-router-dom";
import Header from "../../../components/Header/Header";
import {motion} from "framer-motion";
import Footer from "../../../components/Footer/Footer";
import {Load} from "../../../components/Loadings/Load";
import styles from "./Payments.module.scss";
import {getUserPktService} from "../../Helpers/StatisticsHelpers";
import ServiceModal from "../../Modals/ServiceModal";
import Emitter from "../../../services/emitter";
import {toggleFavorite} from "../../Helpers/PaymentsHelpers";
import OtherServiceImg from "../../../../../public/images/pkt-favicon.png"
import cookie from "react-cookies";
import Tooltip from "rc-tooltip";
import * as Sentry from "@sentry/react";

class Services extends Component {
    constructor(props) {
        super(props);
        this.state = {
            serviceId: props.match.params.id,
            walletAddress: '',
            macAddress: '',
            showLoading: true,
            services: [],
            dropdownServices: [],
            searchQuery: '',
            skip: 0,
            showMore: true,
            disabledButton: false,
            onlineService: false,
            typing: false,
            typingTimeout: 0,
            servicesLoading: false,
            hideDropdown: false,
            isMobile: window.innerWidth <= 850,
        }
        this.handleSearchQuery = this.handleSearchQuery.bind(this);
        this.handleSearchLength = this.handleSearchLength.bind(this)
    }

    componentDidMount() {
        this.mountComponent();
        let _this = this;
        Emitter.on('toggleFavorite', (data) => {
            _this.findFavorite(data.serviceId)
        })
    }

    mountComponent(hide = false) {
        let _this = this;
        getUserPktService(this.state.serviceId).then((data) => {
            _this.setState({
                walletAddress: data.data ? data.data.wallet_address : '',
                macAddress: data.data ? data.data.mac_address : '',
                onlineService: !!(data?.data?.online && (!data?.data?.freeze)),
            });
            if (_this.state.walletAddress && _this.state.macAddress) {
                _this.getBillServices().then(response => {
                    if (this.state.searchQuery.length > 2 || this.state.searchQuery.length == 0) {
                        _this.setState({
                            services: response.data,
                        })
                    }
                    _this.setState({
                        dropdownServices: this.state.searchQuery.length > 2 || this.state.searchQuery.length == 0 ? response.data : [],
                        showLoading: false,
                        hideDropdown: hide,
                        servicesLoading: false,
                        showMore: response.data.length < 10 ? false : true
                    });
                })
            } else {
                _this.setState({
                    showLoading: false
                });
            }
        }).catch(e => {
            Sentry.captureException(e);
            return this.props.history.push('/404');
        })
    }

    makeFavorite(serviceId) {
        let _this = this;

        toggleFavorite(serviceId).then(() => {
            _this.findFavorite(serviceId)
        })
    }

    findFavorite(serviceId) {
        let found = this.state.services.find(service => {
            return service.id == serviceId
        });
        if (found.user_favorite.length) {
            found.user_favorite = [];
        } else {
            found.user_favorite.push({bill_service_id: serviceId})
        }

        this.setState({
            services: this.state.services
        })
    }

    getBillServices() {
        let data = {
            params: {
                skip: this.state.skip,
                searchQuery: this.state.searchQuery ? this.state.searchQuery : null
            }
        };
        return new Promise((resolve, reject) => {
            axios.get(api_routes.user.bill.getBillServices(), data).then(response => {
                return response.data;
            }).then(json => {
                resolve(json);
            }).catch(error => {
                Sentry.captureException(error);
                reject(error)
            });
        });
    }

    openServiceModal(billService = null) {
        Emitter.emit('showServiceModal', {
            type: 'new-payment',
            billService: billService ? billService : null,
            serviceId: this.state.serviceId,
            walletAddress: this.state.walletAddress,
            macAddress: this.state.macAddress,
            onlineService: this.state.onlineService
        });
    }

    handleSearchLength(e) {
        let _this = this;
        _this.setState({
            searchQuery: e.target.value,
        })

        if ((e.target.value.length >= 3 || e.target.value.length === 0)) {
            _this.setState({
                servicesLoading: true,
            })
            if (_this.state.typingTimeout) {
                clearTimeout(_this.state.typingTimeout);
            }
            _this.setState({
                typing: false,
                typingTimeout: setTimeout(function () {
                    _this.setState({
                        skip: 0,
                    }, () => {
                        _this.mountComponent();
                    })
                }, 1000)
            });
        } else {
            _this.setState({
                dropdownServices: [],
            })
        }
    }

    handleSearchQuery(e = null) {
        let _this = this
        if (e.charCode === 13 && _this.state.searchQuery.length > 2) {
            _this.setState({
                hideDropdown: true
            })
        }
    }

    selectService(name) {
        let _this = this;
        _this.setState({
            searchQuery: name,
            skip: 0,
            services: [],
            dropdownServices: [],
            servicesLoading: true,
        }, () => {
            _this.mountComponent(true)
        });
    }

    loadMore() {
        this.setState({
            skip: this.state.skip += 10,
            disabledButton: true
        });
        this.getBillServices().then((data) => {
            if (data.data.length < 10) {
                this.setState({
                    showMore: false
                })
            }
            const result = [...this.state.services, ...data.data];
            this.setState({
                services: result,
                dropdownServices: result,
                disabledButton: false
            })
        })
    }

    removeSearch() {
        this.setState({
            searchQuery: '',
        }, () => {
            this.mountComponent()
        })
    }


    render() {
        return (
            <div className="content ">
                <Header/>
                {!this.state.showLoading ? (

                    <div className="background-gray pb-4 mh-100">
                        <div className={'container'}>
                            <div className={'row '}>
                                <motion.div initial={{scale: 0}}
                                            animate={{scale: 1}}
                                            transition={{duration: 0.2}}
                                            className={`col-12 col-md-3 col-lg-2 col-sm-6 ml-0 pt-4`}>
                                    <button type="button"
                                            className={`btn background-dark-blue text-white w-100 font-weight-bold`}>
                                        Browse
                                    </button>
                                </motion.div>

                                <motion.div initial={{scale: 0}}
                                            animate={{scale: 1}}
                                            transition={{duration: 0.2, delay: 0.2}}
                                            className={'col-12 col-md-4 col-lg-2 col-sm-6 ml-0 pt-4'}>
                                    <Link
                                        to={{pathname: "/payments/upcoming"}}
                                        className={`btn text-nowrap bg-white border w-100 font-weight-bold`}>
                                        My payments
                                    </Link>
                                </motion.div>

                                <motion.div initial={{scale: 0}}
                                            animate={{scale: 1}}
                                            transition={{duration: 0.2, delay: 0.4}}
                                            className={'col-12 col-md-5 col-lg-8 ml-0 pt-4'}>
                                    <div className='dropdown h-100 '>
                                        <input type="text" placeholder="Search..."
                                               value={this.state.searchQuery}
                                               onChange={(e) => this.handleSearchLength(e)}
                                               onKeyPress={(e) => this.handleSearchQuery(e)}
                                               data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'
                                               className={`form-control border position-relative h-100`}/>
                                        <button className={`btn bg-transparent  ${styles.removeSearch}`}
                                                onClick={() => this.removeSearch()}>
                                            <i className="fas fa-times"/>
                                        </button>

                                        <div className={`dropdown-menu w-100 p-0 show border-0`}
                                             aria-labelledby='dropdownMenuButton'>
                                            {this.state.searchQuery.length && !this.state.hideDropdown ? (
                                                !this.state.servicesLoading ? (
                                                    this.state.dropdownServices.length ? (
                                                        <ul className="list-group list-group-flush">
                                                            {this.state.dropdownServices.map((service, index) => {
                                                                return (
                                                                    <li key={index}
                                                                        onClick={() => this.selectService(service.title)}
                                                                        className="list-group-item list-group-item-action d-flex justify-content-start align-items-center cursor-pointer">
                                                                        <img src={`/images/services/${service.logo}`}
                                                                             className={styles.serviceLogoSearch}
                                                                             alt={service.title}/>
                                                                        <span className={'ml-3'}>{service.title}</span>
                                                                    </li>
                                                                )
                                                            })}
                                                            <li
                                                                onClick={() => this.selectService('Other Service')}
                                                                className="list-group-item list-group-item-action d-flex justify-content-start align-items-center cursor-pointer">
                                                                <img src={OtherServiceImg}
                                                                     className={styles.serviceLogoSearch}
                                                                     alt={`Other Service`}/>
                                                                <span className={'ml-3'}>Other Service</span>
                                                            </li>
                                                        </ul>
                                                    ) : (
                                                        this.state.searchQuery.length > 2 && this.state.searchQuery.trim().length !== 0 ?
                                                            <ul className=" bg-white list-group list-group-flush">
                                                                <li className="list-group-item list-group-item-action d-flex justify-content-start align-items-center">
                                                                    <span>Nothing found...</span>
                                                                </li>
                                                            </ul> : null
                                                    )
                                                ) : (
                                                    this.state.searchQuery.trim().length !== 0 ?
                                                        <div
                                                            className="spinner-border spinner-border-sm font-14 ml-2"
                                                            role="status">
                                                        </div> : null
                                                )

                                            ) : null}
                                        </div>
                                    </div>


                                </motion.div>

                                <motion.div initial={{scale: 0}}
                                            animate={{scale: 1}}
                                            transition={{duration: 0.2, delay: 0.6}}
                                            className={'col-12 pt-4 mt-4 mb-2'}>
                                    <h2 className="font-weight-bold">All services</h2>
                                </motion.div>

                                {this.state.services.length ? (

                                    this.state.services.map((service, index) => {
                                        return (
                                            <motion.div key={index}
                                                        initial={{scale: 0}}
                                                        animate={{scale: 1}}
                                                        transition={{duration: 0.2, delay: 0.8}}
                                                        className={'col-12 mt-3 col-sm-4 col-lg-2'}>
                                                {!cookie.load('devicePaired_' + this.state.serviceId) ? (
                                                    <Tooltip placement="top" trigger={[this.state.isMobile ? 'click' : 'hover']}
                                                             overlay={<span>Your Cube is not paired with your device please pair them to be able to make payment</span>}>
                                                        <div
                                                            className={`cursor-pointer p-2 bg-white radius-8 pt-3 ${styles.serviceDiv} d-flex flex-column justify-content-between`}>
                                                            <div>
                                                                <button className={`bg-white float-right p-1`}
                                                                        onClick={() => this.makeFavorite(service.id)}>
                                                                    <i className={`${service.user_favorite?.length ? 'fas fa-star' : 'far fa-star'} 
                                                                                float-right fa-lg text-primary`}
                                                                       aria-hidden="true"/>
                                                                </button>
                                                            </div>

                                                            <div
                                                                className={`flex justify-content-center cursor-pointer`}>
                                                                <img src={`/images/services/${service.logo}`}
                                                                     className={`${styles.serviceLogo} img-fluid`}
                                                                     alt={service.title}/>
                                                            </div>
                                                            <p className={'font-weight-bold text-center cursor pointer'}
                                                            >{service.title}</p>

                                                        </div>
                                                    </Tooltip>) : (
                                                    <div
                                                        className={`cursor-pointer p-2 bg-white radius-8 pt-3 ${styles.serviceDiv} d-flex flex-column justify-content-between`}>
                                                        <div className={''}>
                                                            <button className={`bg-white float-right p-1`}
                                                                    onClick={() => this.makeFavorite(service.id)}>
                                                                <i className={`${service.user_favorite?.length ? 'fas fa-star' : 'far fa-star'} 
                                                                                float-right fa-lg text-primary`}
                                                                   aria-hidden="true"/>
                                                            </button>
                                                        </div>
                                                        <div
                                                            className={`flex justify-content-center cursor-pointer`}
                                                            onClick={() => this.openServiceModal(service)}>
                                                            <img src={`/images/services/${service.logo}`}
                                                                 className={`${styles.serviceLogo} img-fluid`}
                                                                 alt={service.title}/>
                                                        </div>
                                                        <p className={'font-weight-bold text-center cursor pointer'}
                                                           onClick={() => this.openServiceModal(service)}
                                                        >{service.title}</p>

                                                    </div>
                                                )}

                                            </motion.div>
                                        )
                                    })
                                ) : null}
                                {!cookie.load('devicePaired_' + this.state.serviceId) ? (
                                    <Tooltip placement="top" trigger={[this.state.isMobile ? 'click' : 'hover']}
                                             overlay={<span>Your Cube is not paired with your device please pair them to be able to make payment</span>}>
                                        <motion.div initial={{scale: 0}}
                                                    animate={{scale: 1}}
                                                    transition={{duration: 0.2, delay: 0.8}}
                                                    className={`col-12 mt-3 col-sm-4 col-lg-2`}>
                                            <div className={`cursor-pointer p-2 bg-white radius-8 ${styles.serviceDiv}
                                    d-flex flex-column justify-content-center`}>
                                                <div className={`flex justify-content-center align-items-center p-1`}>
                                                    <svg width="39" height="39" viewBox="0 0 39 39" fill="none"
                                                         xmlns="http://www.w3.org/2000/svg">
                                                        <rect x="17.4004" width="4.8" height="39" rx="2.4"
                                                              fill="#023DB5"/>
                                                        <rect y="21.5996" width="4.8" height="39" rx="2.4"
                                                              transform="rotate(-90 0 21.5996)" fill="#023DB5"/>
                                                    </svg>
                                                </div>
                                                <h5 className={`text-center `}>Other service</h5>
                                            </div>
                                        </motion.div>
                                    </Tooltip>) : (
                                    <motion.div initial={{scale: 0}}
                                                animate={{scale: 1}}
                                                transition={{duration: 0.2, delay: 0.8}}
                                                className={`col-12 mt-3 col-sm-4 col-lg-2`}
                                                onClick={() => this.openServiceModal()}>
                                        <div className={`cursor-pointer p-2 bg-white radius-8 ${styles.serviceDiv}
                                    d-flex flex-column justify-content-center`}>
                                            <div className={`flex justify-content-center align-items-center p-1`}>
                                                <svg width="39" height="39" viewBox="0 0 39 39" fill="none"
                                                     xmlns="http://www.w3.org/2000/svg">
                                                    <rect x="17.4004" width="4.8" height="39" rx="2.4"
                                                          fill="#023DB5"/>
                                                    <rect y="21.5996" width="4.8" height="39" rx="2.4"
                                                          transform="rotate(-90 0 21.5996)" fill="#023DB5"/>
                                                </svg>
                                            </div>
                                            <h5 className={`text-center `}>Other service</h5>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                            {this.state.showMore ? (
                                <motion.div className={`text-center mt-3`}
                                            initial={{scale: 0}}
                                            animate={{scale: 1}}
                                            transition={{duration: 0.2, delay: 0.8}}>
                                    <button className={`btn shadow bg-white radius-8 py-2 px-3 font-weight-bold
                                    ${this.state.disabledButton ? 'disabled' : ''}`}
                                            disabled={this.state.disabledButton}
                                            onClick={() => this.loadMore()}>
                                        Load More
                                        {this.state.disabledButton ? (
                                            <div
                                                className="spinner-border spinner-border-sm font-14 ml-2"
                                                role="status">
                                            </div>) : null}
                                    </button>
                                </motion.div>
                            ) : null}
                        </div>
                    </div>
                ) : (
                    <div>
                        <Load/>
                    </div>
                )}
                <ServiceModal/>
                <Footer stripMargin={true}/>
            </div>
        )
    }
}

export default withRouter(Services)
