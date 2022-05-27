import React, {Component} from "react";
import AdminHeader from "./Layouts/Header";
import moment from "moment";
import ShowLog from "./Modals/ShowLog";
import {showLogMore} from "../../Helpers/AdminHelpers";
import {Load} from "../../../components/Loadings/Load";
import NotificationSystem from 'react-notification-system';
import Multiselect from 'multiselect-react-dropdown';
import {miningLevels} from "../../Helpers/SettingsHelpers";
import * as Sentry from "@sentry/react";


class Settings extends Component {
    notificationSystem = React.createRef();

    constructor(props) {
        super(props);
        this.state = {
            permitsNoTokenAlerts: [],
            disableLoadPermitsNoTokenAlerts: false,
            disabledButton: false,
            loadMoreLoading: false,
            enablingPermitsNoTokenAlerts: false,
            skip: 0,
            showLoading: true,
            pools: [],
            savePoolsLoading: false,
            allPools: [],
            selectKey: Math.random(),
            recommendedPoolsRates: [],
            poolsStatistics: [],
            disabledStatisticsButton: true,
            calendarKey: Math.random(),
            statisticsLoading: false
        }
    }

    componentDidMount() {
        let _this = this;

        _this.getRecommendedPools().then((res) => {
            _this.getPools(res)
        });

        _this.getRecommendedPoolsRates().then((response) => {
            response.recommendedPoolsRates.forEach(function (elem) {
                    elem.recommended_pools = JSON.parse(elem.recommended_pools);
                    elem.rates = JSON.parse(elem.rates);
                    elem.yields = JSON.parse(elem.yields);
                }
            );

            _this.setState({
                recommendedPoolsRates: response.recommendedPoolsRates
            })
        })

        _this.getPermitsNoTokenAlerts().then((response) => {
            if (!response.data.length || response.data.length < 10) {
                _this.setState({
                    disableLoadPermitsNoTokenAlerts: true
                })
            }
            _this.setState({
                permitsNoTokenAlerts: response.data,
                showLoading: false
            })
        })
    }

    getPools(response) {
        let _this = this;
        if (response.pools?.length) {
            response.pools.forEach(function (elem) {
                    elem.pools = JSON.parse(elem.pools);
                    elem.selectedPools = []
                    elem.pools.forEach(function (item) {
                        elem.selectedPools.push({pool: item})
                    })
                }
            );
        }

        if (response.allPools?.pools?.length) {
            let allPools = JSON.parse(response.allPools.pools)
            allPools.forEach(function (item) {
                _this.state.allPools.push({pool: item})
            })
        }

        _this.setState({
            pools: response.pools,
            showLoading: false,
            allPools: _this.state.allPools.length ? _this.makeArrayUnique(_this.state.allPools) : []
        })
    }

    getPermitsNoTokenAlerts() {
        return new Promise((resolve, reject) => {
            let data = {
                params: {
                    skip: this.state.skip
                }
            };
            axios.get(api_routes.admin.dashboard.permitsNoTokenAlertsAll(), data).then(response => {
                return response.data;
            }).then(json => {
                resolve(json);
            }).catch(error => {
                Sentry.captureException(error);
                reject(error)
            });
        });
    }

    getRecommendedPools() {
        return new Promise((resolve, reject) => {
            axios.get(api_routes.admin.dashboard.recommendedPools()).then(response => {
                return response.data;
            }).then(json => {
                resolve(json);
            }).catch(error => {
                Sentry.captureException(error);
                reject(error)
            });
        });
    }

