import React from 'react';
import {Redirect, Route, withRouter} from 'react-router-dom';

const PrivateRoute = ({component: Component, props, path, user, ...rest}) => (
    <Route path={path}
           {...rest}
           render={props => user?.user ? (
               <Component {...props} />) : (<Redirect to={{
                   pathname: "/login",
                   state: {
                       prevLocation: location.pathname,
                       error: "You need to login first!",
                   },
               }}
               />
           )
           }
    />);
export default withRouter(PrivateRoute);
