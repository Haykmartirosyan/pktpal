import {Component} from 'react';
import {pktNumber} from "../../../Helpers/StatisticsHelpers";
import styles from "./Statisctics.module.scss";
import Tooltip from "rc-tooltip/es";
import React from "react";
import {Link} from "react-router-dom";
import {copyAddress} from "../../../Helpers/GlobalHelpers";

class TransactionsMobile extends Component {
    constructor(props) {
        super(props)
    }

    render() {
        return (
            <div id="accordion" className={`d-md-none`}>
                {this.props.filteredTransactions.map((result, index) => {
                    return (
                        <div key={index}>
                            <div className="card border-0">
                                <div className="card-header bg-transparent border-0 pt-4 pb-4" id={`heading-${index}`}>
                                    <div
                                        className={`d-flex align-items-center justify-content-between font-weight-bold`}
                                        data-toggle="collapse"
                                        data-target={`#collapse-${index}`}
                                        aria-expanded="true"
                                        aria-controls={`collapse-${index}`}>
                                        <span>
                                            {moment(result.blockTime).format("DD MMM YYYY")}
                                        </span>
                                        <span>
                                            {result.input && result.input[0] && result.input[0].address == this.props.walletAddress ? (
                                                <span>Sent</span>
                                            ) : (
                                                <span>Received</span>
                                            )}
                                        </span>
                                        <span>
                                            <svg width="20" height="12"
                                                 viewBox="0 0 20 12"
                                                 fill="none"
                                                 xmlns="http://www.w3.org/2000/svg">
                                                <path
                                                    d="M18.2969 1.48633L9.79688 9.98633L1.29687 1.48633"
                                                    stroke="#141414"
                                                    strokeWidth="2"/>
                                            </svg>
                                        </span>
                                    </div>
                                </div>

                                <div id={`collapse-${index}`} className="collapse bg-light"
                                     aria-labelledby={`heading-${index}`}
                                     data-parent="#accordion">
                                    <div className="card-body">
                                        <div>
                                            <p className={`text-secondary font-weight-bold`}>Wallet address</p>
                                            <p className={`font-weight-bold`}>
                                                {result.input && result.input[0] && result.input[0].address == this.props.walletAddress ? (
                                                    <span>
                                                        {result.output.map(function (output) {
                                                            return (
                                                                output.address !== this.props.walletAddress ? (
                                                                    output.address
                                                                ) : null
                                                            );
                                                            }, this)}
                                                    </span>
                                                ) : (
                                                    <span>
                                                        {result.input.map(function (input) {
                                                            return (
                                                                input.address !== this.props.walletAddress ? (
                                                                    input.address
                                                                ) : null
                                                            );
                                                            }, this)}
                                                    </span>
                                                )}
                                            </p>
                                        </div>

                                        <div>
                                            <p className={`text-secondary font-weight-bold`}>Transaction ID</p>
                                            <p className={`font-weight-bold`}>
                                                {result.txid}
                                                <Tooltip placement="top" trigger={['click']} overlay={<span>Copied!</span>}>
                                                    <button
                                                        onClick={() => copyAddress(result.txid)}
                                                        className="btn bg-white ml-1 p-2">
                                                        <svg width="23" height="23" viewBox="0 0 18 23" fill="none"
                                                             xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M10 6.5H4V4.5H10V6.5Z" fill="#0F1114"/>
                                                            <path d="M10 10.5H4V8.5H10V10.5Z" fill="#0F1114"/>
                                                            <path d="M4 14.5H10V12.5H4V14.5Z" fill="#0F1114"/>
                                                            <path fillRule="evenodd" clipRule="evenodd"
                                                                  d="M0 18.5V0.5H14V4.5H18V22.5H4V18.5H0ZM12 16.5V2.5H2V16.5H12ZM14 6.5V18.5H6V20.5H16V6.5H14Z"
                                                                  fill="#0F1114"/>
                                                        </svg>
                                                    </button>
                                                </Tooltip>
                                            </p>
                                        </div>

                                        <div>
                                            <p className={`text-secondary font-weight-bold`}>Amount</p>
                                            <p className={`font-weight-bold`}>
                                                {result.input && result.input[0] && result.input[0].address == this.props.walletAddress ? (
                                                    <span>-
                                                        {result.output.map(function (output, index) {
                                                            return (
                                                                output.address !== this.props.walletAddress ? (
                                                                    pktNumber(output.value, true)
                                                                ) : null
                                                            );
                                                        }, this)}
                                                    </span>
                                                ) : (
                                                    <span>+
                                                        {result.output.map(function (output, index) {
                                                            return (
                                                                output.address === this.props.walletAddress ? (
                                                                    pktNumber(output.value, true)
                                                                ) : null
                                                            );
                                                        }, this)}
                                                    </span>
                                                )} PKT
                                            </p>
                                        </div>

                                        <div>
                                            <p className={`text-secondary font-weight-bold`}>From</p>
                                            <div className={`font-weight-bold mb-3`}>
                                                {result.input.map(function (input, index) {
                                                    return (
                                                        <div key={index}>
                                                            <div className={`${styles.transactionInfo} bg-white p-3  radius-8  flex justify-content-between ${index > 0 ? 'mt-3' : ''}`}>
                                                                <span>
                                                                    <Tooltip
                                                                        placement="top"
                                                                        trigger={['hover']}
                                                                        overlay={
                                                                            <span>{input.address}</span>}>
                                                                        <span>{input.address == this.props.walletAddress ? (
                                                                            <span> This Address</span>) : (
                                                                                <span>{input.address.substring(0, 20).toString()}...</span>
                                                                        )}
                                                                        </span>
                                                                    </Tooltip>
                                                                </span>
                                                            </div>
                                                            <div className={`text-right mt-4`}>
                                                                <span>{pktNumber(input.value, true)} PKT</span>
                                                            </div>
                                                        </div>
                                                    );
                                                }, this)}
                                            </div>
                                        </div>

                                        <div>
                                            <p className={`text-secondary font-weight-bold`}>To</p>
                                            <div className={`font-weight-bold mb-3`}>
                                                {result.output.map(function (output, index) {
                                                    return (
                                                        <div key={index}>
                                                            <div className={`${styles.transactionInfo} bg-white p-3 radius-8 flex justify-content-between ${index > 0 ? 'mt-3' : ''}`}>
                                                                <span>
                                                                    <Tooltip
                                                                        placement="top"
                                                                        trigger={['hover']}
                                                                        overlay={
                                                                            <span>{output.address}</span>}>
                                                                        <span>
                                                                            {output.address == this.props.walletAddress ? (
                                                                                <span> This Address</span>
                                                                            ) : (
                                                                                <span>{output.address.substring(0, 20).toString()}...</span>
                                                                            )}
                                                                            </span>
                                                                    </Tooltip>
                                                                </span>
                                                            </div>
                                                            <div className={`text-right mt-4`}>
                                                                <span>{pktNumber(output.value, true)} PKT</span>
                                                            </div>
                                                        </div>
                                                    );
                                                }, this)}
                                            </div>
                                        </div>

                                        <div className={`text-center mt-5`}>
                                            <Link
                                                to={{pathname: "https://explorer.pktpal.com/tx/" + result.txid}}
                                                target={'_blank'}
                                                className={'btn text-black underline p-0'}>
                                                View transaction in Block
                                                Explorer
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }
}

export default TransactionsMobile