    getRecommendedPoolsRates() {
        return new Promise((resolve, reject) => {
            axios.get(api_routes.admin.dashboard.recommendedPoolsRates()).then(response => {
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
            skip: this.state.skip += 10,
            loadMoreLoading: true,
            disabledButton: true,
            enablingPermitsNoTokenAlerts: true,
        });
        this.getPermitsNoTokenAlerts().then(response => {
            if (!response.data.length || response.data.length < 10) {
                this.setState({
                    disableLoadPermitsNoTokenAlerts: true
                })
            }
            const result = [...this.state.permitsNoTokenAlerts, ...response.data];

            this.setState({
                permitsNoTokenAlerts: result,
                loadMoreLoading: false,
                disabledButton: false,
                enablingPermitsNoTokenAlerts: false,
            })
        });
    }

    handleChange(level, pools) {
        let found = this.state.pools.find(pool => {
            return pool.level == level
        });
        if (found) {
            found.pools = pools.map(item => item.pool)
            found.selectedPools = pools.map(item => item)

            this.setState({
                pools: this.state.pools,
            })
        }
    }

    saveChanges() {
        this.setState({
            savePoolsLoading: true
        })
        let valid = true;
        if (this.state.pools.length) {
            this.state.pools.forEach(elem => {
                if (elem.pools.length == 0) {
                    valid = false
                }
            })
        }

        if (!valid) {
            this.addNotification("Please select at least one pool", 'error');
            this.setState({
                savePoolsLoading: false
            })
        }
        if (valid) {
            let result = this.state.allPools.map(item => item.pool);
            let allPools = {
                level: 'all_pools',
                pools: result
            }
            let data = {
                pools: this.state.pools,
                allPools: allPools
            }
            this.savePools(data).then((response) => {
                if (response.data.success) {
                    this.getRecommendedPools().then((res) => {
                        this.getPools(res)
                    })
                }
                this.setState({
                    savePoolsLoading: false
                })
            }).catch(e => {
                Sentry.captureException(e);
                console.log(e)
                this.setState({
                    savePoolsLoading: false
                })
            })
        }
    }

    savePools(data) {
        return new Promise((resolve, reject) => {
            axios.post(api_routes.admin.dashboard.savePools(), data).then(response => {
                return response;
            }).then(json => {
                resolve(json);
            }).catch(error => {
                Sentry.captureException(error);
                reject(error)
            });
        });
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
    };

    addOption(e, pool) {
        if (e.charCode === 13) {
            if (this.isValidHttpUrl(e.target.value)) {
                let newPool = {pool: e.target.value}
                this.state.allPools.push(newPool)
                pool.pools.push(e.target.value)
                pool.pools = [...new Set(pool.pools)]

                pool.selectedPools.push(newPool)
                pool.selectedPools = this.makeArrayUnique(pool.selectedPools)

                this.setState({
                    allPools: this.makeArrayUnique(this.state.allPools),
                    pools: this.state.pools,
                    selectKey: Math.random()
                })
            } else {
                this.addNotification("Invalid pool", 'error');
            }
        }
    }

    isValidHttpUrl(string) {
        let pattern = new RegExp('^(http?:\\/\\/)?' +
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
            '((\\d{1,3}\\.){3}\\d{1,3}))' +
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
            '(\\?[;&a-z\\d%_.~+=-]*)?' +
            '(\\#[-a-z\\d_]*)?$', 'i');
        return !!pattern.test(string);
    }

    makeArrayUnique(pools) {
        return pools.filter((value, index) => {
            let _value = JSON.stringify(value);
            return index === pools.findIndex(obj => {
                return JSON.stringify(obj) === _value;
            });
        });
    }

    setRecommendedPools(e, pools) {
        let pool = {}
        pool.level = e.target.value
        pool.pools = pools
        this.state.poolsStatistics.push(pool)
        this.setState({
            poolsStatistics: this.state.poolsStatistics,
            disabledStatisticsButton: false
        })
    }

    saveStatistics() {
        let _this = this;
        if (_this.state.poolsStatistics.length) {
            _this.setState({
                statisticsLoading: true
            })
            let valueArr = _this.state.poolsStatistics.map(function (item) {
                return item.level
            });
            let isDuplicate = valueArr.some(function (item, idx) {
                return valueArr.indexOf(item) != idx
            });
            if (isDuplicate) {
                _this.addNotification("Please select different levels", 'error');

                _this.setState({
                    calendarKey: Math.random(),
                    poolsStatistics: [],
                    disabledStatisticsButton: true,
                    statisticsLoading: false
                })
            } else {
                _this.saveStatisticsPools(this.state.poolsStatistics).then((response) => {
                    if (response.data.success) {
                        _this.getRecommendedPools().then((res) => {
                            _this.getPools(res)
                        })
                    }
                    _this.setState({
                        statisticsLoading: false,
                        disabledStatisticsButton: true,
                        calendarKey: Math.random(),
                    })
                })
            }
        }
    }

    saveStatisticsPools(data) {
        return new Promise((resolve, reject) => {
            axios.post(api_routes.admin.dashboard.saveStatisticsPools(), data).then(response => {
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
                {!this.state.showLoading ? (
                        <div className={`container`}>
                            <div className={`row`}>
                                <div className={'col-sm-12 col-lg-12 mt-4 p-0 border radius-8 p-2'}>
                                    <h5 className={`text-center m-3`}>Recommended pools</h5>
                                    <div className={`container`}>
                                        <div className={`row p-2`}>
                                            {this.state.pools.length ?
                                                this.state.pools.map((pool, key) => {
                                                    return (
                                                        <div key={key}
                                                             className={`col-12 col-lg-3 flex flex-column justify-content-between text-center mt-3`}>
                                                            <p className={`text-capitalize`}>{pool.level}</p>
                                                            <Multiselect
                                                                options={this.state.allPools}
                                                                key={this.state.selectKey}
                                                                onKeyPressFn={(e) => this.addOption(e, pool)}
                                                                emptyRecordMsg={'Press ENTER to add a new pool'}
                                                                selectedValues={pool.selectedPools}
                                                                onSelect={(e) => this.handleChange(pool.level, e)}
                                                                onRemove={(e) => this.handleChange(pool.level, e)}
                                                                displayValue="pool"
                                                            />
                                                        </div>
                                                    )
                                                }) : null}
                                            <div className={`col-12 text-center mt-5`}>
                                                <button
                                                    className={`btn background-dark-blue radius-8 text-white py-2 px-4 ${this.state.savePoolsLoading ? 'disabled' : ''}`}
                                                    disabled={this.state.savePoolsLoading}
                                                    onClick={() => this.saveChanges()}>Save changes
                                                    {this.state.savePoolsLoading ? (
                                                        <div
                                                            className="spinner-border spinner-border-sm font-14 ml-2"
                                                            role="status">
                                                        </div>) : null}
                                                </button>
                                            </div>

                                        </div>
                                    </div>

                                </div>

                                <div className={'col-sm-12 col-lg-12 mt-4 p-0'}>
                                    <h5 className={`text-center m-4`}>Recommended pools rates</h5>
                                    <div>
                                        <table className={`table table-responsive table-bordered d-sm-table`}>
                                            <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Recommended pools</th>
                                                <th>Yields</th>
                                                <th>Goodrates</th>
                                                <th>Errors</th>
                                                <th>Mining level</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {this.state.recommendedPoolsRates.map((elem, index) => {
                                                return (
                                                    <tr key={index}>
                                                        <td className={`align-middle`}>{moment(elem.created_at).format("DD/MM/YYYY")}</td>
                                                        <td className={`align-middle`}>{elem.recommended_pools.map((item, key) => {
                                                            return (
                                                                <p key={key} className={`mb-0`}>{item}</p>
                                                            )
                                                        })}
                                                        </td>
                                                        <td className={`align-middle`}>{elem.yields.map((item, key) => {
                                                            return (
                                                                <p key={key} className={`mb-0`}>{item}</p>
                                                            )
                                                        })}
                                                        </td>
                                                        <td className={`align-middle`}>{elem.rates.map((item, key) => {
                                                            return (
                                                                <p key={key} className={`mb-0`}>{item}</p>
                                                            )
                                                        })}
                                                        </td>
                                                        <td className={`align-middle`}>
                                                            <a href="#" role={'button'}
                                                               className={'text-black'}
                                                               onClick={(e) => showLogMore(e, elem.errors, elem.created_at, 'Alert logs')}>
                                                                {elem.errors_count}
                                                            </a>
                                                        </td>
                                                        <td className={`align-middle`}>
                                                            <select
                                                                className={`bg-transparent p-2 text-capitalize w-100`}
                                                                key={this.state.calendarKey}
                                                                defaultValue={`Set level`}
                                                                onChange={(e) => this.setRecommendedPools(e, elem.recommended_pools)}>
                                                                <option disabled={true}>Set level</option>
                                                                {miningLevels.map((item, key) => {
                                                                    return (
                                                                        item.key !== 'off' ?
                                                                            <option key={key}>{item.key}</option>
                                                                            : null
                                                                    )
                                                                })}
                                                            </select>

                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                            </tbody>
                                        </table>
                                        <div className={`text-center`}>
                                            <button
                                                className={`btn background-dark-blue radius-8 text-white py-2 px-4 my-3                                    
                                            ${this.state.disabledStatisticsButton ? 'disabled' : ''}`}
                                                disabled={this.state.disabledStatisticsButton}
                                                onClick={() => this.saveStatistics()}>Save
                                                changes
                                                {this.state.statisticsLoading ? (
                                                    <div
                                                        className="spinner-border spinner-border-sm font-14 ml-2"
                                                        role="status">
                                                    </div>) : null}
                                            </button>
                                        </div>

                                    </div>
                                </div>

                                <div className={'col-sm-12 col-lg-12 mt-4 p-0 border radius-8 p-2'}>
                                    <h5 className={`text-center m-3`}>Permits no token alerts</h5>
                                    {this.state.permitsNoTokenAlerts.length ? (
                                            <div>
                                                <table
                                                    className={`table table-responsive table-borderless d-sm-table`}>
                                                    <thead>
                                                    <tr>
                                                        <th scope="col"
                                                            className={`font-weight-normal text-nowrap`}>Date
                                                        </th>
                                                        <th scope="col"
                                                            className={`font-weight-normal text-nowrap`}>Mac
                                                            address
                                                        </th>
                                                        <th scope="col"
                                                            className={`font-weight-normal text-nowrap`}>Description
                                                        </th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {this.state.permitsNoTokenAlerts.map((log, index) => {
                                                        return (
                                                            <tr key={index}
                                                                className={`background-gray`}>
                                                                <td className={`text-nowrap`}>
                                                                    {moment(log.created_at).utc(true).format('DD/MM/YY hh:mm:ss')}
                                                                </td>
                                                                <td className={`text-nowrap`}>
                                                                    {log.mac_address}
                                                                </td>
                                                                <td className={`text-break`}>
                                                                    <a href="#" role={'button'}
                                                                       className={'text-black'}
                                                                       onClick={(e) => showLogMore(e, ('Ip: ' + log.ip + " -> " + "Session: " + log.session + " -> " + "Good: " + log.good + " -> " + "Version_id: " + log.version_id), log.created_at, 'Permits no token alerts')}>
                                                                        {
                                                                            ('Ip: ' + log.ip + " , " + "Session: " + log.session + " , " + "Good: " + log.good + " , " + "Version_id: " + log.version_id).length > 120 ?
                                                                                ('Ip: ' + log.ip + " , " + "Session: " + log.session + " , " + "Good: " + log.good + " , " + "Version_id: " + log.version_id).substring(0, 120).toString() + '...'
                                                                                : ('Ip: ' + log.ip + " , " + "Session: " + log.session + " , " + "Good: " + log.good + " , " + "Version_id: " + log.version_id).toString()
                                                                        }
                                                                    </a>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}

                                                    </tbody>
                                                </table>

                                                {!this.state.disableLoadPermitsNoTokenAlerts ? (
                                                    <div className={`text-center mb-3`}>
                                                        <button
                                                            onClick={() => this.loadMore()}
                                                            className={`${this.state.disabledButton ? 'disabled' : null}  btn font-weight-bold  radius-0 background-black text-white `}
                                                            disabled={this.state.disabledButton}>
                                                            Load more
                                                            {this.state.loadMoreLoading && this.state.enablingPermitsNoTokenAlerts ? (
                                                                <div
                                                                    className="spinner-border spinner-border-sm font-14 ml-2"
                                                                    role="status">
                                                                </div>) : null}
                                                        </button>
                                                    </div>
                                                ) : null}
                                            </div>
                                        ) :
                                        (
                                            <h5 className={`text-center mt-5`}>No Permits no token
                                                alerts</h5>
                                        )}
                                </div>
                            </div>
                            <NotificationSystem ref={this.notificationSystem}/>
                        </div>
                    ) :
                    (
                        <Load/>
                    )
                }
                <ShowLog/>
            </div>
        )
    }
}

export default Settings
