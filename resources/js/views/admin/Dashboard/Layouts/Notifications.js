import React, {Component} from 'react'
import {connect} from "react-redux";
import styles from './Sidebard.module.css';
import * as Sentry from "@sentry/react";
import {Load} from "../../../../components/Loadings/Load";


class Notifications extends Component {
    constructor(props) {
        super(props);
        this.state = {
            notifications: [],
            unreadNotificationsCount: 0,
            skip: 0,
            disableLoadNotifications: false,
            notificationsLoading: false
        };
    }

    componentDidMount() {
        this.getUnreadNotificationsCount().then(data => {
            this.setState({
                unreadNotificationsCount: data.count
            });
        });
    }


    getUnreadNotificationsCount() {
        return new Promise((resolve, reject) => {
            axios.get(api_routes.admin.notifications.unreadCount()).then(response => {
                return response.data;
            }).then(json => {
                resolve(json);
            }).catch(error => {
                Sentry.captureException(error);
                reject(error)
            });
        });
    }

    getUserNotifications(more = false) {
        let data = {
            params: {
                skip: this.state.skip
            }
        };
        if (!more && this.state.skip == 0 && !this.state.notifications.length) {

            this.setState({
                notificationsLoading: true
            });
        }
        axios.get(api_routes.admin.notifications.getUserNotifications(), data).then(response => {
            this.setState({
                notificationsLoading: false
            });

            if (!more) {
                this.setState({
                    notifications: response.data.notifications
                })
            } else {

                this.setState({
                    notifications: [...this.state.notifications, ...response.data.notifications]
                });
                if (response.data.notifications.length) {
                    this.setState({
                        disableLoadNotifications: false
                    });
                }
            }
        }).catch(error => {
            console.log('error', error)
        });
    }

    readNotification(notificationId) {
        axios.post(api_routes.admin.notifications.readNotification(notificationId)).then(response => {
            if (response.data.success) {
                this.getUnreadNotificationsCount().then(data => {
                    this.setState({
                        unreadNotificationsCount: data.count,
                        notifications: [],
                        skip: 0,
                        disableLoadNotifications: false
                    });

                    this.getUserNotifications();
                });
            }
        }).catch(error => {
            console.log('error', error)
        });
    }


    scrollNotifications(e) {
        let _this = this;
        const bottom = e.target.scrollHeight - e.target.scrollTop - 2 <= e.target.clientHeight;
        if (bottom && !_this.state.disableLoadNotifications) {
            this.setState({
                skip: this.state.skip += 5,
                disableLoadNotifications: true
            }, () => {
                _this.getUserNotifications(true)
            })
        }

    }

    markAllRead() {
        axios.post(api_routes.admin.notifications.readAllNotifications()).then(response => {
            if (response.data.success) {
                this.getUnreadNotificationsCount().then(data => {
                    this.setState({
                        unreadNotificationsCount: data.count,
                        notifications: [],
                        skip: 0,
                        disableLoadNotifications: false
                    });

                    this.getUserNotifications();
                });
            }
        }).catch(error => {
            console.log('error', error)
        });
    }

    render() {
        return (
            <div className={`dropdown dropleft `}>
                <button className="ml-1 bg-transparent p-0 m-0 d-inline" type="button"
                        id="notifications" data-toggle="dropdown"
                        aria-haspopup="true"
                        onClick={() => this.getUserNotifications()}
                        aria-expanded="false">
                    {this.state.unreadNotificationsCount > 0 ? (
                        <span className="fa-stack color-dark-blue" data-count={this.state.unreadNotificationsCount}>
                            <i className="fa fa-circle fa-stack-2x"/>
                            <i className="fa fa-bell fa-stack-1x fa-inverse"/>
                        </span>
                    ) : (
                        <span className="fa-stack color-dark-blue">
                            <i className="fa fa-circle fa-stack-2x"/>
                            <i className="fa fa-bell fa-stack-1x fa-inverse"/>
                        </span>
                    )}

                </button>

                <div className={`dropdown-menu ${styles.notificationsBlock} p-0`}
                     onClick={(e) => e.stopPropagation()}
                     onScroll={(e) => this.scrollNotifications(e)}

                     aria-labelledby="notifications">
                    {!this.state.notificationsLoading && this.state.notifications.length ? (
                        <div className="dropdown-item text-wrap text-center bg-light">
                            <a href="#" role={'button'} onClick={() => this.markAllRead()}>
                                Mark all as read
                            </a>
                        </div>
                    ) : null}


                    {!this.state.notificationsLoading ? (
                        this.state.notifications.length ? (

                            this.state.notifications.map(function (notification, index) {
                                return (
                                    <div className="dropdown-item text-wrap" key={index}>

                                        {notification.type === 'App\\Notifications\\TimestampExpired' &&
                                        <div className={' flex align-items-center align-middle'}>
                                            <div className="pr-3 pl-2">
                                                <i className="fa fa-exclamation-triangle fa-2x text-warning"
                                                   aria-hidden="true"/>
                                            </div>
                                            <div>
                                                <div>
                                                    {notification.data.text}
                                                </div>
                                                <small
                                                    className="text-warning">{moment(notification.created_at).format('DD/MM/YY HH:mm')}</small>
                                            </div>
                                            <div className={'pl-3'}>
                                                <a href="#"
                                                   onClick={() => this.readNotification(notification.id)}
                                                   role={'button'}>
                                                    <i className={'fa fa-times'}/>
                                                </a>
                                            </div>
                                        </div>
                                        }

                                        {notification.type === 'App\\Notifications\\CubeOfflineWithPermit' &&
                                        <div className={' flex align-items-center align-middle'}>
                                            <div className="pr-3 pl-3">
                                                <i className="fa fa-times fa-2x text-danger"
                                                   aria-hidden="true"/>
                                            </div>
                                            <div>
                                                <div>
                                                    {notification.data.text} is offline and requested a permit token
                                                    in last hour
                                                </div>
                                                <small
                                                    className="text-warning">{moment(notification.created_at).format('DD/MM/YY HH:mm')}</small>
                                            </div>
                                            <div className={'pl-3'}>
                                                <a href="#"
                                                   onClick={() => this.readNotification(notification.id)}
                                                   role={'button'}>
                                                    <i className={'fa fa-times'}/>
                                                </a>
                                            </div>
                                        </div>
                                        }

                                    </div>
                                )
                            }, this)
                        ) : (
                            <div className="dropdown-item text-wrap">
                                <p className={'text-center mt-2'}>No notifications </p>
                            </div>
                        )

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

const init = state => ({
    init: state.init,
});


export default connect(init, null)(Notifications)

