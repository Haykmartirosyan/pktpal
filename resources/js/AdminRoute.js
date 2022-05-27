import React from 'react';
import {Redirect, Route, withRouter} from 'react-router-dom';

const AdminRoute = ({component: Component, props, path, user, ...rest}) => (

    <Route path={path}
           {...rest}
           render={props => user.user && (user?.isAdmin || user?.isShopManager || user?.isFinancialManager) ? (
               <Component {...props} />) : (<Redirect to={{
                   pathname: user.user ? '/dashboard' : '/login',
                   state: {
                       prevLocation: location.pathname,
                       error: "You need to login first!",
                   },
               }}
               />
           )
           }
    />);
export default withRouter(AdminRoute);
