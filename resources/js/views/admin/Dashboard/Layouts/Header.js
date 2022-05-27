import React, {Component} from 'react'
import {Link} from "react-router-dom";
import {connect} from "react-redux";
import Notifications from "./Notifications";


class AdminHeader extends Component {
    constructor(props) {
        super(props);
        this.state = {
            splitLocation: location.pathname.split('/')
        };
    }


    render() {
        return (
            <nav className="navbar navbar-expand-lg navbar-light bg-white">
                <div className="container">
                    <button className="navbar-toggler" type="button" data-toggle="collapse"
                            data-target="#navbarSupportedContent"
                            aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"/>
                    </button>
                    <div className="collapse navbar-collapse" id="navbarSupportedContent">
                        <ul className="nav navbar-nav m-auto">
                            <li>
                                <Link to="/admin/dashboard"
                                      className={`nav-link ${this.state.splitLocation[2] === "dashboard" ? "active" : ""} `}>
                                    Admin Dashboard</Link>
                            </li>

                            <li>
                                <Link to="/admin/orders"
                                      className={`nav-link ml-4 ${this.state.splitLocation[2] === "orders" ? "active" : ""} `}>
                                    Orders</Link>
                            </li>

                            {this.props.init.user && (this.props.init.user.user_email == 'cjd@cjdns.fr' || this.props.init.user.user_email == 'greta@pktpal.com') ? (
                                <li className="nav-item ">
                                    <Link to="/financial"
                                          className={`nav-link ${this.state.splitLocation[1] === "financial" ? "active" : ""} `}>
                                        Financial
                                    </Link>
                                </li>
                            ) : null}

                            <li>
                                <Link to="/admin/analytics"
                                      className={`nav-link ml-4 ${this.state.splitLocation[2] === "analytics" ? "active" : ""} `}>
                                    Analytics</Link>
                            </li>

                            <li>
                                <Link to="/admin/clickhouse"
                                      className={`nav-link ml-4 ${this.state.splitLocation[2] === "clickhouse" ? "active" : ""} `}>
                                    Clickhouse
                                </Link>
                            </li>

                        </ul>
                        <ul className="list-inline ml-3">
                            {this.props.init.user.first_name && this.props.init.user.last_name ? this.props.init.user.first_name + ' ' + this.props.init.user.last_name : this.props.init.user.display_name}
                        </ul>
                        <Notifications/>
                    </div>
                </div>
            </nav>
        )
    }
}

const init = state => ({
    init: state.init,
});


export default connect(init, null)(AdminHeader)

