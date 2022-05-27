import React, {Component} from 'react'
import Emitter from "../../../../services/emitter";

class AssignConfirmation extends Component {
    constructor(props) {
        super(props);
        this.state = {
            service: '',
            userId: '',
            showLoading: false
        }
    }

    componentDidMount() {
        let _this = this;
        Emitter.on('showAssignConfirmation', (data) => {
            _this.setState({
                service: data.data.service,
                userId: data.data.user_id,
            })
            $('#assignConfirmation').modal('show');
        });

        Emitter.on('deviceAssigned', () => {
            _this.setState({
                showLoading: false
            })
        });

    }

    confirmAssign() {
        let data = {
            service: this.state.service,
            userId: this.state.userId,
        }
        this.setState({
            showLoading: true
        })
        Emitter.emit('confirmAssign', {data});
    }

    render() {
        return (
            <div>
                <div className="modal fade" id="assignConfirmation" tabIndex="-1" role="dialog"
                     aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div className="modal-dialog" role="document">
                        <div className="modal-content p-2">
                            <div className={`modal-header pb-0 border-0`}>
                                <button type="button" className="close float-right"
                                        data-dismiss="modal"
                                        aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">

                                <div className={'container'}>

                                    <div className={'text-center'}>
                                        <h6 className={'font-weight-bold'}>
                                            Are you sure you want to change the device's owner?
                                        </h6>
                                    </div>

                                </div>
                            </div>

                            <div className={`modal-footer text-center border-0`}>
                                <button
                                    data-dismiss="modal"
                                    disabled={this.state.showLoading}
                                    className={`btn-wide btn-light btn font-weight-bold radius-8 m-auto ${this.state.showLoading ? 'disabled' : ''}`}>
                                    No
                                </button>
                                <button
                                    onClick={() => this.confirmAssign()}
                                    disabled={this.state.showLoading}
                                    className={`btn-wide btn-primary btn text-white font-weight-bold radius-8 m-auto ${this.state.showLoading ? 'disabled' : ''}`}>
                                    Yes
                                    {this.state.showLoading ? (
                                        <div
                                            className="spinner-border spinner-border-sm font-14 ml-2"
                                            role="status">
                                        </div>) : null}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default AssignConfirmation
