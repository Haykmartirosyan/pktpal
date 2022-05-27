import React, {Component} from 'react'
import Emitter from "../../../../services/emitter";
import styles from "../../../user/Dashboard/Pkt/Statisctics.module.scss";
import moment from "moment";

class ShowLos extends Component {
    constructor(props) {
        super(props);
        this.state = {
            text: '',
            date: '',
            type: '',
            textArray: [],
        }
    }

    componentDidMount() {
        let _this = this;
        Emitter.on('showLogModal', (data) => {
            _this.setState({
                text: data.text,
                date: data.date,
                type: data.type,
                textArray: data.type == 'Wallet logs' || data.type == 'Packetcrypt logs' || data.type == 'Alert logs' || data.type == 'Node runner alerts' || data.type == 'Clickhouse logs'
                    ? data.text.replaceAll(/\u001b\[.*?m/g, '').split(/\n/)
                    : data.text.split('->'),
            });
            $('#showLogs').modal('show');
        });
    }

    render() {
        return (
            <div>
                <div className="modal fade" id="showLogs" tabIndex="-1" role="dialog"
                     aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div className="modal-dialog modal-lg" role="document">
                        <div className="modal-content p-2">
                            <div className="modal-body">
                                <button type="button" className="close float-right"
                                        data-dismiss="modal"
                                        aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>

                                <div className="container mt-5">
                                    <div className={'row'}>
                                        <div className={'col-12 d-flex justify-content-center'}>
                                            <h3>{this.state.type}</h3>
                                        </div>
                                        <div className={'col-12 d-flex justify-content-center'}>
                                            <p>
                                                {moment(this.state.date).utc(true).local().format('DD/MM/YY')}
                                            </p>
                                        </div>

                                        <div className={`${styles.logsModalContent} w-100 overflow-auto p-3`}>

                                            {this.state.textArray.map((text, index) => {
                                                return (
                                                    <div className=" background-gray my-2 p-2 radius-8 text-break"
                                                         key={index}>
                                                        {text}
                                                    </div>
                                                )
                                            })}
                                        </div>


                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default ShowLos
