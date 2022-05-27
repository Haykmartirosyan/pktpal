import {Component} from "react";
import style from './style.module.scss'

class PWApopup extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showInstallMessage: false
        }
    }

    isIos() {
        const userAgent = window.navigator.userAgent.toLowerCase();
        return /iphone|ipad|ipod/.test( userAgent );
    }

    isInStandaloneMode() {
        return ('standalone' in window.navigator) && (window.navigator.standalone)
    }

    componentDidMount() {
        if (this.isIos() && !this.isInStandaloneMode()) {
            this.setState({ showInstallMessage: true });
        }
    }

    hidePopup() {
        this.setState({ showInstallMessage: false })
        localStorage.setItem('hidePopup', true)
    }

    render() {
        return (
            <div>
                {
                    this.state.showInstallMessage && !localStorage.getItem('hidePopup') && <div className={`${style.popup}`}>
                        <div className={`d-flex align-items-center justify-content-center`}>
                            <i className="far fa-plus-square mr-3 h3"></i>
                            <span>
                                Install the webapp on your iPhone: click to "Share" button and click to "Add to home screen"
                            </span>
                        </div>
                        <i onClick={this.hidePopup.bind(this)} className={`fas fa-times ${style.times}`}></i>
                        <i className={`fas fa-caret-down ${style.caret}`}></i>
                    </div>
                }
            </div>
        )
    }
}

export default PWApopup
