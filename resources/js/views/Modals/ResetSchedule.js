import React, {Component} from 'react';
import Emitter from "../../services/emitter";
import {deleteScheduledService} from "../Helpers/SettingsHelpers";
import * as Sentry from "@sentry/react";

class ResetSchedule extends Component {
    constructor(props) {
        super(props);
        this.state = {
            serviceId: '',
            showLoading: false
        }
    }

    componentDidMount() {
        Emitter.on('resetWeeklySchedule', (id) => {
            $('#resetScheduleModal').modal('show')
            this.setState({
                serviceId: id
            })
        })
    }

    resetWeeklySchedule() {
        this.setState({
            showLoading: true
        })
        deleteScheduledService(this.state.serviceId).then(() => {
            $('#resetScheduleModal').modal('hide')
            Emitter.emit('refreshSchedule')
            this.setState({
                showLoading: false
            })
        }).catch((e) => {
            Sentry.captureException(e);
            this.setState({
                showLoading: false
            })
            console.log(e)
        })
    }

    render() {
        return (
            <div className="modal fade" id="resetScheduleModal" tabIndex="-1" role="dialog"
                 aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content p-3">
                        <div className="modal-header border-0 pb-0">
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="modal-body px-5 py-2 text-center">
                            <h4 className={`font-weight-bold px-3`}>Are you sure want to reset your weekly
                                schedule?</h4>
                            <h6 className={`px-3 mt-3 mb-4`}>If you reset your weekly schedule, you will lose the
                                schedule you've set before.</h6>
                            <button className={`btn background-dark-blue radius-5 text-white btn-wide
                            ${this.state.showLoading ? 'disabled' : ''}`}
                                    onClick={() => this.resetWeeklySchedule()}
                                    disabled={this.state.showLoading}>
                                <span className={`font-weight-bold`}>Confirm
                                    {this.state.showLoading ? (
                                        <div
                                            className="spinner-border spinner-border-sm font-14 ml-2"
                                            role="status">
                                        </div>) : null}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default ResetSchedule