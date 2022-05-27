import React, {Component} from "react";
import Emitter from "../../services/emitter";
import {updatePaymentStatus} from "../Helpers/PaymentsHelpers";
import * as Sentry from "@sentry/react";

class PaymentConfirmation extends Component {
    constructor(props) {
        super(props);
        this.state = {
            payment: {},
            disabledButton: false,
            pktPrice: ''
        }
    }


    componentDidMount() {
        let _this = this;
        Emitter.on('paymentConfirmation', (data) => {
            this.setState({
                payment: data.payment,
                pktPrice: data.pktPrice
            });
            $('#confirmPayment').modal('show');

        });

        push.subscribe('result-alter-direct-debit').bind('App\\Events\\AlterDirectDebit', function (data) {
            if (data.directDebitId == _this.state.payment.direct_debit_id) {
                console.log('alterDirectDebit-response', data);
                if (data.status === 'success') {
                    _this.spendDirectDebit()
                } else {
                    $('#confirmPayment').modal('hide');
                    let reasonData = {
                        payment_id: _this.state.payment.id,
                        reason: "The transaction is not made"
                    };
                    _this.addFailedLog(reasonData).then(r => {
                        Emitter.emit('transactionFailed', {details: reasonData.reason});
                    })
                }
            }

        });

        push.subscribe('result-spend-direct-debit').bind('App\\Events\\SpendDirectDebit', function (data) {
            if (data.directDebitId == _this.state.payment.direct_debit_id) {
                console.log('spendDirectDebit-response', data);
                if (data.status === 'success') {
                    _this.changePaymentStatus()
                } else {
                    $('#confirmPayment').modal('hide');
                    let reasonData = {
                        payment_id: _this.state.payment.id,
                        reason: data.detail
                    };
                    _this.addFailedLog(reasonData).then(r => {
                        Emitter.emit('transactionFailed', {details: data.detail});
                    })
                }
            }
        });
    }

    addFailedLog(data) {
        return new Promise((resolve, reject) => {
            axios.post(api_routes.financialManager.bill.addFailedLog(), data).then(response => {
                return response.data;
            }).then(json => {
                resolve(json);
            }).catch(error => {
                Sentry.captureException(error);
                reject(error)
            });
        });

    }

    changePaymentStatus() {
        updatePaymentStatus(this.state.payment.id, !this.state.payment.completed, this.state.payment.enoughFunds).then(response => {
            if (response.success) {
                Emitter.emit('paymentStatusChanged', this.state.payment);
                $('#confirmPayment').modal('hide');
            }
        })
    }

    sendPkt() {
        this.setState({
            disabledButton: true
        });
        this.alterDebit().then(response => {
            if (!response.success) {
                this.setState({
                    disabledButton: false
                });
            }
        })
    }

    spendDirectDebit() {
        return new Promise((resolve, reject) => {
            let data = {
                event: 'spend_direct_debit',
                amount: parseFloat(this.state.pktPrice),
                directDebitId: this.state.payment.direct_debit_id
            };
            axios.post(api_routes.financialManager.bill.spendDirectDebit(this.state.payment.service_id), data).then(response => {
                return response.data;
            }).then(json => {
                resolve(json);
            }).catch(error => {
                Sentry.captureException(error);
                reject(error)
            });
        });
    }

    alterDebit() {
        return new Promise((resolve, reject) => {
            let data = {
                event: 'alter_spending_limits',
                amount: parseFloat(this.state.pktPrice),
                directDebitId: this.state.payment.direct_debit_id
            };
            axios.post(api_routes.financialManager.bill.alterDirectDebit(this.state.payment.service_id), data).then(response => {
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
                <div className="modal fade" id="confirmPayment" tabIndex="-1" role="dialog"
                     aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div className="modal-dialog" role="document">
                        <div className="modal-content">
                            <div>
                                <div className="modal-header border-0">
                                    <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                                <div className="modal-body text-center p-2">
                                    <h4 className={`font-weight-bold`}>Make a payment</h4>
                                    <p>Are you sure you want to make this payment?</p>
                                </div>
                                <div className="modal-footer border-0 flex justify-content-center">
                                    <button type="button"
                                            className="btn bg-white border btn-wide radius-5 font-weight-bold"
                                            data-dismiss="modal">No
                                    </button>

                                    <button type="button"
                                            className={`btn background-dark-blue radius-5 btn-wide text-white font-weight-bold
                                                    ${this.state.disabledButton ? 'disabled' : ''}`}
                                            disabled={this.state.disabledButton}
                                            onClick={() => {
                                                this.state.payment.enoughFunds ?
                                                    this.sendPkt() : this.changePaymentStatus()
                                            }}>Yes
                                        {this.state.disabledButton ? (
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
            </div>
        )
    }

}

export default PaymentConfirmation
