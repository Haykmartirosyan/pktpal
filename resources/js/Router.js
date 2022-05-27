import React, {Component} from 'react';
import {Route, Switch} from 'react-router-dom';
import Login from './views/Login/Login';
import NotFound from './views/NotFound/NotFound'
import PrivateRoute from './PrivateRoute'
import Dashboard from './views/user/Dashboard/Dashboard';
import Payments from './views/user/Bill/Payments';
import Statistics from "./views/user/Dashboard/Pkt/Statistics";
import StatisticsRackMode from "./views/user/Dashboard/Pkt/StatisticsRackMode";
import AdminDashboard from './views/admin/Dashboard/Dashboard'
import AdminPktDetails from './views/admin/Dashboard/Details'
import AdminRoute from "./AdminRoute";
import Services from "./views/user/Bill/Services";
import Upcoming from "./views/user/Bill/Upcoming";
import AdminOrFinancialManagerRoute from "./AdminOrFinancialManagerRoute";
import FinancialPayments from "./views/financialManager/Payments";
import FinancialDetails from "./views/financialManager/Details";
import {connect} from "react-redux";
import Settings from "./views/user/Dashboard/Pkt/Settings";
import PaymentsNoService from "./views/user/Bill/PaymentsNoService";
import AdminSettings from "./views/admin/Dashboard/Settings";
import Orders from "./views/admin/Dashboard/Orders"
import PrintInfo from "./views/admin/Dashboard/PrintInfo";
import EncryptionDiagram from "./views/user/Dashboard/Pkt/EncryptionDiagram";
import Analytics from "./views/admin/Dashboard/Analytics"
import Clickhouse from "./views/admin/Dashboard/Clickhouse"
import DetailEncryptions from "./views/admin/Dashboard/DetailEncryptions";


class Main extends Component {
    render() {
        return (
            <Switch>
                <Route exact path='/' component={Dashboard}/>
                <Route path='/login' component={Login}/>

                <PrivateRoute exact path='/dashboard' component={Dashboard} user={this.props.init}/>
                <PrivateRoute exact path='/pkt/details/:id' component={Statistics} user={this.props.init}/>
                <PrivateRoute exact path='/pkt/encryption/:id' component={EncryptionDiagram} user={this.props.init}/>
                <PrivateRoute exact path='/pkt/rack/details/:id' component={StatisticsRackMode} user={this.props.init}/>
                <PrivateRoute exact path='/pkt/settings/:id' component={Settings} user={this.props.init}/>

                <AdminRoute exact path='/admin/dashboard' component={AdminDashboard} user={this.props.init}/>
                <AdminRoute exact path='/admin/pkt/details/:id' component={AdminPktDetails} user={this.props.init}/>
                <AdminRoute exact path='/admin/settings' component={AdminSettings} user={this.props.init}/>
                <AdminRoute exact path='/admin/orders' component={Orders} user={this.props.init}/>
                <AdminRoute exact path='/admin/service/print' component={PrintInfo} user={this.props.init}/>
                <AdminRoute exact path='/admin/analytics' component={Analytics} user={this.props.init}/>
                <AdminRoute exact path='/admin/clickhouse' component={Clickhouse} user={this.props.init}/>
                <AdminRoute exact path='/admin/pkt/details/encryptions/:id' component={DetailEncryptions}
                            user={this.props.init}/>


                <PrivateRoute exact path='/payments/services/:id' component={Services} user={this.props.init}/>
                <PrivateRoute exact path='/payments/upcoming' component={Upcoming} user={this.props.init}/>
                <PrivateRoute exact path='/payments/no-service' component={PaymentsNoService} user={this.props.init}/>
                <PrivateRoute exact path='/payments/:id' component={Payments} user={this.props.init}/>

                <AdminOrFinancialManagerRoute exact path='/financial/payment/details/:id' component={FinancialDetails}
                                              user={this.props.init}/>
                <AdminOrFinancialManagerRoute exact path='/financial/' component={FinancialPayments}
                                              user={this.props.init}/>

                <Route component={NotFound}/>
            </Switch>
        );
    }
}

const init = state => ({
    init: state.init,
});
export default connect(init, null)(Main)
