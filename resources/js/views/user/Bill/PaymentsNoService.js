import {withRouter} from "react-router-dom";
import React, {Component} from "react";
import styles from "./Payments.module.scss";
import {motion} from "framer-motion";
import Header from "../../../components/Header/Header";
import Footer from "../../../components/Footer/Footer";
import CubeImg from "../../../../../public/images/cube.png"

class PaymentsNoService extends Component {

    render() {
        return (
            <div>
                <Header/>
                <div className="container mt-4">
                    <div className="row">
                        <div className={`col-12 col-md-12 col-lg-4 mt-2 `}>
                            <motion.div initial={{scale: 0}}
                                        animate={{scale: 1}}
                                        transition={{duration: 0.2}}
                                        className={`background-dark-blue  ${styles.paddingBox} radius-8 text-white`}>

                                <div className="flex">
                                    <p className={`m-0`}>Balance</p>
                                    <span className={`ml-1`}>
                                            <i className="far fa-question-circle"/>
                                        </span>
                                </div>

                                <div className="flex mt-2">
                                    <h5>0.00 PKT</h5>
                                    <h5 className="ml-3">0.00 USD</h5>
                                </div>
                                <div className={`font-weight-bold color-dark-blue bg-white text-center
                                                 p-2 radius-5 mt-5`}>Pay Bill
                                </div>

                            </motion.div>
                            <motion.div initial={{scale: 0}}
                                        animate={{scale: 1}}
                                        transition={{duration: 0.2, delay: 0.4}}
                                        className={`border radius-8 p-3 mt-4`}>
                                <p>Notification</p>
                                <div className={`my-5`}>
                                    <div className={'flex justify-content-center mb-2'}>
                                        <svg width="26" height="27" viewBox="0 0 26 27" fill="none"
                                             xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" clipRule="evenodd"
                                                  d="M24.9343 11.2549C25.2786 10.4216 25.0721 9.45085 24.3147 8.78226L15.8294 1.292C14.2673 -0.0869167 11.7346 -0.0869172 10.1725 1.292L1.68724 8.78226C0.929743 9.45092 0.723236 10.4218 1.06772 11.2552C1.02446 11.3711 1.00105 11.495 1.00105 11.6237V24.5705C1.00105 25.8706 2.19496 26.9245 3.66772 26.9245H22.3344C23.8071 26.9245 25.0011 25.8706 25.0011 24.5705V11.6237C25.0011 11.4949 24.9776 11.3709 24.9343 11.2549ZM22.429 10.4468L13.9438 2.9565C13.4231 2.49686 12.5788 2.49686 12.0581 2.9565L3.57285 10.4468H3.61327V10.4824L12.0581 17.937C12.5788 18.3967 13.4231 18.3967 13.9438 17.937L22.429 10.4468ZM3.66772 13.8595L10.1725 19.6015C11.7346 20.9804 14.2673 20.9804 15.8294 19.6015L22.3344 13.8593L22.3344 24.5705H3.66772V13.8595Z"
                                                  fill="#22262C"/>
                                        </svg>
                                    </div>
                                    <div className="text-center pt-2">
                                        <h5 className="">You don't have any notifications</h5>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                        <div className="col-12 col-md-12 col-lg-8 mt-2">
                            <motion.div initial={{scale: 0}}
                                        animate={{scale: 1}}
                                        transition={{duration: 0.2, delay: 0.2}}
                                        className={`background-gray radius-8`}>
                                <div className={`row  ${styles.noDevices} pl-4`}>
                                    <div className={`col-12 col-lg-7`}>
                                        <div className={`py-3`}>
                                            <h3 className={'font-weight-bold'}>
                                                PKT Cube
                                            </h3>
                                            <p>
                                                Now the internet pays you.
                                            </p>
                                            <p>
                                                The PKT Cube is the latest edge node
                                                from PKT Pal, perfect for your home or office! The device is
                                                plug & play and allows people with no technical background earn
                                                money
                                                from their internet. Just plug it in, set it and forget it, and
                                                get
                                                paid
                                                every 60 seconds for your wasted bandwidth. Now you can turn the
                                                unused
                                                internet bandwidth you are already paying for into CASH!
                                            </p>
                                            <a href={'https://pktpal.com/learn/'}
                                               className={`btn-wide btn-primary pt-3 pb-3 btn  text-white font-weight-bold radius-8`}>
                                                Start learning today
                                            </a>
                                        </div>
                                    </div>
                                    <div className={`col-12 col-lg-5`}>
                                        <img className={`${styles.dashboardDeviceImg} mt-3 mt-lg-5 img-fluid`}
                                             src={CubeImg}
                                             alt=""/>
                                    </div>

                                </div>
                            </motion.div>
                            <motion.div initial={{scale: 0}}
                                        animate={{scale: 1}}
                                        transition={{duration: 0.2, delay: 0.6}}
                                        className={`border radius-8 p-3 mt-4`}>
                                <p>Transaction history</p>
                                <div className={`my-5`}>
                                    <div className={'flex justify-content-center mb-2'}>
                                        <svg width="26" height="27" viewBox="0 0 26 27" fill="none"
                                             xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" clipRule="evenodd"
                                                  d="M24.9343 11.2549C25.2786 10.4216 25.0721 9.45085 24.3147 8.78226L15.8294 1.292C14.2673 -0.0869167 11.7346 -0.0869172 10.1725 1.292L1.68724 8.78226C0.929743 9.45092 0.723236 10.4218 1.06772 11.2552C1.02446 11.3711 1.00105 11.495 1.00105 11.6237V24.5705C1.00105 25.8706 2.19496 26.9245 3.66772 26.9245H22.3344C23.8071 26.9245 25.0011 25.8706 25.0011 24.5705V11.6237C25.0011 11.4949 24.9776 11.3709 24.9343 11.2549ZM22.429 10.4468L13.9438 2.9565C13.4231 2.49686 12.5788 2.49686 12.0581 2.9565L3.57285 10.4468H3.61327V10.4824L12.0581 17.937C12.5788 18.3967 13.4231 18.3967 13.9438 17.937L22.429 10.4468ZM3.66772 13.8595L10.1725 19.6015C11.7346 20.9804 14.2673 20.9804 15.8294 19.6015L22.3344 13.8593L22.3344 24.5705H3.66772V13.8595Z"
                                                  fill="#22262C"/>
                                        </svg>
                                    </div>
                                    <div className="text-center pt-2">
                                        <h5 className="">You don't have any transactions</h5>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                </div>
                <Footer/>
            </div>
        )
    }
}

export default withRouter(PaymentsNoService)