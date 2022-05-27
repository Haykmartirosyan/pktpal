import {Component} from "react";
import AdminHeader from "./Layouts/Header";
import ServiceEncryption from "../../../components/Encryption/ServiceEncryption";

class DetailEncryptions extends Component {
    constructor(props) {
        super(props);
        this.state = {
            serviceId: props.match.params.id
        }
    }

    render() {
        return (
            <div>
                <AdminHeader/>
                <ServiceEncryption serviceId={this.state.serviceId} props={this.props} fromPage={`admin`}/>
            </div>
        )
    }
}

export default DetailEncryptions