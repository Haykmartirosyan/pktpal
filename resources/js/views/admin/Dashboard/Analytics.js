import React, {Component} from "react";
import AdminHeader from "./Layouts/Header";
import {Link} from "react-router-dom";
import {Line} from "react-chartjs-2";
import moment from "moment";
import * as Sentry from "@sentry/react";
import {Load} from "../../../components/Loadings/Load";


class Analytics extends Component {
    constructor(props) {
        super(props);
        this.state = {
            offlineFilterTypes: [
                {
                    key: "Offline for more than a week",
                    value: "more_than_a_week"
                },
                {
                    key: "Offline for more than two weeks",
                    value: "more_than_two_weeks"
                },
                {
                    key: "Offline for a month",
                    value: "a_month"
                },
                {
                    key: "Offline for more than a month",
                    value: "more_than_a_month"
                },
                {
                    key: "Never online",
                    value: "never_online"
                },
            ],
            chartHeight: window.innerWidth <= 576 ? 250 : 80,
            LineData: {
                labels: [],
                datasets: [
                    {
                        label: 'offline devices',
                        data: [],
                        fill: true,
                        backgroundColor: "rgba(18, 150, 235, 0.18)",
                        borderColor: "#1296EB",
                        tension: 0.4
                    },
                ],
            },
            onlineServices: [],
            showLoadingOnline: true,
            showLoadingOffline: true,
            showLoadingOfflineByHours: true,
        }
    }

    componentDidMount() {
        let _this = this;
        _this.mountComponent()
        push.subscribe('get-online-devices').bind('App\\Events\\GetOnlineServices', function (data) {
            console.log('online', data);
            if (data.data.length) {
                _this.setState({
                    onlineServices: data.data
                })
            }
            _this.setState({
                showLoadingOnline: false
            })

        });
    }


    mountComponent() {
        let _this = this;
        _this.getOfflineServices().then((json) => {
            _this.state.offlineFilterTypes.map(item => {
                let found = json.data.offlineCounts.find(elem => elem.type == item.value)
                item.count = found.count
            })
            _this.setState({
                offlineFilterTypes: _this.state.offlineFilterTypes,
                showLoadingOffline: false
            })
        })
        _this.generateLineData();
        _this.getOnlineServices()

    }

    generateLineData() {
        let _this = this;
        _this.state.LineData.labels = [];
        for (let i = 0; i < 24; i++) {
            let hour = moment().startOf('hours').subtract(i, 'hours').format('HH:mm');
            _this.state.LineData.labels.push(hour);
        }
        _this.state.LineData.labels.reverse();
        _this.getOfflineByHours().then((json) => {
            if (json.data.data.length) {
                _this.state.LineData.datasets[0].data = [];
                let found
                _this.state.LineData.labels.map(async function (elem) {
                    found = json.data.data.find(item => elem === moment(item.time).utc(true).local().startOf('hours').format('HH:mm'));
                    _this.state.LineData.datasets[0].data.push(found ? found.count : 0)
                });
            }
            _this.setState({
                showLoadingOfflineByHours: false
            })
        })
    }

    getOnlineServices() {
        return new Promise((resolve, reject) => {
            axios.get(api_routes.admin.dashboard.onlineServices()).then(response => {
                return response;
            }).then(json => {
                resolve(json);
            }).catch(error => {
                reject(error)
            });
        });
    }

    getOfflineServices() {
        let types = this.state.offlineFilterTypes.map(elem => {
            return elem.value
        })
        return new Promise((resolve, reject) => {
            let data = {
                params: {
                    types: types
                }
            };
            axios.get(api_routes.admin.dashboard.offlineServices(), data).then(response => {
                return response;
            }).then(json => {
                resolve(json);
            }).catch(error => {
                reject(error)
            });
        });
    }

    getOfflineByHours() {
        return new Promise((resolve, reject) => {
            axios.get(api_routes.admin.dashboard.offlineByHours()).then(response => {
                return response;
            }).then(json => {
                resolve(json);
            }).catch(error => {
                Sentry.captureException(error);
                reject(error)
            });
        });
    }


    render() {
        return (
            <div>
                <AdminHeader/>
                <div className={`container`}>
                    <div className={`row mt-5`}>
                        <div className={`col-12 col-md-7`}>
                            <div className={`border radius-8 p-4`}>
                                <p className={`text-secondary`}>Online general information</p>
                                {!this.state.showLoadingOnline ?
                                    this.state.onlineServices.map((service, key) => {
                                            return (
                                                <div key={key}
                                                     className={`flex justify-content-between align-items-center bg-light radius-8 p-3 my-2 text-capitalize`}>
                                                    <p className={`mb-0`}>{service.level}</p>
                                                    <p className={`mb-0`}>{service.count}</p>
                                                </div>
                                            )
                                        }
                                    ) : (
                                        <Load/>
                                    )}
                            </div>
                        </div>
                        <div className={`col-12 col-md-5`}>
                            <div className={`border radius-8 p-4`}>
                                <p className={`text-secondary`}>Offline general information</p>
                                {!this.state.showLoadingOffline ?
                                    this.state.offlineFilterTypes.map((type, key) => {
                                        return (
                                            <div key={key}
                                                 className={`flex justify-content-between align-items-center bg-light radius-8 p-3 my-2`}>
                                                <Link to={`/admin/dashboard?type=` + type.value}
                                                      className={`text-black`}>{type.key}</Link>
                                                <Link to={`/admin/dashboard?type=` + type.value}
                                                      className={`text-black`}>{type.count}</Link>
                                            </div>
                                        )
                                    }) : (
                                        <Load/>
                                    )}

                            </div>
                        </div>

                        <div className={`col-12 mt-5`}>
                            <div className={`border radius-8 p-4`}>
                                <p className={`text-secondary`}>Cubes offline for a day</p>
                                {!this.state.showLoadingOfflineByHours ? (
                                    <div>
                                        <Line type="area" height={this.state.chartHeight}
                                              data={this.state.LineData}
                                              options={
                                                  {
                                                      plugins: {
                                                          legend: {
                                                              display: false,
                                                          },
                                                      }
                                                  }
                                              }/>
                                    </div>
                                ) : (
                                    <Load/>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default Analytics