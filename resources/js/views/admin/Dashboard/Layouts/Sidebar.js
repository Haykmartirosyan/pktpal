import React, {Component} from 'react'
import styles from './Sidebard.module.css';
import DashboardIcon from "../../../../../../public/images/icons/dashboard-24px.png";
import MenuIcon from "../../../../../../public/images/icons/menu-24px.png";
import {Link} from "react-router-dom";
import Emitter from "../../../../services/emitter";


class AdminSidebar extends Component {
    constructor(props) {
        super(props);
        this.state = {
            sidebarClosed: false
        };
    }

    toggleSidebar() {
        this.setState({
            sidebarClosed: !this.state.sidebarClosed
        })
        if (!localStorage.getItem('sidebarClosed')) {
            localStorage.setItem('sidebarClosed', '1');
        } else {
            localStorage.removeItem('sidebarClosed');
        }
        Emitter.emit('toggleSidebar', true);
    }


    render() {
        return (
            <div>
                <div className={`${styles.sidebarWrapper} background-gray`}>
                    <ul className={`${styles.sidebarNav} pt-5`}>
                        <li>
                            <a
                                onClick={() => this.toggleSidebar()}
                                href="#" role={'button'}
                                className={`${localStorage.getItem('sidebarClosed') ? 'text-left' : 'text-right'}`}>
                                <img src={MenuIcon} alt="" className={'pr-2'}/>
                            </a>
                            <Link
                                to={{pathname: '/admin/dashboard'}}>
                                <img src={DashboardIcon} alt="" className={'pr-2'}/>
                                {!localStorage.getItem('sidebarClosed') ? (
                                    <span> Dashboard</span>
                                ) : null}
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        )
    }
}

export default AdminSidebar
