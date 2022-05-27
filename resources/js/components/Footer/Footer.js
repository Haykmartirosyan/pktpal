import React, {Component} from 'react';
import {Link} from "react-router-dom";
import logo from '../../../../public/images/PKT_Pal.svg';


class Footer extends Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        setTimeout(function () {
            let tidioScript = document.createElement("script");
            const TIDIO_PUBLIC_KEY = process.env.MIX_TIDIO_PUBLIC_KEY;
            tidioScript.src = `//code.tidio.co/${TIDIO_PUBLIC_KEY}.js`;
            document.body.appendChild(tidioScript);
        }, 3 * 1000);
    }

    render() {
        return (
            <footer className={this.props.stripMargin ? 'stripMargin' : null}>
                <div className="container">
                    <div className="row">
                        <div className="col-lg-2 order-1 mb-3">
                            <a
                                href={"https://pktpal.com/ "}
                                className="navbar-brand">
                                <img src={logo} className="img-fluid logo" alt=""/>
                            </a>
                        </div>

                        <div className="col-lg-3 order-4 order-lg-2 d-flex mb-3">
                            <ul className="navbar-nav mr-4">
                                <li className="nav-item ">
                                    <a
                                        href={"https://pktpal.com/pkt-cube/"}
                                        className="nav-link">Earn</a>
                                </li>
                                <li className="nav-item ">
                                    <a
                                        href={"https://pktpal.com/learn/"}
                                        className="nav-link">Learn</a>
                                </li>
                            </ul>

                            <ul className="navbar-nav ml-4">

                                <li className="nav-item ">
                                    <a href={"https://pktpal.com/pkt-cube/"}
                                       className="nav-link">PKT Cube</a>
                                </li>

                                <li className="nav-item ">
                                    <Link to="/" className="nav-link">Install wallet</Link>
                                </li>

                                <li className="nav-item ">
                                    <a href={"https://pktpal.com/faq/"}
                                       className="nav-link">FAQ</a>
                                </li>
                            </ul>
                        </div>

                        <div className={`col-12 d-block d-lg-none order-5 mb-3`}>
                            <p className="copyright-text m-0 d-block d-lg-none">PKT PAL © Copyright, 2020</p>
                        </div>


                        <div className="col-lg-4 order-3 mb-3">
                            <div>

                                <h6 className="subscribe-info">Subscribe to newsletter</h6>
                                <div className="flex justify-content-between login-inputs">

                                    <input id="email" type="email" placeholder="Your email"
                                           className="form-control border-0" required/>

                                    <button
                                        type="submit"
                                        className="btn btn-primary  login-button font-weight-bold subscribe-button">Subscribe
                                    </button>
                                </div>
                            </div>

                        </div>

                        <div className="col-lg-3 order-2 order-lg-4 mb-3">
                            <p className={`m-0`}>5830 E. 2nd St. Ste 8 Casper, WY 82609</p>
                            <p className="copyright-text m-0 mt-3 d-none d-lg-block">PKT PAL © Copyright, 2020</p>
                        </div>

                    </div>


                </div>
            </footer>
        )
    }
};
export default Footer
