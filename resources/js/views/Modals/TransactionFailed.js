import React, {Component} from 'react'
import Emitter from "../../services/emitter";

class TransactionFailed extends Component {
    constructor(props) {
        super(props);
        this.state = {
            reason: ''
        }
    }

    closeModal() {
        Emitter.emit('closingModal', true);
        $('#TransactionFailedModal').modal('hide')
    }

    componentDidMount() {
        let _this = this;
        Emitter.on('showTransactionFailedModal', (response) => {
            _this.setState({
                reason: response.data.details
            })

            $('#TransactionFailedModal').modal('show');
        });
    }

    render() {
        return (
            <div>
                <div className="modal fade" id="TransactionFailedModal" tabIndex="-1" role="dialog"
                     aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content p-2">
                            <div className="modal-body">
                                <button type="button" className="close float-right"
                                        onClick={(e) => this.closeModal()}
                                        aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>

                                <div className="container mt-4">
                                    <div className={'row'}>
                                        <div className={'col-12 d-flex justify-content-center'}>
                                            <div>
                                                <svg width="35" height="35" viewBox="0 0 47 47" fill="none"
                                                     xmlns="http://www.w3.org/2000/svg">
                                                    <path
                                                        d="M32.5406 18.2603C33.3823 17.4758 33.4287 16.1575 32.6442 15.3158C31.8597 14.4742 30.5414 14.4278 29.6998 15.2123L23.6036 20.894L17.9219 14.7979C17.1374 13.9562 15.8192 13.9098 14.9775 14.6943C14.1358 15.4788 14.0894 16.797 14.8739 17.6387L20.5556 23.7348L14.4595 29.4166C13.6178 30.201 13.5714 31.5193 14.3559 32.361C15.1404 33.2027 16.4587 33.2491 17.3004 32.4646L23.3965 26.7829L29.0782 32.879C29.8627 33.7207 31.181 33.7671 32.0226 32.9826C32.8643 32.1981 32.9107 30.8798 32.1262 30.0381L26.4445 23.942L32.5406 18.2603Z"
                                                        fill="#EE152F"/>
                                                    <path fillRule="evenodd" clipRule="evenodd"
                                                          d="M0.583496 23.8385C0.583496 11.182 10.8436 0.921875 23.5002 0.921875C36.1567 0.921875 46.4168 11.182 46.4168 23.8385C46.4168 36.4951 36.1567 46.7552 23.5002 46.7552C10.8436 46.7552 0.583496 36.4951 0.583496 23.8385ZM23.5002 42.5885C13.1448 42.5885 4.75016 34.1939 4.75016 23.8385C4.75016 13.4832 13.1448 5.08854 23.5002 5.08854C33.8555 5.08854 42.2502 13.4832 42.2502 23.8385C42.2502 34.1939 33.8555 42.5885 23.5002 42.5885Z"
                                                          fill="#EE152F"/>
                                                </svg>
                                            </div>
                                        </div>

                                        <div className={'col-12 d-flex justify-content-center'}>
                                            <div>
                                                <h1>Payment failed</h1>
                                            </div>
                                        </div>
                                        <div className={'col-12 d-flex justify-content-center'}>
                                            <div className={'text-center'}>
                                                <p className={`text-break`}>
                                                    {this.state.reason ? this.state.reason : 'The transaction is not made'}
                                                </p>
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

export default TransactionFailed
