import React, {Component} from 'react'
import {Link, withRouter} from 'react-router-dom';
import './Header.css';
import logo from '../../../../public/images/PKT_Pal.svg';
import cookie from "react-cookies";
import {connect} from 'react-redux'
import Emitter from "../../services/emitter";
import * as Sentry from "@sentry/react";

class Header extends Component {
    constructor(props) {
        super(props);
        this.state = {
            user: props.init.user,
            isLoggedIn: !!props.init.user,
            loginPage: props.loginPage,
            settingsPage: props.settingsPage,
            serviceId: props.serviceId,
            splitLocation: location.pathname.split('/'),
            loadedServices: false,
            displayMode: 'browser'
        };
        this.logOut = this.logOut.bind(this);
    }

    getUserPktServices() {
        return new Promise((resolve, reject) => {
            axios.get(api_routes.user.pktServices()).then(response => {
                return response;
            }).then(json => {
                resolve(json);
            }).catch(error => {
                Sentry.captureException(error);
                reject(error)
            });
        });
    }

    componentDidMount() {

        let _this = this;
        const mqStandAlone = '(display-mode: standalone)';

        if (navigator.standalone || window.matchMedia(mqStandAlone).matches) {
            _this.setState({
                displayMode: 'standalone'
            });
        }

        if (this.state.user) {
            this.getUserPktServices().then(response => {
                this.setState({
                    loadedServices: true,
                    serviceId: response.data.pkt_services[0]?.id ? response.data.pkt_services[0].id : null,
                }, () => {
                    Emitter.emit('firstServiceId', this.state.serviceId)
                })
            })
        }
    }

    logOut() {
        axios.get(api_routes.user.logout()).then(response => {
            return response;
        }).then(json => {
            if (json.data.success) {
                let appState = {
                    isLoggedIn: false,
                };
                cookie.remove('accessToken', {path: '/'});
                this.setState(appState);
                this.props.history.push('/login');
            }
        }).catch(error => {
            Sentry.captureException(error);
            let err = error.message;
            this.setState({
                error: err,
                formSubmitting: false
            });
        });
    }

