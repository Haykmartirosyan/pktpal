import React, {Component} from 'react'
import Emitter from "../../services/emitter";

class DevicePairingFailed extends Component {
    constructor(props) {
        super(props);
        this.state = {}
    }

    componentDidUpdate() {
        if (this.props.show) {
            $('#devicePairingFailed').modal('show');
        }
    }

    closeModal() {
        Emitter.emit('closingModal', true);
        $('#devicePairingFailed').modal('hide')
    }


    render() {
        return (
            <div>
                <div className="modal fade" id="devicePairingFailed" tabIndex="-1" role="dialog"
                     aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content p-2">
                            <div className="modal-body">
                                <button type="button" className="close float-right"
                                        onClick={(e) => this.closeModal()}
                                        aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>

                                <div className="container mt-5">
                                    <div className={'row'}>
                                        <div className={'col-12 d-flex justify-content-center'}>
                                            <div>
                                                <svg width="47" height="46" viewBox="0 0 47 46" fill="none"
                                                     xmlns="http://www.w3.org/2000/svg">
                                                    <path
                                                        d="M32.5406 17.4224C33.3823 16.6379 33.4287 15.3197 32.6442 14.478C31.8597 13.6363 30.5414 13.5899 29.6998 14.3744L23.6036 20.0561L17.9219 13.96C17.1374 13.1183 15.8192 13.0719 14.9775 13.8564C14.1358 14.6409 14.0894 15.9592 14.8739 16.8009L20.5556 22.897L14.4595 28.5787C13.6178 29.3632 13.5714 30.6814 14.3559 31.5231C15.1404 32.3648 16.4587 32.4112 17.3004 31.6267L23.3965 25.945L29.0782 32.0411C29.8627 32.8828 31.181 32.9292 32.0226 32.1447C32.8643 31.3602 32.9107 30.0419 32.1262 29.2002L26.4445 23.1041L32.5406 17.4224Z"
                                                        fill="#EE152F"/>
                                                    <path fillRule="evenodd" clipRule="evenodd"
                                                          d="M0.583496 23.0007C0.583496 10.3441 10.8436 0.0839844 23.5002 0.0839844C36.1567 0.0839844 46.4168 10.3441 46.4168 23.0007C46.4168 35.6572 36.1567 45.9173 23.5002 45.9173C10.8436 45.9173 0.583496 35.6572 0.583496 23.0007ZM23.5002 41.7506C13.1448 41.7506 4.75016 33.356 4.75016 23.0007C4.75016 12.6453 13.1448 4.25065 23.5002 4.25065C33.8555 4.25065 42.2502 12.6453 42.2502 23.0007C42.2502 33.356 33.8555 41.7506 23.5002 41.7506Z"
                                                          fill="#EE152F"/>
                                                </svg>

                                            </div>
                                        </div>

                                        <div className={'col-12 d-flex justify-content-center'}>
                                            <div className={'mt-3'}>
                                                <h2 className={'font-weight-bold'}>Pairing failed</h2>
                                            </div>
                                        </div>

                                        <div className={'col-12 d-flex justify-content-center'}>
                                            <div className={'mt-3 text-center'}>
                                                <p>
                                                    Please check if your device and PKT Cube are on the same Wi-Fi
                                                </p>
                                            </div>
                                        </div>


                                        <div className={'col-12 d-flex justify-content-center mt-4'}>
                                            <button
                                                onClick={(e) => this.closeModal()}
                                                className={`btn-wide pt-3 pb-3 btn btn-primary text-white font-weight-bold radius-8`}>
                                                Pair again
                                            </button>
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

export default DevicePairingFailed
