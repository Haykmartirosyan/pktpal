import React, {Component} from "react";

class PrintInfo extends Component {
    constructor(props) {
        super(props);
        this.state = {
            userName: '',
            macAddress: ''
        }
    }

    componentDidMount() {
        let urlParams = new URLSearchParams(window.location.search);
        let userName = urlParams.get('name');
        let macAddress = urlParams.get('mac_address');
        this.setState({
            userName: userName,
            macAddress: macAddress,
        }, () => {
            window.print()
        })
    }

    render() {
        return (
            <div>
                <div className={`container`}>
                    <div className={`row`}>
                        <div className={`col-12`}>
                            <table className={`table table-bordered mt-5 text-center`}>
                                <tbody>
                                <tr>
                                    <th>User name</th>
                                    <th>MAC address</th>
                                </tr>
                                <tr>
                                    <td>{this.state.userName}</td>
                                    <td>{this.state.macAddress}</td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default PrintInfo
