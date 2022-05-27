import React, {Component} from "react";
import AdminHeader from "./Layouts/Header";
import Switch from "react-switch";
import {List, arrayMove} from 'react-movable';
import {handleShutDownHelper} from "../../Helpers/AdminHelpers";
import NotificationSystem from 'react-notification-system';
import * as Sentry from "@sentry/react";
import {Load} from "../../../components/Loadings/Load";

class Orders extends Component {
    notificationSystem = React.createRef();

    constructor(props) {
        super(props);
        this.state = {
            orders: [],
            services: [],
            skipServices: 0,
            skipOrders: 0,
            loadMoreLoadingServices: false,
            loadMoreLoadingOrders: false,
            showMoreButtonServices: false,
            showMoreButtonOrders: false,
            assignedDevices: [],
            shutDownDeviceId: '',
            shutDownLoad: false,
            disableSaveButton: false,
            searchQueryOrder: '',
            typing: false,
            typingTimeout: 0,
            searchQueryService: '',
            ordersLoading: true,
            servicesLoading: true,
            unassignedOrders: []
        };
        this.handleSearchQuery = this.handleSearchQuery.bind(this);
        this.handleSearchLength = this.handleSearchLength.bind(this)
    }

    componentDidMount() {
        let _this = this;
        _this.getUnassignedDevices();
        _this.getOrders();

        push.subscribe('result-shutdown').bind('App\\Events\\ShutDownResultEvent', function (data) {
            if (data.id == _this.state.shutDownDeviceId) {
                _this.setState({
                    shutDownLoad: false,
                    shutDownDeviceId: '',
                })
            }
        });
    }

    loadMore(type) {
        if (type == 'services') {
            this.setState({
                skipServices: this.state.skipServices += 10,
                loadMoreLoadingServices: true
            }, () => {
                this.getUnassignedDevices()
            })
        } else if (type == 'orders') {
            this.setState({
                skipOrders: this.state.skipOrders += 10,
                loadMoreLoadingOrders: true
            }, () => {
                this.getOrders()
            })
        }
    }

    getUnassignedDevices() {
        let _this = this;
        let data = {
            params: {
                skip: this.state.skipServices,
                searchQuery: this.state.searchQueryService
            }
        };
        axios.get(api_routes.admin.dashboard.unassignedDevices(), data).then(response => {
            return response;
        }).then(json => {
            _this.setState({
                showMoreButtonServices: json.data.services.length < 10,
            });
            if (json.data.services.length) {
                json.data.services.forEach(function (elem) {
                    let service = {};
                    service.mac_address = elem.mac_address;
                    service.wallet_address = elem.wallet_address;
                    service.id = elem.id;
                    service.online = elem.online;
                    service.freeze = elem.freeze;
                    service.shut_down = elem.shut_down;
                    _this.state.services.push(service);
                    service.index = _this.state.services.indexOf(service)
                });
                _this.setState({
                    services: _this.state.services,
                    loadMoreLoadingServices: false,
                    servicesLoading: false
                })
            } else {
                _this.setState({
                    loadMoreLoadingServices: false,
                    servicesLoading: false
                })
            }

            if (_this.state.unassignedOrders.length) {
                _this.handleUnassignedOrdersIndexes();

            }
        }).catch(error => {
            Sentry.captureException(error);
            console.log(error)
        })
    }

    getOrders() {
        let _this = this;
        let data = {
            params: {
                skip: _this.state.skipOrders,
                searchQuery: _this.state.searchQueryOrder
            }
        };
        axios.get(api_routes.admin.dashboard.orders(), data).then(response => {
            return response;
        }).then(json => {
            _this.setState({
                showMoreButtonOrders: json.data.orders.length < 10,
            });
            if (json.data.orders.length) {
                let newOrders = _this.fillOrders(json.data.orders).map((item, index) => (
                    {
                        ...item,
                        index: index
                    }
                ));
                let newArray = [..._this.state.orders, ...newOrders];

                _this.setState({
                    orders: newArray,
                    loadMoreLoadingOrders: false,
                    ordersLoading: false
                })
            } else {
                _this.setState({
                    loadMoreLoadingOrders: false,
                    ordersLoading: false
                })
            }
        }).catch(error => {
            if (error.response.status === 422) {
                this.addNotification(error.response.data.message, 'error')
            }
            Sentry.captureException(error);
            console.log(error)
        })
    }

