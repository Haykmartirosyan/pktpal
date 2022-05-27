import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import {BrowserRouter, Route} from 'react-router-dom';
import Main from './Router';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import PWApopup from './views/Modals/PWApopup/PWApopup';
import {createStore, applyMiddleware} from 'redux';
import {Provider} from 'react-redux';
import thunk from 'redux-thunk';
import * as Sentry from "@sentry/react";
import {BrowserTracing} from "@sentry/tracing";
import { install } from "resize-observer";



const initialState = {
    init: {
        isAdmin: false,
        isShopManager: false,
        isFinancialManager: false,
        isEnterpriseClient: false,
        user: {}
    }
};


const reducer = (state = initialState, action) => {
    switch (action.type) {
        case "GET_USER": {
            return {
                ...state,
                init: {
                    isAdmin: action.payload.isAdmin,
                    isShopManager: action.payload.isShopManager,
                    isFinancialManager: action.payload.isFinancialManager,
                    isEnterpriseClient: action.payload.isEnterpriseClient,
                    user: action.payload.user,
                }
            }
        }
        default:
            return state;
    }

};


let store = createStore(reducer, applyMiddleware(thunk));

function getUser() {
    return (dispatch) => {
        axios.get(api_routes.user.authUser()).then((response) => {
            dispatch({type: "GET_USER", payload: response.data});
        }).catch(() => {
            dispatch({type: "GET_USER", payload: {}});
        })
    }
}

store.dispatch(getUser());

if (process.env.MIX_APP_ENV === 'production') {
    Sentry.init({
        dsn: "https://99e588f2b0884eebb0ab6ffd0fd4c726@o1131293.ingest.sentry.io/6335798",
        integrations: [new BrowserTracing()],
        tracesSampleRate: 1.0,
    });
}

if (!window.ResizeObserver) install();

class Index extends Component {
    render() {
        return (
            <Provider store={store}>
                <BrowserRouter>
                    <PWApopup/>
                    <Route component={Main}/>
                </BrowserRouter>
            </Provider>
        );
    }
}

store.subscribe(() => {
    ReactDOM.render(<Index/>, document.getElementById('index'));
});


// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register();
