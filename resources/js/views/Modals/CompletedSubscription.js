import React, {Component} from "react";
import Emitter from "../../services/emitter";

class CompletedSubscription extends Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        Emitter.on('openSubscriptionCompletedModal', () => {
            $('#subscriptionCompleted').modal('show');
        })
    }

    closeModal() {
        $('#subscriptionCompleted').modal('hide');
    }

    render() {
        return (
            <div>
                <div className="modal fade" id="subscriptionCompleted" tabIndex="-1" role="dialog"
                     aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content p-2">
                            <div className="modal-body">
                                <button type="button" className="close float-right"
                                        onClick={() => this.closeModal()}
                                        aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                                <div className="container mt-3">

                                    <div className={'row'}>
                                        <div className={'col-12 d-flex justify-content-center'}>
                                            <div>
                                                <svg width="51" height="50" viewBox="0 0 51 50" fill="none"
                                                     xmlns="http://www.w3.org/2000/svg">
                                                    <path
                                                        d="M21.506 34.8038L11.8636 25.1615L15.0778 21.9473L21.506 28.3756L34.3625 15.5191L37.5766 18.7332L21.506 34.8038Z"
                                                        fill="#4174DB"/>
                                                    <path fillRule="evenodd" clipRule="evenodd"
                                                          d="M0.5 25C0.5 11.1929 11.6929 0 25.5 0C39.3071 0 50.5 11.1929 50.5 25C50.5 38.8071 39.3071 50 25.5 50C11.6929 50 0.5 38.8071 0.5 25ZM25.5 45.4545C14.2033 45.4545 5.04545 36.2967 5.04545 25C5.04545 13.7033 14.2033 4.54545 25.5 4.54545C36.7967 4.54545 45.9545 13.7033 45.9545 25C45.9545 36.2967 36.7967 45.4545 25.5 45.4545Z"
                                                          fill="#4174DB"/>
                                                </svg>
                                            </div>
                                        </div>

                                        <div className={'col-12 d-flex justify-content-center'}>
                                            <div className={'mt-1'}>
                                                <h2 className={'font-weight-bold text-center'}>Successful Payment</h2>
                                                <h6 className={`text-center`}>Your payment has been successfully
                                                    submitted</h6>
                                            </div>
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

export default CompletedSubscription