import React, {Component} from 'react';
import Emitter from "../../services/emitter";
import styles from "../user/Dashboard/Pkt/Statisctics.module.scss"
import {isIOSDevice, miningLevels, setOrientation} from "../Helpers/SettingsHelpers";

class SetSchedule extends Component {
    constructor(props) {
        super(props);
        this.state = {
            day: [],
            miningLevels: miningLevels,
            from: '',
            to: '',
            hours: [],
            hoverHour: false,
            selectedHour: '',
            selectedLevel: '',
            weekdayFinalData: [],
            mobileSettings: false,
            showMobileSettings: window.innerWidth <= 850,
            disabledButton: false,
            showCheckbox: false,
            checkedCheckbox: false
        }
    }

    componentDidMount() {
        let _this = this;
        Emitter.on('openSetScheduleModal', (data) => {
            $('#setScheduleModal').modal('show');

            window.addEventListener("orientationchange", function () {
                _this.setState({
                    mobileSettings: setOrientation()
                })
            });

            if (_this.state.showMobileSettings) {
                _this.setState({
                    mobileSettings: setOrientation()
                })
            }
            this.setState({
                day: {...data},
                hours: [...data.hours],
                weekdayFinalData: [...data.selectedHours],
                showCheckbox: false,
                checkedCheckbox: false,
                disabledButton: false
            }, () => {
                _this.state.weekdayFinalData.map(function (elem) {
                    if (elem.mining_level === 'experimental') {
                        _this.setState({
                            showCheckbox: true,
                            checkedCheckbox: true,
                        })
                    }
                })
            })
        })

    }


    saveChanges() {
        let scheduled = {};
        scheduled.weekday = this.state.day['weekday'];
        scheduled.hours = this.state.weekdayFinalData;
        Emitter.emit('saveScheduleChanges', {scheduled: scheduled});
        this.setState({
            weekdayFinalData: []
        });
        localStorage.removeItem('weekday');
        $('#setScheduleModal').modal('hide');
    }

    discardSchedule() {
        this.setState({
            weekdayFinalData: [],
            checkedCheckbox: false,
            disabledButton: false,
            showCheckbox: false
        })
    }

    handleHourHover(from, level) {
        this.setState({
            hoverHour: true,
            selectedHour: from,
            selectedLevel: level
        })
    }

    discardHourHover() {
        this.setState({
            hoverHour: false
        })
    }

    saveLevel(hour, level) {
        let data = {
            from: hour.from.format('HH:mm'),
            to: hour.to.format('HH:mm'),
            mining_level: level
        };

        let index = this.state.weekdayFinalData.findIndex(data => data.from === hour.from.format('HH:mm') && data.to === hour.to.format('HH:mm'));
        let selectedLevel = this.state.weekdayFinalData.findIndex(data => data.from === hour.from.format('HH:mm') && data.to === hour.to.format('HH:mm') && data.mining_level === level)

        if (index > -1) {
            this.state.weekdayFinalData.splice(index, 1);
        }
        if (index > -1 && index === selectedLevel) {
            data = {}
        }
        if (Object.keys(data).length !== 0) {
            this.state.weekdayFinalData.push(data)
        }
        if (this.state.weekdayFinalData.length) {
            if (this.state.weekdayFinalData.some(e => e.mining_level === 'experimental')) {
                this.setState({
                    disabledButton: !this.state.checkedCheckbox,
                    showCheckbox: true,
                })
            } else {
                this.setState({
                    disabledButton: false,
                    showCheckbox: false,
                    checkedCheckbox: false
                })
            }
        } else {
            this.setState({
                disabledButton: false,
                showCheckbox: false,
                checkedCheckbox: false
            })
        }
    }

    findSelectedHour(hour, level) {
        let selectedLevels = this.state.weekdayFinalData.find((item) => {
            return item.from === hour.from.format('HH:mm') && item.to === hour.to.format('HH:mm') && item.mining_level === level
        });
        return !!selectedLevels;
    }

    handleInputChange(e) {
        this.setState({
            showCheckbox: true,
            checkedCheckbox: e.target.checked
        }, () => {
            this.setState({
                disabledButton: !e.target.checked
            })
        })
    }