    render() {

        return (
            <nav className="navbar navbar-expand-lg navbar-light bg-white">

                <div className="container">
                    <a href={this.state.displayMode == 'browser' ? "https://pktpal.com/" : '#'}
                       className="navbar-brand">
                        <img src={logo} className="img-fluid logo" alt=""/>
                    </a>
                    {!this.state.loginPage ? (
                        <button className="navbar-toggler" type="button" data-toggle="collapse"
                                data-target="#navbarSupportedContent"
                                aria-controls="navbarSupportedContent" aria-expanded="false"
                                aria-label="Toggle navigation">
                            <span className="navbar-toggler-icon"/>
                        </button>
                    ) : null}

                    {!this.state.loginPage ? (
                        <div className="collapse navbar-collapse" id="navbarSupportedContent">
                            <ul className="nav navbar-nav m-auto">
                                {this.state.displayMode == 'browser' &&
                                <li className="nav-item">
                                    <a
                                        href={"https://pktpal.com/pkt-cube/"}
                                        className="nav-link">Earn</a>
                                </li>
                                }
                                {this.state.displayMode == 'browser' &&

                                <li className="nav-item ">
                                    <a
                                        href={"https://pktpal.com/learn/"}
                                        className="nav-link">Learn</a>
                                </li>
                                }

                                <li className="nav-item ">
                                    <Link to="/dashboard"
                                          className={`nav-link ${this.state.splitLocation[1] === "dashboard" ||
                                          this.state.splitLocation[1] === "pkt" && this.state.splitLocation[2] === "details" ? "active" : ""}`}>Dashboard</Link>
                                </li>
                                {this.state.displayMode == 'browser' &&

                                <li className="nav-item ">
                                    <a
                                        href={"https://pktpal.goaffpro.com/"}
                                        className="nav-link">Affiliate</a>
                                </li>

                                }

                                {this.state.user && (this.state.user.user_email == 'cjd@cjdns.fr' || this.state.user.user_email == 'greta@pktpal.com') ? (
                                    <li className="nav-item ">
                                        <Link
                                            to={{pathname: "/payments/" + (this.state.serviceId ? this.state.serviceId : "no-service")}}
                                            className={`nav-link ${this.state.splitLocation[1] === "payments" && this.state.splitLocation[2] !== "services" && this.state.splitLocation[2] !== "upcoming" ? "active" : ""} ${!this.state.loadedServices ? 'disabled' : ''} `}>
                                            Pay
                                        </Link>
                                    </li>
                                ) : null}

                                {this.state.user && (this.state.user.user_email == 'cjd@cjdns.fr' || this.state.user.user_email == 'greta@pktpal.com') ? (
                                    <li className="nav-item ">
                                        <Link
                                            to={{pathname: this.state.serviceId ? "/payments/services/" + this.state.serviceId : location.pathname}}
                                            className={`nav-link ${this.state.splitLocation[2] === "services" || this.state.splitLocation[2] === "upcoming" ? "active" : ""}`}>
                                            Services
                                        </Link>
                                    </li>
                                ) : null}

                            </ul>


                            <ul className="list-inline ml-3 d-flex align-items-center">
                                {this.state.displayMode == 'browser' &&

                                <li className="list-inline-item">
                                    <button className={`navLink`}>
                                        <a
                                            href={"https://pktpal.com/cart/"}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                                                 xmlns="http://www.w3.org/2000/svg">
                                                <path fillRule="evenodd" clipRule="evenodd"
                                                      d="M18.2083 2H23V4H19.7816L17.0128 16.6776H17V17H4V16.7519L1.80678 7.09095L1.46924 6H17.3448L17.9151 3.38852L18.2083 2ZM4.01314 8H16.908L15.3792 15H5.60222L4.01314 8Z"
                                                      fill="#0F1114"/>
                                                <path
                                                    d="M14 22C12.8954 22 12 21.1046 12 20C12 18.8954 12.8954 18 14 18C15.1046 18 16 18.8954 16 20C16 21.1046 15.1046 22 14 22Z"
                                                    fill="#0F1114"/>
                                                <path
                                                    d="M5 20C5 21.1046 5.89543 22 7 22C8.10457 22 9 21.1046 9 20C9 18.8954 8.10457 18 7 18C5.89543 18 5 18.8954 5 20Z"
                                                    fill="#0F1114"/>
                                            </svg>
                                        </a>
                                    </button>
                                </li>
                                }
                                {this.state.displayMode == 'browser' &&

                                <li className="list-inline-item">
                                    <div className="dropdown">
                                        <button className="navLink" data-toggle="dropdown">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                                                 xmlns="http://www.w3.org/2000/svg">
                                                <path fillRule="evenodd" clipRule="evenodd"
                                                      d="M8 7C8 9.20914 9.79086 11 12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7ZM10 7C10 8.10457 10.8954 9 12 9C13.1046 9 14 8.10457 14 7C14 5.89543 13.1046 5 12 5C10.8954 5 10 5.89543 10 7Z"
                                                      fill="#0F1114"/>
                                                <path
                                                    d="M8 15C8 14.4477 8.44772 14 9 14H15C15.5523 14 16 14.4477 16 15V21H18V15C18 13.3431 16.6569 12 15 12H9C7.34315 12 6 13.3431 6 15V21H8V15Z"
                                                    fill="#0F1114"/>
                                            </svg>
                                        </button>
                                        {this.state.isLoggedIn ?
                                            <ul className="dropdown-menu logged-user-block">
                                                <li>
                                                    <a
                                                        href={"https://pktpal.com/my-account/orders/"}
                                                        className="nav-link">My Account</a>
                                                </li>
                                                {/* <li>
                                                        <Link to={'#'}
                                                              onClick={this.logOut}
                                                              className="nav-link">Logout</Link>
                                                    </li>*/}
                                            </ul> : ""}
                                    </div>
                                </li>
                                }
                                {this.state.settingsPage ? (
                                    <li className="list-inline-item">
                                        <button className={`navLink`}>
                                            <Link to={"/pkt/settings/" + this.state.serviceId}>
                                                <svg width="50" height="52" viewBox="0 0 52 52" fill="none"
                                                     xmlns="http://www.w3.org/2000/svg">
                                                    <path
                                                        d="M0 6C0 2.68629 2.68629 0 6 0H45.9749C49.2886 0 51.9749 2.68629 51.9749 6V45.9749C51.9749 49.2886 49.2886 51.9749 45.9749 51.9749H6C2.68629 51.9749 0 49.2886 0 45.9749V6Z"/>
                                                    <path
                                                        d="M36.9302 24.5732C36.9302 24.5676 36.9247 24.5676 36.9247 24.5621C36.7127 23.8591 36.1994 23.4463 35.4407 23.3682C35.1729 23.3403 34.8996 23.3012 34.6318 23.2678C34.4477 23.2455 34.2636 23.2176 34.0739 23.1953C34.0683 23.1953 34.0627 23.1953 34.0572 23.1953C34.0572 23.1897 34.0516 23.1841 34.0516 23.1785C33.9902 23.0056 33.9177 22.8326 33.8452 22.6708C33.7838 22.5314 33.728 22.3975 33.6778 22.258C33.8452 22.0349 34.0181 21.8117 34.1855 21.5941C34.3138 21.4324 34.4421 21.265 34.5648 21.1032C35.1171 20.3724 35.0669 19.5188 34.4198 18.8717C34.007 18.4589 33.583 18.0293 33.1144 17.5662C32.4449 16.9024 31.5969 16.8466 30.8494 17.4268C30.7322 17.516 30.615 17.6109 30.4979 17.7001C30.2413 17.901 29.9791 18.1074 29.7169 18.3026C29.583 18.2524 29.4491 18.1967 29.3096 18.1353C29.1422 18.0628 28.9749 17.9902 28.7964 17.9289C28.7908 17.9289 28.7852 17.9233 28.7796 17.9233C28.7796 17.9177 28.7796 17.9121 28.7796 17.9066C28.7517 17.689 28.7294 17.4714 28.7015 17.2538C28.668 16.9972 28.6346 16.735 28.6067 16.4728C28.5118 15.6081 27.8312 15.0056 26.9609 15C26.3082 15 25.6555 15 25.0139 15C24.1381 15 23.463 15.6192 23.3682 16.5007C23.3347 16.8075 23.2957 17.1199 23.2566 17.4212C23.2343 17.5886 23.212 17.7559 23.1953 17.9289C23.0223 17.9902 22.8549 18.0628 22.6932 18.1297C22.5537 18.1911 22.4031 18.2524 22.258 18.3082C22.0404 18.1464 21.8229 17.9791 21.6109 17.8117C21.4379 17.6778 21.265 17.5384 21.0865 17.4045C20.3668 16.8577 19.5188 16.9191 18.8717 17.5551C18.537 17.8842 18.2022 18.2245 17.8731 18.5537L17.5997 18.8271C16.8856 19.5411 16.841 20.3724 17.4602 21.1757C17.5551 21.2985 17.6555 21.4268 17.7503 21.5495C17.9289 21.7838 18.1185 22.0237 18.3026 22.258C18.1576 22.5704 18.0293 22.8828 17.9233 23.1785C17.9233 23.1841 17.9177 23.1897 17.9177 23.1953C17.9121 23.1953 17.9121 23.1953 17.9066 23.1953C17.6834 23.2231 17.4658 23.251 17.2427 23.2789C16.9916 23.3124 16.7294 23.3403 16.4784 23.3738C15.7922 23.4519 15.2566 23.887 15.0558 24.5397C15.0502 24.5509 15.0446 24.5676 15.0391 24.5844C15.0335 24.6011 15.0279 24.6123 15.0223 24.629L15 24.6792V27.3068L15.0279 27.3626C15.0558 27.4128 15.0781 27.4686 15.1004 27.5244C15.1618 27.6639 15.2232 27.8033 15.3124 27.9372C15.5746 28.3222 15.9763 28.5453 16.5007 28.6067C16.8243 28.6457 17.159 28.6848 17.4826 28.7294C17.6332 28.7462 17.7782 28.7685 17.9289 28.7852C17.9958 28.9637 18.0683 29.1367 18.1353 29.304C18.1911 29.4379 18.2524 29.583 18.3082 29.7224C18.1409 29.9512 17.9623 30.1799 17.7894 30.3975C17.6611 30.5593 17.5328 30.7266 17.41 30.894C16.8633 31.6137 16.9191 32.4561 17.5495 33.092C18.0404 33.5885 18.4867 34.0349 18.9107 34.4533C19.5244 35.0558 20.3724 35.1171 21.0586 34.6039C21.2706 34.4477 21.477 34.2859 21.6778 34.1297C21.8731 33.9791 22.0683 33.8229 22.2692 33.6778C22.4142 33.7336 22.5593 33.795 22.6987 33.8507C22.8605 33.9177 23.0279 33.9902 23.2008 34.0516C23.2231 34.2134 23.2399 34.3752 23.2622 34.5314C23.3012 34.827 23.3403 35.1339 23.3738 35.4296C23.4575 36.1883 23.848 36.6736 24.5676 36.9135C24.5732 36.9191 24.5732 36.9191 24.5788 36.9247L24.6513 36.9749H27.3124L27.3682 36.947C27.4184 36.9247 27.4742 36.9024 27.5244 36.8745C27.6583 36.8187 27.7922 36.7573 27.9205 36.6736C28.311 36.417 28.5453 36.0153 28.6067 35.4965L28.6625 35.0558C28.7015 34.7266 28.7462 34.3975 28.7852 34.0683C28.7852 34.0627 28.7852 34.0572 28.7852 34.0516C28.7908 34.0516 28.7908 34.046 28.7964 34.046C29.0809 33.9456 29.3821 33.8173 29.7224 33.6667C30.1018 33.9679 30.4812 34.2636 30.8717 34.5593C31.5969 35.1171 32.4561 35.0613 33.1032 34.4198C33.583 33.9456 34.0181 33.5104 34.4365 33.0865C35.0669 32.4505 35.1227 31.6025 34.576 30.8884C34.4421 30.7099 34.3026 30.5314 34.1687 30.3584C34.007 30.1464 33.8396 29.9344 33.6778 29.7169C33.728 29.5774 33.7894 29.4435 33.8452 29.304C33.9121 29.1422 33.9846 28.9749 34.046 28.8019C34.046 28.7964 34.0516 28.7908 34.0516 28.7852C34.0572 28.7852 34.0627 28.7852 34.0683 28.7852C34.2636 28.7629 34.4588 28.735 34.6597 28.7127C34.9163 28.6792 35.1785 28.6457 35.4351 28.6178C36.1994 28.5342 36.7127 28.1213 36.9191 27.424C36.9191 27.4184 36.9247 27.4184 36.9247 27.4128L36.9749 27.3403V24.6513L36.9302 24.5732ZM32.7852 27.9707C32.6234 28.4058 32.4282 28.8689 32.1771 29.4323C32.0376 29.7448 32.0655 30.0404 32.272 30.2971C32.629 30.7489 32.9972 31.2231 33.3989 31.7475C33.5216 31.9038 33.516 31.9372 33.3766 32.0823C32.9358 32.5286 32.5007 32.9637 32.0767 33.3821C31.9428 33.516 31.9149 33.5272 31.7475 33.3989L31.4686 33.1813C31.0948 32.8912 30.7099 32.5955 30.3361 32.2998C30.0516 32.0711 29.7392 32.0376 29.3933 32.1994C28.9414 32.4114 28.4616 32.6067 27.9707 32.7908C27.6192 32.9191 27.4296 33.159 27.3905 33.516C27.3291 34.0683 27.2455 34.6708 27.1506 35.3514C27.1283 35.4965 27.1004 35.5188 26.9554 35.5244C26.7378 35.53 26.5091 35.53 26.2971 35.53C26.1966 35.53 26.1018 35.53 26.0014 35.53H25.7224C25.7169 35.53 25.7169 35.53 25.7113 35.53C25.4993 35.53 25.2761 35.53 25.0641 35.53C24.88 35.5244 24.8577 35.5021 24.8298 35.3291C24.7462 34.7489 24.6681 34.1408 24.5955 33.516C24.5565 33.1646 24.3724 32.9303 24.0321 32.8019C23.5523 32.6178 23.0669 32.417 22.5481 32.1827C22.4198 32.1269 22.2971 32.099 22.1743 32.099C22.0014 32.099 21.834 32.1604 21.6778 32.2831C21.2204 32.6457 20.7462 33.0084 20.2441 33.3989C20.0655 33.5383 20.0377 33.5328 19.8814 33.3766C19.463 32.9581 19.0446 32.5397 18.6262 32.1213C18.4533 31.9484 18.4533 31.9316 18.5983 31.742L18.7211 31.5858C19.039 31.1729 19.3738 30.7434 19.7029 30.325C19.9205 30.0516 19.954 29.7559 19.7978 29.4212C19.5746 28.9303 19.3738 28.4449 19.1953 27.9763C19.0669 27.6304 18.8271 27.4407 18.47 27.3961C17.9177 27.3347 17.3208 27.2566 16.6346 27.1562C16.4951 27.1339 16.4672 27.106 16.4616 26.9665C16.4561 26.3082 16.4561 25.6555 16.4616 25.0307C16.4616 24.9135 16.4784 24.8689 16.6402 24.8466C17.2483 24.7629 17.8675 24.6792 18.4756 24.6067C18.8271 24.5676 19.0614 24.3835 19.1897 24.0432C19.3738 23.5579 19.5802 23.0614 19.7978 22.5816C19.9484 22.2469 19.9149 21.9512 19.6973 21.6778C19.3682 21.265 19.039 20.8354 18.7211 20.4226L18.5927 20.2441C18.4533 20.0655 18.4589 20.0432 18.6151 19.8814C19.0223 19.4686 19.463 19.0279 19.8982 18.5927C20.0321 18.4589 20.0655 18.4589 20.2106 18.5704C20.696 18.9442 21.1869 19.3236 21.6778 19.7085C21.94 19.9149 22.2245 19.9428 22.5481 19.7978C23.0893 19.5579 23.5635 19.357 24.0098 19.1897C24.3556 19.0614 24.5453 18.8215 24.5899 18.4644C24.6513 17.9121 24.7294 17.3152 24.8298 16.629C24.8522 16.4895 24.88 16.4616 25.0195 16.4561C25.6332 16.4505 26.258 16.4505 26.9386 16.4561C27.0948 16.4561 27.1227 16.484 27.145 16.6346C27.2287 17.2204 27.3068 17.8229 27.3849 18.47C27.424 18.8215 27.6081 19.0558 27.9484 19.1841C28.4282 19.3682 28.9135 19.569 29.4323 19.8033C29.7448 19.9428 30.0404 19.9149 30.2971 19.7085C30.7155 19.3794 31.1674 19.0335 31.7475 18.5816C31.9038 18.4589 31.9372 18.4644 32.0767 18.6039C32.5174 19.039 32.9526 19.4798 33.3766 19.9038C33.5104 20.0377 33.5216 20.0655 33.3933 20.2329L33.3375 20.3054C32.9916 20.7517 32.6402 21.2148 32.2831 21.6611C32.0655 21.9344 32.0321 22.2301 32.1883 22.5648C32.4226 23.0837 32.6234 23.5579 32.7908 24.0042C32.9247 24.3612 33.159 24.5453 33.5383 24.5844C34.1576 24.6513 34.7768 24.7406 35.3514 24.8187C35.5021 24.841 35.5244 24.8745 35.5244 25.0084C35.53 25.6667 35.53 26.3194 35.5244 26.9442C35.5244 27.0725 35.5021 27.1116 35.3459 27.1339C34.6374 27.2343 34.0572 27.3124 33.5328 27.3682C33.1646 27.424 32.9191 27.6192 32.7852 27.9707Z"
                                                        fill="black"/>
                                                    <path
                                                        d="M25.9955 21.2422C25.9899 21.2422 25.9899 21.2422 25.9844 21.2422C24.7291 21.2422 23.5409 21.7387 22.6371 22.6313C21.7333 23.5295 21.2368 24.7178 21.2368 25.9786C21.2368 27.2394 21.7277 28.4333 22.6259 29.3314C23.5241 30.2352 24.7124 30.7317 25.9732 30.7373C25.9788 30.7373 25.9788 30.7373 25.9844 30.7373C27.2396 30.7373 28.4279 30.2408 29.3316 29.3482C30.2354 28.45 30.7319 27.2561 30.7375 25.9953C30.7375 24.7345 30.2466 23.5407 29.3484 22.6425C28.4502 21.7387 27.2619 21.2422 25.9955 21.2422ZM29.2703 25.9953C29.2703 26.8768 28.93 27.6969 28.3051 28.3161C27.6859 28.9353 26.8602 29.2701 25.9788 29.2701C25.9732 29.2701 25.9676 29.2701 25.9676 29.2701C24.1657 29.2645 22.704 27.7805 22.704 25.9674C22.7096 24.1655 24.1824 22.7038 25.9899 22.7038H25.9955C27.8086 22.7094 29.2759 24.1878 29.2703 25.9953Z"
                                                        fill="black"/>
                                                </svg>
                                            </Link>
                                        </button>
                                    </li>
                                ) : null}
                            </ul>


                        </div>
                    ) : null}

                </div>
            </nav>
        )
    }
}

const init = state => ({
    init: state.init,
});


export default connect(init, null)(withRouter(Header))
