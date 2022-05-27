import React, {Component} from 'react';
import {withRouter} from "react-router-dom";
import errorImg from '../../../../public/images/404_error_Shadow.png'
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import styles from "./NotFound.module.scss";

class NotFound extends Component {
    render() {
        return (
            <div>
                <Header/>
                <div className="container">
                    <div className='row my-5'>
                        <div className='col-12 col-lg-7 text-center my-lg-5'>
                            <img src={errorImg} className="img-fluid" alt=""/>
                        </div>
                        <div className='col-12 col-lg-5 text-center mb-lg-5 '>
                            <p className={`font-weight-bolder ${styles.notFoundSizeNumber}`}>404</p>
                            <h3 className={`font-weight-bold ${styles.notFoundSizeText}`}>The page you were looking for
                                couldn't be found.</h3>
                        </div>
                    </div>
                </div>
                <Footer/>
            </div>
        )
    }
}

export default withRouter(NotFound)