    render() {
        return (
            <div className={`modal fade`} id="setScheduleModal" tabIndex="-1" role="dialog"
                 aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className={`${this.state.mobileSettings ? 'modal-fullscreen-xl' : 'modal-dialog modal-xl'}`}
                     role="document">
                    <div className={`modal-content p-3 ${this.state.mobileSettings ? styles.zoomContent : ''} `}>
                        <div
                            className={`modal-header border-0 pb-0 flex justify-content-around ${this.state.mobileSettings ? styles.hideHeader : ''}`}>
                            <h3 className={`font-weight-bold my-3`}>Schedule</h3>
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className={`modal-body px-4 pt-0 table-responsive
                        ${this.state.showMobileSettings && this.state.mobileSettings ? styles.mobileTableZoom : ''}`}>
                            <table className={`table`}>
                                <thead>
                                <tr>
                                    <th className={`align-middle border text-center`}>
                                        <button className={`btn`} onClick={() => {
                                            this.discardSchedule()
                                        }}>
                                            <svg width="26" height="28" viewBox="0 0 26 28" fill="none"
                                                 xmlns="http://www.w3.org/2000/svg">
                                                <path
                                                    d="M25.5 16.3619L22.487 28L19.2943 24.6956C13.4517 28.5059 5.63797 27.7775 0.548934 22.5104L2.92523 20.051C6.69286 23.9505 12.3806 24.6514 16.8386 22.154L14.2553 19.4803L25.5 16.3619Z"
                                                    fill="#141414"/>
                                                <path
                                                    d="M0.500001 11.6381L3.51302 -1.48144e-08L6.70571 3.30438C12.5483 -0.505904 20.362 0.22249 25.4511 5.48956L23.0748 7.94898C19.3071 4.04954 13.6194 3.34856 9.16144 5.84602L11.7447 8.51969L0.500001 11.6381Z"
                                                    fill="#141414"/>
                                            </svg>
                                        </button>
                                    </th>
                                    <th colSpan={`24`} className={`text-center border`}>
                                        <h3 className={`font-weight-bold`}>{this.state.day.weekday}</h3>
                                    </th>
                                </tr>
                                </thead>
                                <tbody>

                                {this.state.miningLevels.map((level, index) => {
                                    return (
                                        <tr key={index} className={`text-capitalize border`}>
                                            <td
                                                className={`align-middle border 
                                              `}
                                                align="center">
                                                {level.key}
                                            </td>
                                            {this.state.hours.map((hour, key) =>

                                                <td key={key}
                                                    className={`align-middle border-right-0 border-left-0 bg-light position-relative`}
                                                    align="center"
                                                    onMouseOver={() => {
                                                        !this.state.showMobileSettings ? this.handleHourHover(hour.from, level.key) : null
                                                    }}
                                                    onMouseLeave={() => {
                                                        !this.state.showMobileSettings ? this.discardHourHover() : null
                                                    }}
                                                    onClick={() => {
                                                        this.saveLevel(hour, level.key)
                                                    }}
                                                >
                                                    {this.state.hoverHour &&
                                                    (this.state.selectedHour === hour.from && this.state.selectedLevel === level.key) ||
                                                    this.findSelectedHour(hour, level.key)
                                                        ? (
                                                            <div className={`flex align-items-center justify-content-center position-absolute
                                                            ${this.state.mobileSettings && this.state.showMobileSettings ? styles.levelDivZoom : ""}
                                                                ${level.key === 'off' ? 'bg-secondary' : 'background-dark-blue'}
                                                                 ${styles.levelDiv} text-white`}>
                                                                <small
                                                                    className={`${this.state.mobileSettings && this.state.showMobileSettings && isIOSDevice() ?
                                                                        styles.levelFont : ''}`}
                                                                >{level.key === 'medium' ? 'med' : level.key === 'unlimited' ?
                                                                    <svg width="24" height="24" viewBox="0 0 24 24"
                                                                         fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                        <path
                                                                            d="M8.12132 9.87868L10.2044 11.9617L10.2106 11.9555L11.6631 13.408L11.6693 13.4142L13.7907 15.5355C15.7433 17.4882 18.9091 17.4882 20.8617 15.5355C22.8144 13.5829 22.8144 10.4171 20.8617 8.46447C18.9091 6.51184 15.7433 6.51184 13.7907 8.46447L13.0773 9.17786L14.4915 10.5921L15.2049 9.87868C16.3764 8.70711 18.2759 8.70711 19.4475 9.87868C20.6191 11.0503 20.6191 12.9497 19.4475 14.1213C18.2759 15.2929 16.3764 15.2929 15.2049 14.1213L13.1326 12.0491L13.1263 12.0554L9.53553 8.46447C7.58291 6.51184 4.41709 6.51184 2.46447 8.46447C0.511845 10.4171 0.511845 13.5829 2.46447 15.5355C4.41709 17.4882 7.58291 17.4882 9.53553 15.5355L10.2488 14.8222L8.83463 13.408L8.12132 14.1213C6.94975 15.2929 5.05025 15.2929 3.87868 14.1213C2.70711 12.9497 2.70711 11.0503 3.87868 9.87868C5.05025 8.70711 6.94975 8.70711 8.12132 9.87868Z"
                                                                            fill="white"/>
                                                                    </svg>
                                                                    :
                                                                    level.key === 'experimental' ? 'exp' : level.key}</small>
                                                            </div>
                                                        ) : null}
                                                </td>
                                            )}
                                        </tr>)
                                })}
                                <tr>
                                    <td className={`border-0`}/>
                                    {this.state.hours.map((hour, key) =>
                                        <td key={key}
                                            className={`align-middle border-0 text-nowrap 
                                            ${key % 2 !== 0 ? 'px-3' : 'px-0'}`}
                                            align="center">
                                            {key % 2 === 0 ? hour.from.format('h A') : ''}
                                        </td>
                                    )}
                                </tr>

                                </tbody>
                            </table>
                            {this.state.showCheckbox || this.state.checkedCheckbox ? (
                                <div className={`flex align-items-center`}>
                                    <input type={"checkbox"} className={`largeCheckbox`}
                                           checked={this.state.checkedCheckbox}
                                           onChange={(e) => this.handleInputChange(e)}/>
                                    <span className={`ml-3`}>
                                       You are switching your device to “Experimental Mode”. This is a manual functionality
                                        and PKT Pal cannot guarantee good or bad mining rates. By switching to “Experimental Mode”
                                        you take full responsibility of your yields and mining income.
                                    </span>
                                </div>
                            ) : null}

                            <div className={`flex justify-content-center my-3`}>
                                <button className={`btn background-dark-blue btn-wide text-white
                                ${this.state.disabledButton ? 'disabled' : ''}`}
                                        disabled={this.state.disabledButton}
                                        onClick={() => this.saveChanges()}>
                                    <span className={`font-weight-bold`}>Apply</span>
                                </button>
                                {this.state.mobileSettings ? (
                                    <button className={`btn bg-light border btn-wide text-white ml-3`}
                                            data-dismiss="modal">
                                        <span className={`font-weight-bold text-black`}>Cancel</span>
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default SetSchedule
