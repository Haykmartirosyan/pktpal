import React, {Component} from "react";
import moment from "moment";
import {withRouter} from "react-router-dom";
import styles from "./Statisctics.module.scss";
import Header from "../../../../components/Header/Header";
import Footer from "../../../../components/Footer/Footer";
import {Load} from "../../../../components/Loadings/Load";
import * as Sentry from "@sentry/react";
import ServiceEncryption from "../../../../components/Encryption/ServiceEncryption";

class EncryptionDiagram extends Component {
    constructor(props) {
        super(props);
        this.state = {
            serviceId: props.match.params.id,
            offlineLogs: [],
            skipOfflineLogs: 0,
            disabledButton: false,
            loadMoreLogs: true,
            showLoading: true
        }
    }

    componentDidMount() {
        let _this = this;
        _this.getOfflineLogs().then(response => {
            if (!response.data.length || response.data.length < 5) {
                _this.setState({
                    loadMoreLogs: false
                })
            }
            _this.setState({
                offlineLogs: response.data,
                showLoading: false
            })
        }).catch(e => {
            console.log(e)
            Sentry.captureException(e);
            return this.props.history.push('/404');
        });
    }

    getOfflineLogs() {
        return new Promise((resolve, reject) => {
            let data = {
                params: {
                    skip: this.state.skipOfflineLogs
                }
            };
            axios.get(api_routes.user.offlineLogs(this.state.serviceId), data).then(response => {
                return response.data;
            }).then(json => {
                resolve(json);
            }).catch(error => {
                Sentry.captureException(error);
                reject(error)
            });
        });
    }

    loadMoreLogs() {
        this.setState({
            disabledButton: true,
            skipOfflineLogs: this.state.skipOfflineLogs += 5
        });
        this.getOfflineLogs().then(response => {
            if (!response.data.length || response.data.length < 5) {
                this.setState({
                    loadMoreLogs: false
                })
            }

            const result = [...this.state.offlineLogs, ...response.data];
            this.setState({
                offlineLogs: result,
                disabledButton: false
            })
        }).catch(e => {
            Sentry.captureException(e);
            console.log(e)
        });
    }


    render() {
        return (
            <div>
                <Header/>
                {!this.state.showLoading ? (

                    <div className={`container`}>
                        <div className={`row`}>
                            <ServiceEncryption serviceId={this.state.serviceId} props={this.props} fromPage={`user`}/>

                            {this.state.offlineLogs.length ? (
                                <div className={`col-12 mt-5 table-responsive `}>
                                    <h4 className={`text-center font-weight-bold`}>Activity logs</h4>
                                    <table
                                        className={`table table-borderless d-sm-table ${styles.devicesTable}`}>
                                        <thead>
                                        <tr>
                                            <th scope="col" className={`font-weight-normal`}>Date</th>
                                            <th scope="col" className={`font-weight-normal`}>Status
                                            </th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {this.state.offlineLogs.map((log, index) => {
                                            return (
                                                <tr key={index}
                                                    className={`background-gray`}>
                                                    <td>
                                                        {moment(log.created_at).utc(true).format('DD/MM/YYYY HH:mm:ss')}
                                                    </td>
                                                    <td>
                                                        {log.text.length > 160 ? log.text.substring(0, 160).toString() + '...' : log.text}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                        </tbody>
                                    </table>

                                    {this.state.loadMoreLogs ? (
                                        <div className={`text-center mb-3`}>
                                            <button
                                                onClick={() => this.loadMoreLogs()}
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
                                    ) : null}

                                </div>
                            ) : null}

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

export default withRouter(EncryptionDiagram)