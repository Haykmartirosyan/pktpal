import React, {Component} from "react";
import styles from "../../views/user/Dashboard/Pkt/Statisctics.module.scss";
import DatePicker from "react-datepicker";
import {Line} from "react-chartjs-2";
import moment from "moment";
import * as Sentry from "@sentry/react";
import {Load} from "../Loadings/Load";

class ServiceEncryption extends Component {
    constructor(props) {
        super(props);
        this.state = {
            serviceId: props.serviceId,
            fromPage: props.fromPage,
            chartHeight: window.innerWidth <= 576 ? 250 : 80,
            LineData: {
                labels: [],
                datasets: [
                    {
                        label: 'Encryption per second',
                        data: [],
                        fill: true,
                        backgroundColor: "rgba(18, 150, 235, 0.18)",
                        borderColor: "#1296EB",
                        tension: 0.4
                    },
                ],
            },
            calendarKey: Math.random(),
            datePickerIsOpen: false,
            filterDate: '',
            showLoading: true,
        }
    }

    componentDidMount() {
        let _this = this;
        _this.generateData()
    }

    generateData() {
        let _this = this;
        if (_this.state.filterDate === '' || moment(_this.state.filterDate).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')) {
            _this.state.LineData.labels = [];
            for (let i = 0; i < 24; i++) {
                let hour = moment().startOf('hours').subtract(i, 'hours').format('HH:mm');
                _this.state.LineData.labels.push(hour);
            }
            _this.state.LineData.labels.reverse();

            _this.getEncryptions().then((json) => {
                let found;
                _this.state.LineData.datasets[0].data = [];
                let generateDayData = async () => {
                    let promises = _this.state.LineData.labels.map(async function (elem) {
                        found = json.data.data.find(item => elem === moment(item.created_at).startOf('hours').format('HH:mm')
                            && moment().diff(moment(item.created_at), 'hours') <= 24);
                        _this.state.LineData.datasets[0].data.push(found ? found.encryptions_per_second.replace(/[^0-9\.]+/g, "") : 0)
                    });
                    return Promise.all(promises)
                };
                generateDayData().then(() => {
                    _this.setState({
                        calendarKey: Math.random()
                    })
                });
                _this.setState({
                    showLoading: false
                })
            }).catch(e => {
                Sentry.captureException(e);
                return this.props.props.history.push('/404');
            })
        } else {
            _this.state.LineData.labels = [];
            for (let i = 0; i < 24; i++) {
                let hour = moment(_this.state.filterDate).startOf('day').add(i, 'hours').format('HH:mm');
                _this.state.LineData.labels.push(hour);
            }
            _this.getEncryptions().then((json) => {
                let found;
                _this.state.LineData.datasets[0].data = [];
                let generateDayData = async () => {
                    let promises = _this.state.LineData.labels.map(async function (elem) {
                        found = json.data.data.find(item => elem === moment(item.created_at).utc(false).startOf('hours').format('HH:mm')
                            && moment(_this.state.filterDate).format('YYYY-MM-DD') === moment(item.created_at).utc(false).format('YYYY-MM-DD'));
                        _this.state.LineData.datasets[0].data.push(found ? found.encryptions_per_second.replace(/[^0-9\.]+/g, "") : 0)
                    });
                    return Promise.all(promises)
                };
                generateDayData().then(() => {
                    _this.setState({
                        calendarKey: Math.random()
                    })
                });
                _this.setState({
                    showLoading: false
                })
            }).catch(e => {
                Sentry.captureException(e);
                return this.props.props.history.push('/404');
            })

        }
    }

    getEncryptions() {
        let data = {
            params: {
                fromPage: this.state.fromPage,
                period: this.state.filterDate !== '' ? moment(this.state.filterDate).format('YYYY-MM-DD HH:mm:ss') : moment().utc(false).format('YYYY-MM-DD HH:mm:ss'),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
        };
        return new Promise((resolve, reject) => {
            axios.get(api_routes.user.pktServiceEncryptions(this.state.serviceId), data).then(response => {
                return response;
            }).then(json => {
                resolve(json);
            }).catch(error => {
                Sentry.captureException(error);
                reject(error)
            });
        });
    }

    handleClick() {
        this.setState({
            datePickerIsOpen: !this.state.datePickerIsOpen
        })
    }

    handleDateChange(date) {
        this.setState({
            filterDate: date,
            datePickerIsOpen: !this.state.datePickerIsOpen
        }, () => {
            this.generateData()
        })
    }


    render() {
        return (
            <div className={`container`}>
                <div className={`row`}>
                    <div className={`col-12 mt-3`}>
                        <h4 className={`font-weight-bold text-center`}>Encryptions per second statistics</h4>
                        {!this.state.showLoading ? (
                            <div>
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
                                            calendarClassName={`position-absolute`}
                                            inline
                                            onChange={(date) => this.handleDateChange(date)}/>
                                    ) : null}

                                </div>
                                <div>
                                    <Line key={this.state.calendarKey} type="area" height={this.state.chartHeight}
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
                            </div>


                        ) : (
                            <Load/>
                        )}
                    </div>

                </div>

            </div>
        )
    }

}

export default ServiceEncryption