    fillOrders(orders) {
        let newOrders = [];
        orders.forEach(function (item) {
            let itemArray = Array(parseInt(item.qty_unassigned ? item.qty_unassigned : item.qty)).fill(item);
            newOrders = newOrders.concat(itemArray);
        });
        return newOrders
    }

    handleShutDown(checked, id) {
        handleShutDownHelper(checked, id).then(json => {
            if (json.data.success) {
                this.setState({
                    shutDownLoad: true,
                    shutDownDeviceId: id,
                })
            }
        }).catch((error) => {
            Sentry.captureException(error);
            console.log(error)
        });
    }

    handleDragServices(oldIndex, newIndex) {
        let sortedServices = arrayMove(this.state.services, oldIndex, newIndex);
        sortedServices.forEach((elem, index) =>
            elem.index = index
        );
        this.setState({
            services: sortedServices
        })
        this.handleIndexes()
    }

    handleDragOrders(oldIndex, newIndex) {
        let sortedOrders = arrayMove(this.state.orders, oldIndex, newIndex);
        sortedOrders.forEach((elem, index) =>
            elem.index = index
        );
        this.setState({
            orders: sortedOrders
        })
        this.handleIndexes()

    }

    handleIndexes() {
        let _this = this
        _this.state.assignedDevices.map(function (elem) {
            let foundService = _this.state.services.find(item => item.index === elem.order_index)
            let foundOrder = _this.state.orders.find(item => item.index === elem.order_index)
            elem.user_id = foundOrder.user_id
            elem.order_id = foundOrder.order_id
            elem.mac_address = foundService.mac_address
            elem.quantity = foundOrder.qty
            elem.user_email = foundOrder.email

        })
        _this.setState({
            assignedDevices: _this.state.assignedDevices
        })
    }

    handleUnassignedOrdersIndexes() {
        let _this = this

        let result = []
        _this.state.unassignedOrders.map(function (elem) {
            let foundService = _this.state.services.find(item => item.index === elem)
            let foundOrder = _this.state.orders.find(item => item.index === elem)

            let assignedDevices = {
                user_id: foundOrder.user_id,
                order_id: foundOrder.order_id,
                mac_address: foundService.mac_address,
                quantity: foundOrder.qty,
                user_email: foundOrder.email,
                order_index: elem
            }

            result.push(assignedDevices);
        })

        let assignedDevices = _this.state.assignedDevices.concat(result);

        _this.setState({
            assignedDevices: assignedDevices
        })
    }

    assignService(order, index) {
        let found = this.state.services.find(service => service.index == index);
        if (found) {
            let assignedDevice = {
                user_id: order.user_id,
                order_id: order.order_id,
                mac_address: found.mac_address,
                quantity: order.qty,
                user_email: order.email,
                order_index: index
            };
            if (this.state.assignedDevices.some(assigned =>
                assigned.mac_address === assignedDevice.mac_address
            )) {
                let index = this.state.assignedDevices.findIndex(device => {
                    return device.mac_address === assignedDevice.mac_address
                });
                this.state.assignedDevices.splice(index, 1);
                this.setState({
                    assignedDevices: this.state.assignedDevices
                })
            } else {
                this.state.assignedDevices.push(assignedDevice);
                this.setState({
                    assignedDevices: this.state.assignedDevices
                })
            }
        } else {
            let foundIndex = this.state.unassignedOrders.findIndex(unassignedOrder => unassignedOrder === index);
            if (foundIndex > -1) {
                this.state.unassignedOrders.splice(foundIndex, 1)
            } else {
                this.state.unassignedOrders.push(index)
            }
            let unique = [...new Set(this.state.unassignedOrders)];
            this.setState({
                unassignedOrders: unique
            })
        }
    }

