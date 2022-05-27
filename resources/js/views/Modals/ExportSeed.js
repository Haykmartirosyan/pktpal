import React, {Component} from 'react'
import Emitter from "../../services/emitter";
import {Load} from "../../components/Loadings/Load";
import styles from '../user/Dashboard/Pkt/Statisctics.module.scss'
import * as Sentry from "@sentry/react";

class ExportSeed extends Component {
    constructor(props) {
        super(props);
        this.state = {
            macAddress: '',
            errors: {},
            exportPassphrase: '',
            exportPassphraseConfirm: '',
            waitExportResponse: false,
            wifiChecked: false,
            seedId: '',
            exportUrl: '',
            savedPassparse: false,
            resetPassparse: false,
            seedKeep: false,
            passphraseKeep: false,
            seedGive: false
        };
        this.handleExportPassphrase = this.handleExportPassphrase.bind(this);
        this.handleExportPassphraseConfirm = this.handleExportPassphraseConfirm.bind(this);
        this.handleSavedPassparse = this.handleSavedPassparse.bind(this);
        this.handleResetPassparse = this.handleResetPassparse.bind(this);
        this.handleSeedKeep = this.handleSeedKeep.bind(this);
        this.handlePassphraseKeep = this.handlePassphraseKeep.bind(this);
        this.handleSeedGive = this.handleSeedGive.bind(this);
    }

    componentDidMount() {
        let _this = this;
        Emitter.on('openExportSeedModal', (data) => {
            _this.resetVariables();
            _this.setState({
                macAddress: data.macAddress
            }, () => {
                _this.generateToken();
            });
            $('#exportSeedModal').modal('show');
        });


        push.subscribe('seed-exported').bind('App\\Events\\SeedExported', function (data) {
            console.log('seed-response', data)
            if (data.id == _this.state.seedId) {
                _this.setState({
                    waitExportResponse: false,
                    seedId: '',
                    exportPassphrase: '',
                }, () => {
                    _this.setState({
                        exportUrl: data.url,
                    })
                })
            }

        });
    }

    resetVariables() {
        this.setState({
            exportPassphrase: '',
            exportPassphraseConfirm: '',
            savedPassparse: false,
            resetPassparse: false,
            wifiChecked: false,
            errors: {},
        })
    }

    closeModal() {
        Emitter.emit('closingModal', true);
        $('#exportSeedModal').modal('hide')
    }

    generateToken() {
        let _this = this;
        window.pkteerGetId(_this.state.macAddress, function (error) {
            if (error) {
                console.log('error', error);
                return;
            }

            _this.setState({
                wifiChecked: true
            })
        });
    }

    handleExportPassphrase(e) {
        let value = e.target.value;
        this.setState({
            exportPassphrase: value
        });
    }

    handleExportPassphraseConfirm(e) {
        let value = e.target.value;
        this.setState({
            exportPassphraseConfirm: value
        });
    }

    handleSavedPassparse(e) {
        let value = e.target.checked;
        this.setState({
            savedPassparse: value
        });
    }

    handleResetPassparse(e) {
        let value = e.target.checked;
        this.setState({
            resetPassparse: value
        });
    }

    handleSeedKeep(e) {
        let value = e.target.checked;
        this.setState({
            seedKeep: value
        });
    }

    handlePassphraseKeep(e) {
        let value = e.target.checked;
        this.setState({
            passphraseKeep: value
        });
    }

    handleSeedGive(e) {
        let value = e.target.checked;
        this.setState({
            seedGive: value
        });
    }

    validateData() {
        let _this = this;
        let isValid = true;
        let errors = {};

        if (!_this.state.exportPassphrase) {
            errors["exportPassphrase"] = "Seed Encryption Passphrase is required";
            isValid = false;
        }

        if (!_this.state.exportPassphraseConfirm) {
            errors["exportPassphraseConfirm"] = "Seed Encryption Passphrase Confirmation is required";
            isValid = false;
        }

        if (!_this.state.resetPassparse) {
            errors["resetPassparse"] = "invalid";
            isValid = false;
        }

        if (!_this.state.savedPassparse) {
            errors["savedPassparse"] = "invalid";
            isValid = false;
        }

        if (_this.state.exportPassphraseConfirm && _this.state.exportPassphrase) {
            if (_this.state.exportPassphraseConfirm !== _this.state.exportPassphrase) {
                errors["exportPassphraseConfirm"] = "Your passphrase and confirmation passphrase do not match";
                isValid = false;

            }
        }
        this.setState({errors: errors});
        return isValid;
    }

    seedExport() {
        let _this = this;
        let isValid = _this.validateData();

        if (isValid && _this.state.wifiChecked) {
            _this.setPassphrase().then((response) => {
                if (response.data.data) {
                    _this.setState({
                        waitExportResponse: true,
                        seedId: response.data.data.id
                    })
                }
            })
        }
    }

