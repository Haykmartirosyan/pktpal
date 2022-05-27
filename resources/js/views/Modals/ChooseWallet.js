import React, {Component} from 'react'
import Emitter from '../../services/emitter';
import {Load} from "../../components/Loadings/Load";
import Tooltip from "rc-tooltip/es";
import * as Sentry from "@sentry/react";

class ChooseWallet extends Component {
    constructor(props) {
        super(props);
        this.state = {
            macAddress: '',
            signReq: '',
            msg: '',
            showLoading: false,
        }
    }

    componentDidMount() {
        let _this = this;
        Emitter.on('openChooseWalletModal', (data) => {
            _this.setState({
                macAddress: data.macAddress
            })
            $('#chooseWalletModal').modal('show');

            setTimeout(function () {
                let signReq = {
                    wallet_address: data.rackWallet,
                }
                window.pkteerSignReq(_this.state.macAddress, signReq, function (error, ret) {
                    if (error) {
                        return null;
                    } else {
                        _this.setState({
                            signReq: ret.sig,
                            msg: ret.msg
                        })
                    }
                });
            }, 500)

        });

        push.subscribe('result-rackmode').bind('App\\Events\\RackModeResultEvent', function (data) {
            console.log('result-rackmode', data)
            if (data.status === 'success' && data.type === 'rack') {
                if (_this.state.showLoading) {
                    _this.changeServiceType(_this.props.service);
                }
            } else {
                _this.setState({showLoading: false})
                _this.closeModal()
            }
        });
    }

    changeServiceType(service) {
        let data = {
            'type': 'rack'
        };

        axios.put(api_routes.user.updateService(service.id), data).then(response => {
            return response;
        }).then(json => {
            if (json.data.success) {
                $('#chooseWalletModal').modal('hide');
                if (this.props.history) {
                    this.props.history.push('/pkt/rack/details/' + service.id)
                } else {
                    Emitter.emit('rackModeEnabled', true);
                }

            }
        }).catch(error => {
            Sentry.captureException(error);
            console.log('error', error)
        });
    }

    setRackModeData(service) {
        let data = {
            service_id: service.id,
            mac_address: this.state.macAddress,
            sign_req: this.state.signReq,
            msg: this.state.msg,
            wallet_address: this.props.wallet,
        }

        return new Promise((resolve, reject) => {
            axios.post(api_routes.user.enableRackMode(), data).then(response => {
                return response;
            }).then(json => {
                resolve(json);
            }).catch(error => {
                Sentry.captureException(error);
                reject(error)
            });
        }).then((response) => {
            if (response.data.type != "error") {
                this.setState({showLoading: true})
            }
        });
    }

    closeModal() {
        Emitter.emit('closingModal', true);
        $('#chooseWalletModal').modal('hide');

    }

    render() {
        return (
            <div>
                <div className="modal fade" id="chooseWalletModal" tabIndex="-1" role="dialog"
                     aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content p-2">
                            <div className="modal-body">
                                {!this.state.showLoading ? (
                                    <div>
                                        <button type="button" className="close"
                                                onClick={(e) => this.closeModal()}
                                                aria-label="Close">
                                            <span aria-hidden="true">&times;</span>
                                        </button>
                                        <h4 className="modal-title mb-3 font-weight-bold" id="exampleModalLabel">
                                            Choose the wallet to mine to
                                        </h4>
                                        <p>
                                            Please choose the wallet address you would like this device to mine to
                                        </p>
                                        <div className={`w-100 mt-3 mb-3`}>
                                            <select name=""
                                                    className={`form-control background-gray mb-0 p-1 w-100 border-0 radius-8 text-black`}
                                                    id="">
                                                <option value="">{this.props.wallet}</option>
                                            </select>
                                        </div>
                                        <div className="mb-2">

                                            {!this.state.signReq ? (
                                                <Tooltip placement="top" trigger={['hover']}
                                                         overlay={
                                                             <span>Make sure you are on the same wifi as your PktCube</span>}>
                                                    <button type="button"
                                                            className={`btn btn-primary w-100 font-weight-bold ${!this.state.signReq ? 'disabled' : ''}`}>
                                                        Choose
                                                    </button>
                                                </Tooltip>
                                            ) : (
                                                <button type="button"
                                                        disabled={!this.state.signReq}
                                                        onClick={(e) => this.setRackModeData(this.props.service)}
                                                        className={`btn btn-primary w-100 font-weight-bold ${!this.state.signReq ? 'disabled' : ''}`}>
                                                    Choose
                                                </button>
                                            )}

                                        </div>
                                    </div>
                                ) : (

                                    <div>
                                        <Load/>
                                    </div>

                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default ChooseWallet
