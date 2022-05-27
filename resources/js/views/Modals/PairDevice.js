import React, {Component} from 'react'
import Emitter from "../../services/emitter";
import {Load} from "../../components/Loadings/Load";
import cookie from "react-cookies";
import {connect} from "react-redux";
import DeviceDetector from "device-detector-js";
import {setUserAgent} from "../Helpers/StatisticsHelpers";
import * as Sentry from "@sentry/react";

class PairDevice extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showLoading: false,
            pairingUrl: '',
            generatedToken: '',
            serviceId: '',
            device: {}
        };

        const deviceDetector = new DeviceDetector();
        const userAgent = navigator.userAgent;
        this.state.device = deviceDetector.parse(userAgent)
    }

    componentDidMount() {
        let _this = this;
        Emitter.on('openDevicePairing', (serviceId) => {
            $('#pairDeviceModal').modal('show');
            _this.setState({
                serviceId: serviceId,
                pairingUrl: ''
            });
            _this.generateToken();
        });

        push.subscribe('device-paired').bind('App\\Events\\DevicePaired', function (data) {
            console.log('device-paired', data);
            if (_this.state.showLoading && data.status === 'error') {
                _this.setState({
                    showLoading: false,
                });
                _this.closeModal();
                Emitter.emit('devicePairingFailed', true);
            }
            if (data.devicePairing && data.devicePairing.service_id == _this.state.serviceId) {
                if (data.status == 'success' && data.devicePairing.device_unique_key == _this.state.generatedToken) {
                    console.log('device-paired-success');
                    cookie.save('devicePaired_' + _this.state.serviceId, data.devicePairing.device_unique_key, {
                        path: '/',
                        expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                    });
                    if (_this.state.showLoading) {
                        _this.setState({
                            showLoading: false,
                        });
                        _this.closeModal();
                        Emitter.emit('devicePaired', true);
                    }
                }
            }
        });
    }


    closeModal() {
        Emitter.emit('closingModal', true);
        $('#pairDeviceModal').modal('hide')
    }

    pairDevice() {
        let _this = this;
        setTimeout(function () {
            if (_this.state.showLoading) {
                _this.longPairing()
            }
        }, 3 * 60 * 1000);
        this.setState({
            showLoading: true,
        });
    }

    longPairing() {
        let data = {
            'mac_address': this.props.mac,
            'user_agent': setUserAgent(this.state.device)?.userAgent,
            'email': this.props.init.user.user_email,
        };
        axios.post(api_routes.user.longPairing(), data).then(response => {
            return response.data;
        }).then(json => {
            console.log(json)
        }).catch(error => {
            Sentry.captureException(error);
            console.log('error', error)
        });
    }

    generateToken() {
        let _this = this;
        window.pkteerKeyGen(_this.props.mac, function (error, ret) {
            if (error) {
                console.log('error', error);
                return;
            }

            _this.setDevicePairToken(ret).then((response) => {
                if (response.data) {
                    _this.setState({
                        pairingUrl: _this.props.url + '?key=' + ret,
                        generatedToken: ret
                    });
                }
            });
        });
    }

    setDevicePairToken(token) {
        return new Promise((resolve, reject) => {
            let data = {
                'token': token,
                'mac_address': this.props.mac,
                'user_agent': setUserAgent(this.state.device)?.userAgent,
            };
            axios.post(api_routes.user.setPairToken(), data).then(response => {
                return response.data;
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
                <div className="modal fade" id="pairDeviceModal" tabIndex="-1" role="dialog"
                     aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content p-2">
                            {!this.state.showLoading ? (
                                <div>

                                    <div className={`modal-header pb-0 border-0`}>
                                        <button type="button" className="close float-right"
                                                onClick={(e) => this.closeModal()}
                                                aria-label="Close">
                                            <span aria-hidden="true">&times;</span>
                                        </button>
                                    </div>
                                    <div className="modal-body">

                                        <div className={'container'}>

                                            <h5 className={'font-weight-bold'}>Pair your PKT device</h5>
                                            <h6 className={'pt-3'}>Please follow the instructions:</h6>

                                            <ul>
                                                <li className="font-14 font-weight-bold mb-2">Make sure you are on the
                                                    same
                                                    wifi
                                                    as your PktCube
                                                </li>
                                                <li className="font-14 font-weight-bold mb-2">Click the button below to
                                                    pair
                                                </li>
                                                <li className="font-14 font-weight-bold mb-2">The button will open a new
                                                    window
                                                    on your device
                                                </li>
                                                <li className="font-14 font-weight-bold mb-2">If the window does not
                                                    load,
                                                    double-check that your
                                                    PktCube is turned on and that you are on the same wifi
                                                </li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className={`modal-footer text-center border-0`}>
                                        <a
                                            onClick={() => this.state.pairingUrl ? this.pairDevice() : null}
                                            target={'_blank'}
                                            referrerPolicy={'origin'}
                                            href={this.state.pairingUrl ? this.state.pairingUrl : "#"}
                                            className={`btn-wide background-dark-blue pt-3 pb-3 btn text-white font-weight-bold radius-8 m-auto
                                            ${!this.state.pairingUrl ? 'disabled' : ''}`}>
                                            Pair
                                        </a>
                                    </div>
                                </div>
                            ) : (

                                <Load/>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

const init = state => ({
    init: state.init,
});


export default connect(init, null)(PairDevice)