    setPassphrase() {
        let _this = this;
        return new Promise((resolve, reject) => {
            let data = {
                exportPassphrase: _this.state.exportPassphrase,
                macAddress: _this.state.macAddress
            };
            axios.post(api_routes.user.seedExport(), data).then(response => {
                return response;
            }).then(json => {
                resolve(json);
            }).catch(error => {
                Sentry.captureException(error);
                reject(error)
            });
        });
    }

    resetData() {
        this.setState({
            waitExportResponse: false,
            seedId: '',
            exportPassphrase: '',
            exportUrl: '',
            seedGive: '',
            passphraseKeep: '',
            seedKeep: '',
        });
        this.closeModal();
    }

    getSeedValidation() {
        let errors = {};
        let isValid = true

        if (!this.state.seedKeep) {
            errors["seedKeep"] = 'invalid'
            isValid = false
        }

        if (!this.state.seedGive) {
            errors["seedGive"] = 'invalid'
            isValid = false
        }

        if (!this.state.passphraseKeep) {
            errors["passphraseKeep"] = 'invalid'
            isValid = false
        }

        this.setState({errors: errors});
        return isValid;
    }

    render() {
        return (
            <div>
                <div className="modal fade" id="exportSeedModal" tabIndex="-1" role="dialog"
                     aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
                        <div className="modal-content p-2">
                            {!this.state.waitExportResponse ? (

                                <div>

                                    <div className={`modal-header pb-0 border-0`}>
                                        <button type="button" className="close float-right"
                                                onClick={() => this.closeModal()}
                                                aria-label="Close">
                                            <span aria-hidden="true">&times;</span>
                                        </button>
                                    </div>
                                    {!this.state.exportUrl ? (


                                        <div>
                                            <div className="modal-body">

                                                <div className={'container'}>

                                                    <h5 className={'weight-500'}>Export your wallet’s seed</h5>
                                                    <h6 className={'pt-3'}>Please follow the instructions:</h6>

                                                    <ul>
                                                        <li className="font-14 weight-500 mb-2">
                                                            Make sure you are on the same wifi as your PktCube
                                                        </li>
                                                        <li className="font-14 weight-500 mb-2">
                                                            Click the button below to export
                                                        </li>
                                                        <li className="font-14 weight-500 mb-2">
                                                            The button will open a new window on your device
                                                        </li>
                                                        <li className="font-14 weight-500 mb-2">
                                                            If the window does not load, double-check that your
                                                            PktCube is turned on and that you are on the same wifi
                                                        </li>
                                                        <li className="font-14 weight-500 mb-2">
                                                            Create a password to be able to export a seed.
                                                            We suggest you to create a strong password
                                                        </li>
                                                    </ul>

                                                    <div className={'pt-3'}>
                                                        <div className="flex justify-content-between">
                                                            <p className={'display-5'}>Seed Encryption Passphrase</p>

                                                            <a href="https://useapassphrase.com/"
                                                               className={'font-14 color-dark-blue'}
                                                               target={`_blank`}>
                                                                <u>Read More</u>
                                                            </a>
                                                        </div>
                                                        <input type="text"
                                                               value={this.state.exportPassphrase}

                                                               onChange={this.handleExportPassphrase}
                                                               className={` ${this.state.errors["exportPassphrase"] ? 'borderDanger' : 'border-0'} p-4 background-gray form-control font-weight-bold`}/>
                                                        <p className={'text-danger font-14'}>{this.state.errors["exportPassphrase"]}</p>

                                                    </div>
                                                    <div className={'pt-3'}>
                                                        <div className="flex justify-content-between">
                                                            <p className={'display-5'}>Confirm Seed Encryption
                                                                Passphrase</p>
                                                        </div>
                                                        <input type="text"
                                                               onChange={this.handleExportPassphraseConfirm}
                                                               value={this.state.exportPassphraseConfirm}
                                                               className={` ${this.state.errors["exportPassphraseConfirm"] ? 'borderDanger' : 'border-0'} p-4 background-gray form-control font-weight-bold`}/>
                                                        <p className={'text-danger font-14'}>{this.state.errors["exportPassphraseConfirm"]}</p>
                                                    </div>

                                                    <div className={'pt-2 pl-5'}>
                                                        <form
                                                            className={`${this.state.errors["savedPassparse"] || this.state.errors["resetPassparse"] ? 'was-validated' : ''}`}>
                                                            <div className="form-check">
                                                                <input
                                                                    className={`${styles.exportCheckbox} form-check-input`}
                                                                    type="checkbox" checked={this.state.savedPassparse}
                                                                    onChange={this.handleSavedPassparse}
                                                                    required
                                                                />
                                                                <label className="form-check-label pl-3 font-14 mt-1"
                                                                       htmlFor="flexCheckDefault">
                                                                    I have safely written down and saved my passphrase
                                                                </label>
                                                            </div>
                                                            <div className="form-check">
                                                                <input
                                                                    className={`${styles.exportCheckbox} form-check-input`}
                                                                    type="checkbox"
                                                                    checked={this.state.resetPassparse}
                                                                    onChange={this.handleResetPassparse}
                                                                    required
                                                                />
                                                                <label className="form-check-label pl-3 font-14 mt-1"
                                                                       htmlFor="flexCheckDefault">
                                                                    I understand that PKT Pal cannot reset passphrase
                                                                </label>
                                                            </div>
                                                        </form>
                                                    </div>
                                                </div>

                                            </div>

                                            <div className={`modal-footer text-center border-0`}>
                                                <button
                                                    onClick={() => this.seedExport()}
                                                    className={`btn-wide background-dark-blue btn text-white font-weight-bold radius-8 m-auto`}>
                                                    Export seed
                                                </button>
                                            </div>
                                        </div>

                                    ) : (
                                        <div className={'text-center'}>
                                            <div className="flex justify-content-center mb-3">
                                                <svg width="50" height="50" viewBox="0 0 50 50" fill="none"
                                                     xmlns="http://www.w3.org/2000/svg">
                                                    <path
                                                        d="M21.006 34.8038L11.3636 25.1615L14.5778 21.9473L21.006 28.3756L33.8625 15.5191L37.0766 18.7332L21.006 34.8038Z"
                                                        fill="#4174DB"/>
                                                    <path fillRule="evenodd" clipRule="evenodd"
                                                          d="M0 25C0 11.1929 11.1929 0 25 0C38.8071 0 50 11.1929 50 25C50 38.8071 38.8071 50 25 50C11.1929 50 0 38.8071 0 25ZM25 45.4545C13.7033 45.4545 4.54545 36.2967 4.54545 25C4.54545 13.7033 13.7033 4.54545 25 4.54545C36.2967 4.54545 45.4545 13.7033 45.4545 25C45.4545 36.2967 36.2967 45.4545 25 45.4545Z"
                                                          fill="#4174DB"/>
                                                </svg>
                                            </div>
                                            <h3 className={'weight-500 text-center'}>Your wallet's seed is ready!</h3>

                                            <p className={'w-50 m-auto weight-500 text-center pt-3'}>
                                                Make sure you are on the same wifi as your PKT Cube, or else
                                                the export button will not work.
                                            </p>


                                            <p className={'w-50 m-auto weight-500 text-center pt-2'}>The seed export
                                                button will expire in 5 minutes
                                            </p>


                                            <div className="w-50 m-auto weight-500 pt-2">
                                                <div className={'pt-2 text-left'}>
                                                    <form
                                                        className={`${this.state.errors["seedKeep"] || this.state.errors["seedGive"]
                                                        || this.state.errors["passphraseKeep"] ? 'was-validated' : ''}`}>
                                                        <div className="form-check mt-3">
                                                            <input
                                                                className={`${styles.exportCheckbox} form-check-input`}
                                                                type="checkbox"
                                                                onChange={this.handleSeedKeep}
                                                                required
                                                            />
                                                            <label className="form-check-label pl-3 font-14 mt-1"
                                                                   htmlFor="flexCheckDefault">
                                                                I will write down my seed and I will keep it safe
                                                            </label>
                                                        </div>

                                                        <div className="form-check mt-2">
                                                            <input
                                                                className={`${styles.exportCheckbox} form-check-input`}
                                                                type="checkbox"
                                                                onChange={this.handlePassphraseKeep}
                                                                required
                                                            />
                                                            <label className="form-check-label pl-3 font-14 mt-1"
                                                                   htmlFor="flexCheckDefault">
                                                                I wrote down my passphrase and I will keep it safe
                                                            </label>

                                                        </div>

                                                        <div className="form-check mt-2">
                                                            <input
                                                                className={`${styles.exportCheckbox} form-check-input`}
                                                                type="checkbox"
                                                                onChange={this.handleSeedGive}
                                                                required
                                                            />
                                                            <label className="form-check-label pl-3 font-14 mt-1"
                                                                   htmlFor="flexCheckDefault">
                                                                I will never give my seed or passphrase to anyone
                                                            </label>

                                                        </div>
                                                    </form>

                                                </div>

                                            </div>


                                            <div className={`modal-footer text-center border-0 mt-3`}>
                                                {this.state.seedGive && this.state.passphraseKeep && this.state.seedKeep ? (
                                                    <a href={this.state.exportUrl} target={'_blank'}
                                                       onClick={() => this.resetData()}
                                                       className={`
                                                       btn-wide btn background-dark-blue btn text-white font-weight-bold radius-8 m-auto`}>
                                                        Get my seed
                                                    </a>
                                                ) : (
                                                    <button
                                                        className={`btn-wide btn background-dark-blue btn text-white font-weight-bold radius-8 m-auto`}
                                                        onClick={() => this.getSeedValidation()}>Get my seed
                                                    </button>
                                                )}
                                            </div>

                                        </div>

                                    )}

                                </div>
                            ) : (
                                <div>
                                    <h5 className={'text-center mt-3'}>The seed is generating now</h5>
                                    <Load/>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default ExportSeed
