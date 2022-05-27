import {Component} from "react";
import React from "react";

class DeviceDropDown extends Component {
    constructor(props) {
        super(props);

    }

    render() {
        return (
            <div>
                {this.props.pktServices.length > 1 ? (
                    <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                        {
                            this.props.showDropDownContent ? (
                                this.props.pktServices.map((pktService, index) => {
                                    return (
                                        <div key={pktService.id}>
                                            <a className="dropdown-item"
                                               href={pktService.type == 'node' ? `/pkt/details/` + pktService.id : `/pkt/rack/details/` + pktService.id}>
                                                {pktService.name ? pktService.name : 'My PKT Cube'}
                                                <span> {!pktService.name ? index + 1 : ''}</span>
                                            </a>
                                        </div>
                                    )
                                })
                            ) : null}
                    </div>
                ) : null}
            </div>
        )
    }

}

export default DeviceDropDown