    assignServices() {
        let _this = this;

        this.setState({
            disableSaveButton: true
        });

        let ordersArray = [];
        let assignedCountData = async () => {
            let promises = _this.state.assignedDevices.map(async elem => {
                let found = ordersArray.find(item => item.order_id == elem.order_id);
                if (found) {
                    found.count++
                } else {
                    ordersArray.push({count: 1, order_id: elem.order_id})
                }
            });

            _this.state.assignedDevices.map(async device => {
                let found = ordersArray.find(elem => elem.order_id == device.order_id);
                device.qty_assigned = found.count
            });

            return Promise.all(promises)
        };
        assignedCountData().then(() => {
            _this.assignAllServices().then((json) => {
                if (json.data.success) {
                    return _this.props.history.push('/admin/dashboard')
                }
                _this.setState({
                    disableSaveButton: false
                })
            }).catch(error => {
                Sentry.captureException(error);
                console.log(error)
            })
        })
    }

    assignAllServices() {
        return new Promise((resolve, reject) => {
            axios.post(api_routes.admin.dashboard.assignDevices(), this.state.assignedDevices).then(response => {
                return response;
            }).then(json => {
                resolve(json);
            }).catch(error => {
                Sentry.captureException(error);
                reject(error)
            });
        })
    }

    handleSearchLength(e, type) {
        if (type == 'order') {
            this.setState({
                searchQueryOrder: e.target.value,
            })
        } else {
            this.setState({
                searchQueryService: e.target.value
            })
        }
    }

    handleSearchQuery(e, type) {
        let _this = this;
        if (_this.state.typingTimeout) {
            clearTimeout(_this.state.typingTimeout);
        }
        if (type == 'order') {
            if ((e.key === 'Enter' && _this.state.searchQueryOrder.length > 2) || ((e.key === 'Backspace' || e.key === 'Delete') && _this.state.searchQueryOrder.length === 1)) {
                _this.setState({
                    typing: false,
                    typingTimeout: setTimeout(function () {
                        _this.setState({
                            skipOrders: 0,
                            orders: [],
                            ordersLoading: true
                        }, () => {
                            _this.getOrders();
                        })
                    }, 1000)
                });
            }
        } else {
            if ((e.key === 'Enter' && _this.state.searchQueryService.length > 2) || ((e.key === 'Backspace' || e.key === 'Delete') && _this.state.searchQueryService.length === 1)) {
                _this.setState({
                    typing: false,
                    typingTimeout: setTimeout(function () {
                        _this.setState({
                            skipServices: 0,
                            services: [],
                            servicesLoading: true
                        }, () => {
                            _this.getUnassignedDevices();
                        })
                    }, 1000)
                });
            }
        }
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
    }

