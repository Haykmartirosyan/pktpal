import {Component} from "react";
import React from "react";
import cookie from "react-cookies";
import Switch from "react-switch";
import styles from "./Dashboard.module.css"
import {Link} from "react-router-dom";

class DeviceMobile extends Component {
    constructor(props) {
        super(props);

    }

    render() {
        return (
            <div className={'d-block d-md-none'}>
                {this.props.pktServices.map(function (pktService, index) {
                    return (
                        <div key={index} className={'bg-light p-3 mb-4 radius-8'}>
                            <div className={`mb-4`}>
                                <p className={`mb-2 text-secondary`}>Name</p>
                                {(!this.props.showEditPktName && !this.props.showEditBlockId) || this.props.showEditBlockId && this.props.showEditBlockId != pktService.id ? (
                                    <div className={'flex aling-items-center'}>
                                        <div>
                                            {pktService.name ? pktService.name : 'My PKT Cube'}
                                            {Object.keys(this.props.pktServices).length > 1 && !pktService.name && index > 0 ? (
                                                <span> {index + 1}</span>
                                            ) : null}
                                        </div>
                                        <button className={'bg-transparent ml-3'}
                                                onClick={(e) => this.props.parent.editPktName(pktService)}>
                                            <svg width="17" height="17"
                                                 viewBox="0 0 17 17"
                                                 fill="none"
                                                 xmlns="http://www.w3.org/2000/svg">
                                                <path fillRule="evenodd"
                                                      clipRule="evenodd"
                                                      d="M15.6072 0.71967C15.3022 0.426777 14.8077 0.426777 14.5027 0.71967L13.8213 1.37394C12.9504 0.974408 11.8757 1.12101 11.1543 1.81373L2.87031 9.76869L7.28843 14.0113L15.5724 6.05638C16.2938 5.36365 16.4465 4.3316 16.0304 3.49526L16.7117 2.84099C17.0167 2.5481 17.0167 2.07322 16.7117 1.78033L15.6072 0.71967ZM12.2738 7.10265L7.28843 11.89L5.07937 9.76869L10.0647 4.98133L12.2738 7.10265ZM13.6939 5.73894L14.4679 4.99572C14.7729 4.70282 14.7729 4.22795 14.4679 3.93506L13.3633 2.87439C13.0583 2.5815 12.5638 2.5815 12.2588 2.87439L11.4849 3.61762L13.6939 5.73894Z"
                                                      fill="#141414"/>
                                                <path
                                                    d="M0.562012 16.2127L2.21911 10.3787L6.63693 14.6217L0.562012 16.2127Z"
                                                    fill="#141414"/>
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div className={'flex justify-content-between'}>

                                        <div>
                                            <input type="text"
                                                   onChange={this.props.parent.handleName}
                                                   className={`p-2 radius-5 bg-white w-100`}
                                                   placeholder={`PKT name`}
                                                   defaultValue={pktService.name}/>
                                        </div>
                                        <div className={'flex justify-content-between'}>
                                            <button className={'btn btn-light ml-2 background-gray'}
                                                    onClick={() => this.props.parent.updatePkt(pktService.id)}>
                                                <svg width="12" height="10"
                                                     viewBox="0 0 12 10"
                                                     fill="none"
                                                     xmlns="http://www.w3.org/2000/svg">
                                                    <path
                                                        d="M4.5859 6.41467L1.75748 3.58624L0.343262 5.00045L4.5859 9.24309L11.657 2.17203L10.2428 0.757812L4.5859 6.41467Z"
                                                        fill="#141414"/>
                                                </svg>

                                            </button>

                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={`mb-4`}>
                                <p className={`mb-2 text-secondary`}>Wallet address</p>
                                {pktService.wallet_address ? (
                                    <div className={`${styles.tooLong}`}>
                                        {pktService.wallet_address}
                                    </div>
                                ) : (
                                    '-'
                                )}
                            </div>

                            <div className={`mb-4`}>
                                <p className={`mb-2 text-secondary`}>Balance</p>
                                {pktService.balance ? (
                                    <span> {pktService.balance} PKT</span>
                                ) : (
                                    '-'
                                )}
                            </div>

                            <div>
                                <p className={`mb-2 text-secondary`}>Rack mode</p>
                                {(!this.props.disableRackModeId && !this.props.showDisableRackModeLoading) || (this.props.disableRackModeId !== pktService.id) ? (


                                    this.props.pktServices.length > 1 && !this.props.rackModeHide ? (

                                        !cookie.load('devicePaired_' + pktService.id) || (this.props.rackModeDisabled && pktService.type == 'node') ? (
                                            <Switch
                                                disabled={true}
                                                onChange={e => e}
                                                onColor={'#023DB5'}
                                                checkedIcon={false}
                                                uncheckedIcon={false}
                                                width={36}
                                                height={22}
                                                checked={pktService.type === 'rack' ? true : false}/>
                                        ) : (
                                            <Switch
                                                disabled={this.props.rackModeDisabled && pktService.type == 'node'}
                                                onChange={e => this.props.parent.handleRackModeChange(e, pktService.id)}
                                                onColor={'#023DB5'}
                                                checkedIcon={false}
                                                uncheckedIcon={false}
                                                width={36}
                                                height={22}
                                                checked={pktService.type === 'rack' ? true : false}/>
                                        )

                                    ) : '-'

                                ) : (
                                    <div className="spinner-border  spinner-border-sm color-dark-blue"
                                        role="status">
                                    </div>
                                )}
                            </div>

                            <div className={`text-right`}>
                                <Link
                                    to={{pathname: pktService.type == 'node' ? "/pkt/details/" + pktService.id : "/pkt/rack/details/" + pktService.id}}
                                    className={`font-500 btn btn-link text-black p-0 text-dark`}>
                                    <u>See Details</u>
                                </Link>
                            </div>
                        </div>
                    )
                }, this)}
            </div>
        )
    }

}

export default DeviceMobile