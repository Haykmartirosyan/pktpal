import React, {Component} from "react";
import AdminHeader from "./Layouts/Header";
import CodeEditor from "@uiw/react-textarea-code-editor";
import styles from "../../user/Dashboard/Pkt/Statisctics.module.scss";
import moment from "moment";
import {showLogMore} from "../../Helpers/AdminHelpers";
import ShowLog from "./Modals/ShowLog";
import NotificationSystem from 'react-notification-system';

class Clickhouse extends Component {
    notificationSystem = React.createRef();

    constructor(props) {
        super(props);
        this.state = {
            clickhouseResult: [],
            query: ''
        }
    }

    componentDidMount() {

        this.setState({
            query: 'SELECT * FROM `logs` WHERE `mac` = \'\' AND `subsys` = \'\' ORDER BY `created` DESC LIMIT 0, 5'
        })
    }

    setQuery(value) {
        this.setState({
            query: value
        })
    }

    getLogsFromClickhouse() {
        if (this.state.query) {
            this.setState({
                clickhouseResult: [],
                showLoading: true
            });
            this.getLogs().then((response) => {
                this.setState({
                    clickhouseResult: response.data.data,
                    showLoading: false
                });
            }).catch(error => {
                this.setState({
                    showLoading: false
                });
                this.addNotification(error.response.data.error, 'error');
            })
        }
    }

    addNotification(message, level) {
        const notification = this.notificationSystem.current;
        notification.addNotification({
            level: level,
            position: 'br',
            autoDismiss: 20,
            children: (
                <div className={'w-100'}>
                    <h6 className={'p-2'}>{message}</h6>
                </div>
            )
        });
    }

    getLogs() {
        return new Promise((resolve, reject) => {
            let data = {
                clickhouseQuery: this.state.query
            };
            axios.post(api_routes.admin.dashboard.getLogsFromClickhouse(), data).then(response => {
                return response;
            }).then(json => {
                resolve(json);
            }).catch(error => {
                reject(error)
            });
        });
    }

    render() {
        return (
            <div>
                <AdminHeader/>

                <div className={`flex justify-content-center align-items-center p-5`}>

                    <CodeEditor
                        value={this.state.query}
                        onChange={(evn) => this.setQuery(evn.target.value)}
                        language="sql"
                        placeholder="Please enter SQL query."
                        padding={15}
                        style={{
                            fontSize: 16,
                            backgroundColor: "#f5f5f5",
                            fontFamily:
                                "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace"
                        }}
                    />
                </div>
                <div className={`flex justify-content-center align-items-center`}>

                    <button
                        className={`${this.state.showLoading ? 'disabled' : null} btn background-dark-blue text-white btn-wide radius-5`}
                        onClick={() => !this.state.showLoading ? this.getLogsFromClickhouse() : null}>
                        Run query
                        {this.state.showLoading ? (
                            <div
                                className="spinner-border spinner-border-sm font-14 ml-2"
                                role="status">
                            </div>) : null}
                    </button>
                </div>

                <div className={'container'}>

                    {this.state.clickhouseResult.length ? (

                        <div className={'col-sm-12 col-lg-12 font-14 mt-4 border radius-8'}>

                            <div>
                                <table
                                    className={`table table-responsive table-borderless d-sm-table ${styles.devicesTable}`}>
                                    <thead>
                                    <tr>
                                        <th scope="col" className={`font-weight-normal`}>Date</th>
                                        <th scope="col" className={`font-weight-normal`}>Description
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {this.state.clickhouseResult.map((log, index) => {
                                        return (
                                            <tr key={index}
                                                className={`background-gray`}>
                                                <td>
                                                    {moment(log.created).utc(true).local().format('DD/MM/YY HH:mm:ss')}
                                                </td>
                                                <td>
                                                    <a href="#" role={'button'}
                                                       className={'text-black'}
                                                       onClick={(e) => log.text ? showLogMore(e, log.text, log.created, 'Clickhouse logs') : ''}>

                                                        {log.ip && <span>IP: <b> {log.ip},</b>&nbsp;</span>}

                                                        {log.subsys &&
                                                        <span>Subsys: <b> {log.subsys},</b>&nbsp;</span>}


                                                        {log.token &&
                                                        <span>Token: <b> {log.token},</b>&nbsp;</span>}

                                                        {log.session &&
                                                        <span>Session: <b> {log.session},</b>&nbsp;</span>}

                                                        {log.good ||  log.good == 0 &&
                                                        <span> Good: <b> {log.good},</b>&nbsp;</span>}

                                                        {log.version_id &&
                                                        <span>Version_id: <b> {log.version_id},</b>&nbsp;</span>}

                                                        {log.text &&
                                                        <span>Log: <b>{log.text.length > 160 ? log.text.substring(0, 160).toString() + '...' : log.text},</b>&nbsp;</span>}


                                                    </a>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    </tbody>
                                </table>

                            </div>

                        </div>
                    ) : null}

                </div>
                <NotificationSystem ref={this.notificationSystem}/>

                <ShowLog/>

            </div>
        )
    }
}

export default Clickhouse