    render() {
        return (
            <div>
                <AdminHeader/>
                <div className={`container mt-5`}>
                    <div className={`row`}>
                        <div className={`col-5`}>
                            <div className={`container`}>
                                <input type="text"
                                       placeholder={'Search'}
                                       defaultValue={this.state.searchQueryOrder}
                                       onChange={(e) => this.handleSearchLength(e, 'order')}
                                       onKeyDown={(e) => this.handleSearchQuery(e, 'order')}
                                       className={`p-2 mb-4 col-12 radius-5 bg-white border w-75`}/>
                                {!this.state.ordersLoading ? (
                                    this.state.orders.length ? (
                                        <div>
                                            <div className={`row`}>
                                                <p className={`col-1`}></p>
                                                <p className={`col-3 pr-0`}>Order number</p>
                                                <p className={`col-8`}>Customer's name</p>
                                            </div>
                                            <List
                                                values={this.state.orders}
                                                onChange={({oldIndex, newIndex}) =>
                                                    this.handleDragOrders(oldIndex, newIndex)
                                                }
                                                renderList={({children, props}) => <div {...props}
                                                                                        className={`row`}>{children}</div>}
                                                renderItem={({value, props}) => <div {...props}
                                                                                     className={`col-12 my-2 flex bg-light radius-8`}>
                                                    <input type={`checkbox`}
                                                           className={`largeCheckbox col-1 p-3 my-auto`}
                                                           onChange={() => this.assignService(value, value.index)}/>
                                                    <div className={`col-3 p-3`}>#{value.order_id}</div>
                                                    <div
                                                        className={`col-8 p-3`}>{value.first_name} {value.last_name}</div>
                                                </div>}
                                            />
                                            {!this.state.showMoreButtonOrders ? (
                                                <div className={`text-center`}>
                                                    <button
                                                        className={`bg-transparent ${this.state.loadMoreLoadingOrders ? 'disabled' : ''}`}
                                                        disabled={!!this.state.loadMoreLoadingOrders}
                                                        onClick={() => this.loadMore('orders')}>
                                                        <u>
                                                            Load more
                                                        </u>
                                                        {this.state.loadMoreLoadingOrders ? (
                                                            <div
                                                                className="spinner-border spinner-border-sm font-14 ml-2"
                                                                role="status">
                                                            </div>) : null}
                                                    </button>
                                                </div>
                                            ) : null}
                                        </div>
                                    ) : (
                                        <h5 className={`text-center w-75`}>No orders</h5>
                                    )
                                ) : (
                                    <Load/>
                                )}
                            </div>
                        </div>
                        <div className={`col-7`}>
                            <div className={`container`}>
                                <input type="text"
                                       placeholder={'Search'}
                                       defaultValue={this.state.searchQueryService}
                                       onChange={(e) => this.handleSearchLength(e, 'service')}
                                       onKeyDown={(e) => this.handleSearchQuery(e, 'service')}
                                       className={`p-2 mb-4 col-12 radius-5 bg-white border w-50`}/>
                                {!this.state.servicesLoading ? (
                                    this.state.services.length ? (
                                        <div>
                                            <div className={`row`}>
                                                <p className={`col-3`}>MAC Address</p>
                                                <p className={`col-8`}>Wallet address</p>
                                                <p className={`col-1`}></p>
                                            </div>

                                            <List
                                                values={this.state.services}
                                                onChange={({oldIndex, newIndex}) =>
                                                    this.handleDragServices(oldIndex, newIndex)
                                                }
                                                renderList={({children, props}) => <div {...props}
                                                                                        className={`row`}>{children}</div>}
                                                renderItem={({value, props}) => <div {...props}
                                                                                     className={`col-12 my-2 flex bg-light radius-8`}>
                                                    <div className={`col-3 p-3`}>{value.mac_address}</div>
                                                    <div className={`col-8 p-3`}>{value.wallet_address}</div>
                                                    <div className={`col-1 p-3`}>
                                                        {!this.state.shutDownLoad && !this.state.shutDownDeviceId
                                                        || (this.state.shutDownDeviceId !== value.id) ? (
                                                            <Switch
                                                                onChange={e => this.handleShutDown(e, value.id)}
                                                                disabled={!value.online || value.freeze === 1}
                                                                onColor={'#023DB5'}
                                                                checkedIcon={false}
                                                                uncheckedIcon={false}
                                                                width={38}
                                                                height={22}
                                                                checked={!value.shut_down}
                                                                className={`d-block`}/>
                                                        ) : (
                                                            <div
                                                                className="spinner-border spinner-border-sm color-dark-blue mr-3 mt-2"
                                                                role="status">
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>}
                                            />
                                            {!this.state.showMoreButtonServices ? (
                                                <div className={`text-center`}>
                                                    <button
                                                        className={`bg-transparent ${this.state.loadMoreLoadingServices ? 'disabled' : ''}`}
                                                        disabled={!!this.state.loadMoreLoadingServices}
                                                        onClick={() => this.loadMore('services')}>
                                                        <u>
                                                            Load more
                                                        </u>
                                                        {this.state.loadMoreLoadingServices ? (
                                                            <div
                                                                className="spinner-border spinner-border-sm font-14 ml-2"
                                                                role="status">
                                                            </div>) : null}
                                                    </button>
                                                </div>
                                            ) : null}
                                        </div>
                                    ) : (
                                        <h5 className={`text-center w-50`}>No services</h5>
                                    )

                                ) : (
                                    <Load/>
                                )}

                            </div>

                        </div>
                        <div>

                        </div>
                        <button className={`btn background-dark-blue text-white ml-auto my-5
                        ${this.state.disableSaveButton || this.state.assignedDevices.length == 0 ? 'disabled' : " "}`}
                                disabled={this.state.disableSaveButton || this.state.assignedDevices.length == 0}
                                onClick={() => this.assignServices()}>
                            Assign the cubes
                            {this.state.disableSaveButton ? (
                                <div className="spinner-border spinner-border-sm font-14 ml-2"
                                     role="status">
                                </div>) : null}
                        </button>
                    </div>
                </div>
                <NotificationSystem ref={this.notificationSystem}/>
            </div>
        )
    }
}

export default Orders
