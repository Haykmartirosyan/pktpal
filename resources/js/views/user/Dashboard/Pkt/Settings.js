import React, {Component} from 'react'
import moment from "moment";
import NotificationSystem from 'react-notification-system';
import Header from "../../../../components/Header/Header";
import Switch from "react-switch";
import Footer from "../../../../components/Footer/Footer";
import styles from "./Statisctics.module.scss"
import Emitter from "../../../../services/emitter";
import {motion} from "framer-motion";
import Tooltip from "rc-tooltip/es";
import SetSchedule from "../../../Modals/SetSchedule";
import {Load} from "../../../../components/Loadings/Load";
import {
    createSettings,
    getSettings,
    hours,
    hoursString,
    isIOSDevice,
    openSetScheduleModal,
    orderWeekdays,
    setOrientation,
    splitHours,
    generateSchedule,
    updateSMSOption,
    weekdays
} from "../../../Helpers/SettingsHelpers";
import ResetSchedule from "../../../Modals/ResetSchedule";
import * as Sentry from "@sentry/react";

class Settings extends Component {
    notificationSystem = React.createRef();

    constructor(props) {
        super(props);
        this.state = {
            weekdays: weekdays,
            hours: hours,
            options: {
                smsNotification: false
            },
            serviceId: props.match.params.id,
            showLoading: true,
            showLoadingSaved: true,
            hasSettings: false,
            saveLoading: false,
            discardLoading: false,
            calendarKey: Math.random(),
            showMobileSettings: window.innerWidth <= 850,
            mobileSettings: false,
            hoverDay: false,
            selectedWeekday: '',
            selectDayForHover: '',
            selectedDay: false,
            copiedDay: false,
            hoveredCopiedDay: '',
            scheduledDays: [],
            selectedIndexes: [],
            showCalendarLoading: false
        }
    }

    componentDidMount() {
        let _this = this;

        if (_this.state.showMobileSettings) {
            _this.setState({
                mobileSettings: setOrientation()
            })
        }

        window.addEventListener("orientationchange", function () {
            setTimeout(function () {
                _this.setState({
                    mobileSettings: setOrientation()
                })
            }, 500)
        });

        let selectedWeekday = localStorage.getItem('weekday');

        if (selectedWeekday) {
            let weekday = JSON.parse(selectedWeekday);
            let storageTime = moment(weekday.expiry).utc().format('HH:mm:ss');
            let now = moment().format('HH:mm:ss');

            if (storageTime < now) {
                localStorage.removeItem('weekday')
            } else {
                _this.setState({
                    selectedWeekday: weekday.value,
                    selectedDay: true
                })
            }
        }
        this.mountComponent();

        Emitter.on('saveScheduleChanges', (data) => {
            let foundedWeekday = _this.state.weekdays.find(day => day.weekday == data.scheduled.weekday);

            let newHours = [];
            if (data.scheduled.hours.length) {

                data.scheduled.hours.map(hour => {
                    let foundedHour = foundedWeekday.hours.find(weekdayHour => {
                        return weekdayHour.from === hour.from && weekdayHour.to === hour.to
                    });

                    if (foundedHour) {

                        foundedHour.mining_level = hour.mining_level;

                        if (_this.state.scheduledDays.length) {
                            let index = _this.state.scheduledDays.findIndex(hour => {
                                return hour.weekday == foundedWeekday.weekday;
                            });

                            if (index > -1) {
                                _this.state.scheduledDays.splice(index, 1)
                            }

                        }

                        if (!newHours.length) {

                            newHours.push({
                                weekday: foundedWeekday.weekday,
                                hours: [foundedHour]
                            })
                        } else {
                            let alreadyChangedWeekday = newHours.find(hour => {
                                return hour.weekday == foundedWeekday.weekday;
                            });

                            if (alreadyChangedWeekday) {
                                alreadyChangedWeekday.hours.push(foundedHour)
                            } else {
                                newHours.push({
                                    weekday: foundedWeekday.weekday,
                                    hours: [foundedHour]
                                })
                            }

                        }
                    } else {
                        newHours.push({
                            weekday: data.scheduled.weekday,
                            hours: data.scheduled.hours
                        })
                    }
                });
            } else {
                newHours.push({
                    weekday: data.scheduled.weekday,
                    hours: []
                });

                if (_this.state.scheduledDays.length) {
                    let index = _this.state.scheduledDays.findIndex(hour => {
                        return hour.weekday == data.scheduled.weekday;
                    });

                    if (index > -1) {
                        _this.state.scheduledDays.splice(index, 1)
                    }
                }
            }

            let newData = newHours.concat(_this.state.scheduledDays);

            _this.generateFinalSchedule(newData);
        });

        Emitter.on('refreshSchedule', () => {
            this.state.weekdays.map(weekday => {
                weekday.hours = [];
            });
            this.setState({
                calendarKey: Math.random(),
                scheduledDays: [],
                selectedDay: false,
                selectedWeekday: '',
            }, () => {
                _this.mountComponent()
            })
        })
    }

    mountComponent() {
        let _this = this;

        getSettings(this.state.serviceId).then((data) => {
                if (data.data) {
                    if (Object.keys(data.data.days).length) {
                        data.data.days.map((item) => {
                            item.from = moment(item.from, 'HH:mm');
                            item.to = moment(item.to, 'HH:mm');
                            let splitCount = item.to.diff(item.from, 'minutes') / 60;
                            let start = item.from.format('HH:mm');

                            item.hours = splitHours(splitCount, start, item);
                        });

                        const difference = this.state.weekdays.filter(({weekday: option1}) => !data.data.days.some(({weekday: option2}) => option2 === option1));

                        difference.map((elem) => {
                            data.data.days.push(elem)
                        });

                        let temp = [];
                        let newHours = [];
                        data.data.days.map((day) => {
                            if (!temp.includes(day.weekday)) {
                                temp.push(day.weekday)
                            } else {
                                day.hours.map(hour => {
                                    hour.weekday = day.weekday;
                                    newHours.push(hour)
                                })
                            }
                        });

                        newHours.map(hour => {
                            let find = data.data.days.find(day => day.weekday === hour.weekday);
                            find.hours.push(hour)
                        });

                        let resArr = [];

                        data.data.days.filter(function (item) {
                            let i = resArr.findIndex(x => (x.weekday === item.weekday));
                            if (i <= -1) {
                                resArr.push(item);
                            }
                            return null;
                        });

                        let selectedHours = resArr.map(function (elem) {
                            return {...elem}
                        });

                        let result = selectedHours.filter(obj => {
                            return obj.hours.length
                        });

                        let scheduledHours = [];
                        result.map(function (elem) {
                            let scheduledHour = {};

                            if (elem.id) {
                                scheduledHour.weekday = elem.weekday;
                                scheduledHour.hours = elem.hours;
                                scheduledHours.push(scheduledHour)
                            }
                        });

                        this.setState({
                            weekdays: resArr,
                            scheduledDays: scheduledHours
                        }, () => {
                            orderWeekdays(_this.state.weekdays);
                            _this.state.weekdays.map(function (weekDay, index) {
                                if (weekDay.hours.length) {
                                    _this.state.selectedIndexes.push(index)
                                }
                                let difference = _this.state.hours.filter(object1 => {
                                    return !weekDay.hours.some(object2 => {
                                        return object1.from.format('HH:mm') === object2.from;
                                    });
                                });
                                let addedHours = [];
                                difference.map(function (elem) {
                                    let hourObj = {};
                                    hourObj.from = elem.from.format('HH:mm');
                                    hourObj.to = elem.to.format('HH:mm');
                                    addedHours.push(hourObj)
                                });
                                let hours = weekDay.hours.concat(addedHours);
                                hours.sort((a, b) => a.from.localeCompare(b.from));
                                let level = '';
                                for (let i = 0; i < hours.length; i++) {
                                    if (hours[i].mining_level) {
                                        level = hours[i].mining_level
                                    } else {

                                        let day;
                                        if (_this.state.selectedIndexes.includes(index)) {
                                            day = index - 1;
                                            if (day === -1) {
                                                day = 6
                                            }
                                        } else {
                                            day = index
                                        }
                                        hours[i].mining_level = level ? level : _this.findLastLevel(_this.state.weekdays, day)
                                    }
                                }
                                weekDay.hours = hours
                            })
                        })

                    }

                    if (data.data.options.sms) {
                        this.setState(prevState => ({
                            options: {
                                ...prevState.options, smsNotification: Boolean(+data.data.options.sms.value)
                            },
                            hasSettings: true
                        }));
                    }

                    this.setState({
                        showLoading: false,
                    });
                } else {
                    this.setState({
                        showLoading: false,
                    })
                }
            }
        ).catch((error) => {
                Sentry.captureException(error);
                return this.props.history.push('/404');
            }
        )
    }

    findLastLevel(selectedDays, day) {
        let _this = this;
        let days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        let selectedDay = selectedDays.find(elem => elem.weekday === days[day]);
        if (selectedDay.from && selectedDay.to && selectedDay.mining_level) {
            return selectedDay.hours[selectedDay.hours.length - 1].mining_level
        } else {
            day = day === 0 ? 6 : day - 1;
            return _this.findLastLevel(selectedDays, day)
        }
    }

    handleSmsChange(e) {
        let _this = this;
        this.setState(prevState => ({
            options: {
                ...prevState.options, smsNotification: e
            },
        }), () => {
            let body = {
                options: {
                    turn_on_sms_notification: _this.state.options.smsNotification ? _this.state.options.smsNotification : false
                }
            };
            updateSMSOption(_this.state.serviceId, body).catch((error) => {
                console.log('error', error);
            });

        });
    }

    saveChanges() {
        let sendingData = {};
        sendingData.days = this.state.scheduledDays;
        sendingData.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        this.setState({
            saveLoading: true
        });

        createSettings(this.state.serviceId, sendingData).then((response) => {
            if (response.data?.success) {
                localStorage.removeItem('weekday');
                this.mountComponent();
                this.setState({
                    hasSettings: true
                })
            } else {
                this.addNotification('Invalid data', 'error')
            }

            this.setState({
                saveLoading: false,
            })
        }).catch((err) => {
            Sentry.captureException(err);
            this.setState({
                saveLoading: false,
            });
            this.addNotification(err?.response?.data?.message || 'Invalid data', 'error')
        });


    }

    discardChanges() {
        let _this = this;

        this.state.weekdays.map(weekday => {
            weekday.hours = [];
        });
        this.setState({
            calendarKey: Math.random(),
            scheduledDays: [],
        }, () => {
            _this.mountComponent();
        })
    }


    addNotification(message, level) {
        const notification = this.notificationSystem.current;
        notification.addNotification({
            level: level,
            position: 'br',
            children: (
                <div>
                    <h6 className={'p-2'}>{message}</h6>
                </div>
            )
        });
    }
    ;

    handleDayHover(weekday) {
        this.setState({
            hoverDay: true,
            selectDayForHover: weekday
        });
    }

    discardDayHover() {
        this.setState({
            hoverDay: false,
            selectDayForHover: ''
        })
    }

    selectDay(weekday) {
        const item = {
            value: weekday,
            expiry: moment().add(3, "minutes").utc(true),
        };
        localStorage.setItem('weekday', JSON.stringify(item));

        this.setState({
            selectedWeekday: weekday,
            selectedDay: true
        });
    }

    removeSelectedDay() {
        let _this = this;

        let weekday = localStorage.getItem('weekday');
        if (weekday) {
            let storageWeekday = JSON.parse(weekday).value;
            let weekDay = this.state.scheduledDays.find(day => day.weekday == storageWeekday);
            if (weekDay) {
                weekDay.hours = [];
            }

            let newData = _this.state.scheduledDays;

            _this.generateFinalSchedule(newData);

        }
    }


    generateFinalSchedule(newData) {
        let _this = this;
        let days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        let finalWeekdays = [];

        days.map(day => {

            let foundedDay = newData.find(weekday => {
                return weekday.weekday === day
            });

            if (foundedDay) {
                let hoursArray = hoursString.concat(foundedDay.hours);
                let finalHours = [...new Map(hoursArray.map(item => [item.from, item])).values()];
                finalWeekdays.push({
                    weekday: day,
                    hours: finalHours
                })
            } else {
                finalWeekdays.push({
                    weekday: day,
                    hours: hoursString
                })
            }
        });

        newData = [...new Map(newData.map(item => [item.weekday, item])).values()];

        _this.setState({
            weekdays: [],
            showCalendarLoading: true
        }, () => {
            generateSchedule(finalWeekdays).then((data) => {
                _this.setState({
                    calendarKey: Math.random(),
                    weekdays: data.data,
                    scheduledDays: newData,
                    showCalendarLoading: false
                })
            })
        })
    }

    copyDayData() {
        let weekday = localStorage.getItem('weekday');

        if (weekday) {
            let copiedWeekday = JSON.parse(weekday).value;
            const item = {
                value: copiedWeekday,
                expiry: moment().add(3, "minutes").utc(true),
            };
            localStorage.setItem('copiedWeekday', JSON.stringify(item));
            this.setState({
                copiedDay: true,
                hoveredCopiedDay: copiedWeekday
            })
        }
    }

    pasteDayData() {
        let day = localStorage.getItem('weekday');
        let copiedDayOfWeek = localStorage.getItem('copiedWeekday');

        if (day && copiedDayOfWeek) {
            let weekday = JSON.parse(day).value;
            let copiedWeekday = JSON.parse(copiedDayOfWeek).value;
            let copiedDay = this.state.scheduledDays.find(day => day.weekday == copiedWeekday);
            let pasteDay = this.state.scheduledDays.find(day => day.weekday == weekday);
            if (pasteDay) {
                pasteDay.hours = copiedDay ? copiedDay.hours : hoursString;
            } else {
                this.state.scheduledDays.push({
                    weekday: weekday,
                    hours: copiedDay ? copiedDay.hours : hoursString
                })
            }
            let newData = this.state.scheduledDays;

            this.generateFinalSchedule(newData);
        }
    }

    openScheduling() {
        let day = localStorage.getItem('weekday');
        if (day) {
            let storageWeekday = JSON.parse(day).value;
            let found = this.state.scheduledDays.find(day => day.weekday == storageWeekday);

            openSetScheduleModal(storageWeekday, this.state.hours, found ? found.hours : [])
        }
    }

    checkHourIsSelected(weekday, hour) {
        if (weekday.hours.length) {
            let selectedHour = weekday.hours.find((weekdayHour) => {
                return weekdayHour.from == hour.from.format('HH:mm') && weekdayHour.to == hour.to.format('HH:mm')
            });
            return !!selectedHour;
        }
    }

    detectMiningLevel(weekday, hour) {
        let selectedHour = weekday.hours.find((weekdayHour) => {
            return weekdayHour.from == hour.from.format('HH:mm') && weekdayHour.to == hour.to.format('HH:mm')
        });
        return selectedHour.mining_level;
    }

    resetSchedule() {
        Emitter.emit('resetWeeklySchedule', this.state.serviceId)
    }

    render() {
        return (
            <div>
                <Header settingsPage={true} serviceId={this.state.serviceId}/>
                {!this.state.showLoading ? (

                    <div
                        className={`${!this.state.showMobileSettings && !this.state.mobileSettings ? 'container' : ''}`}>
                        <motion.h2 initial={{scale: 0}}
                                   animate={{scale: 1}}
                                   transition={{duration: 0.3}}
                                   className={`font-weight-bold mt-5`}>Settings
                        </motion.h2>
                        <motion.div initial={{scale: 0}}
                                    animate={{scale: 1}}
                                    transition={{duration: 0.3, delay: 0.3}}
                                    className={`border radius-8 p-5 mt-5`}>
                            <h4 className={`font-weight-bold`}>Notification settings</h4>
                            <div className={`mt-3 flex`}>
                                <h6 className={`mb-0 mr-5`}>SMS Notifications when PKT Cube is offline for more than 24
                                    hours</h6>
                                <Switch
                                    disabled={false}
                                    onColor={'#023DB5'}
                                    checkedIcon={false}
                                    uncheckedIcon={false}
                                    width={30}
                                    height={18}
                                    checked={this.state.options.smsNotification}
                                    className={`ml-auto`}
                                    onChange={(e) => {
                                        this.handleSmsChange(e)
                                    }}
                                />
                            </div>
                        </motion.div>
                        <div className={`border radius-8 p-5 mt-5`}>
                            <motion.h4 initial={{scale: 0}}
                                       animate={{scale: 1}}
                                       transition={{duration: 0.3, delay: 0.6}}
                                       className={`font-weight-bold text-nowrap`}>Bandwidth settings
                                <Tooltip placement="top" trigger={['hover']}
                                         overlay={'Set up your Cube to mine when and how you want'}>
                                <span className={`ml-2`}>
                                    <i className="far fa-question-circle fa-xs"/>
                                </span>
                                </Tooltip>
                            </motion.h4>
                            <motion.h6 initial={{scale: 0}}
                                       animate={{scale: 1}}
                                       transition={{duration: 0.3, delay: 0.9}}
                                       className={`mt-4`}>You can schedule your Cube
                                to run for a particular time or for particular amount of MB/s
                            </motion.h6>


                            <motion.div initial={{scale: 0}}
                                        animate={{scale: 1}}
                                        transition={{duration: 0.3, delay: 1.2}}
                                        className={`${!this.state.showMobileSettings && !this.state.mobileSettings ? 'container' : ''}`}>
                                <h4 className={`font-weight-bold mt-5`}>Schedule by day/time</h4>
                                {!this.state.showCalendarLoading ? (

                                    <div className={`row mt-5`} key={this.state.calendarKey}>

                                        <div className={`col-12 table-responsive 
                                    ${this.state.showMobileSettings && this.state.mobileSettings ? styles.tableZoom : ''}`}>
                                            <table className={`table`}>
                                                <thead>
                                                <tr>
                                                    <th className={`align-middle text-center border`}>
                                                        <Tooltip placement="top" trigger={['hover']}
                                                                 overlay={`Reset weekly schedule`}>
                                                            <button className={`bg-white`}
                                                                    onClick={() => this.resetSchedule()}>
                                                                <svg width="37" height="33" viewBox="0 0 37 33"
                                                                     fill="none"
                                                                     xmlns="http://www.w3.org/2000/svg"
                                                                     className="m-auto">
                                                                    <path
                                                                        d="M37 21.3619L33.987 33L30.7943 29.6956C24.9517 33.5059 17.138 32.7775 12.0489 27.5104L14.4252 25.051C18.1929 28.9505 23.8806 29.6514 28.3386 27.154L25.7553 24.4803L37 21.3619Z"
                                                                        fill="#141414"/>
                                                                    <path
                                                                        d="M12 16.6381L15.013 5L18.2057 8.30438C24.0483 4.4941 31.862 5.22249 36.9511 10.4896L34.5748 12.949C30.8071 9.04954 25.1194 8.34856 20.6614 10.846L23.2447 13.5197L12 16.6381Z"
                                                                        fill="#141414"/>
                                                                </svg>
                                                            </button>
                                                        </Tooltip>
                                                    </th>
                                                    <th colSpan={`24`} className={`text-center align-middle border`}>
                                                        <h3 className={`font-weight-bold`}>Schedule</h3>
                                                    </th>
                                                </tr>
                                                </thead>
                                                <tbody>

                                                {this.state.weekdays.map((weekday, index) => {
                                                    return (
                                                        <tr key={index} className={`border`}>
                                                            <td className={`align-middle border cursor-pointer`}
                                                                onClick={() => {
                                                                    this.selectDay(weekday.weekday)
                                                                }}
                                                                align="center">
                                                                {this.state.showMobileSettings ? weekday.weekday.slice(0, 3) : weekday.weekday}

                                                            </td>
                                                            {this.state.hours.map((hour, key) =>
                                                                <td key={key} className={`align-middle cursor-pointer position-relative
                                                                    ${(this.state.hoverDay || this.state.selectedDay || this.state.copiedDay)
                                                                && (weekday.weekday == this.state.selectedWeekday)
                                                                || (weekday.weekday == this.state.selectDayForHover)
                                                                || (weekday.weekday == this.state.hoveredCopiedDay.day)
                                                                    ? 'background-gray' : 'bg-light'}`}
                                                                    onMouseOver={() => {
                                                                        this.handleDayHover(weekday.weekday)
                                                                    }}
                                                                    onMouseLeave={() => {
                                                                        this.discardDayHover()
                                                                    }}
                                                                    onClick={() => {
                                                                        this.selectDay(weekday.weekday)
                                                                    }}
                                                                    align="center">

                                                                    {this.checkHourIsSelected(weekday, hour) ?
                                                                        <div
                                                                            className={`${styles.levelDiv} flex align-items-center justify-content-center text-capitalize
                                                                            ${this.detectMiningLevel(weekday, hour) == 'off' ? 'bg-secondary' : 'background-dark-blue'}
                                                                             position-absolute text-white`}>
                                                                            <small
                                                                                className={`${this.state.mobileSettings && this.state.showMobileSettings && isIOSDevice() ?
                                                                                    styles.levelFont : ''}`}>
                                                                                {this.detectMiningLevel(weekday, hour) == 'medium' ? 'med' :
                                                                                    this.detectMiningLevel(weekday, hour) == 'unlimited' ?
                                                                                        <svg width="24" height="24"
                                                                                             viewBox="0 0 24 24"
                                                                                             fill="none"
                                                                                             xmlns="http://www.w3.org/2000/svg">
                                                                                            <path
                                                                                                d="M8.12132 9.87868L10.2044 11.9617L10.2106 11.9555L11.6631 13.408L11.6693 13.4142L13.7907 15.5355C15.7433 17.4882 18.9091 17.4882 20.8617 15.5355C22.8144 13.5829 22.8144 10.4171 20.8617 8.46447C18.9091 6.51184 15.7433 6.51184 13.7907 8.46447L13.0773 9.17786L14.4915 10.5921L15.2049 9.87868C16.3764 8.70711 18.2759 8.70711 19.4475 9.87868C20.6191 11.0503 20.6191 12.9497 19.4475 14.1213C18.2759 15.2929 16.3764 15.2929 15.2049 14.1213L13.1326 12.0491L13.1263 12.0554L9.53553 8.46447C7.58291 6.51184 4.41709 6.51184 2.46447 8.46447C0.511845 10.4171 0.511845 13.5829 2.46447 15.5355C4.41709 17.4882 7.58291 17.4882 9.53553 15.5355L10.2488 14.8222L8.83463 13.408L8.12132 14.1213C6.94975 15.2929 5.05025 15.2929 3.87868 14.1213C2.70711 12.9497 2.70711 11.0503 3.87868 9.87868C5.05025 8.70711 6.94975 8.70711 8.12132 9.87868Z"
                                                                                                fill="white"/>
                                                                                        </svg>
                                                                                        :
                                                                                        this.detectMiningLevel(weekday, hour) == 'experimental' ? 'exp' :
                                                                                            this.detectMiningLevel(weekday, hour)}</small>
                                                                        </div>
                                                                        : null}
                                                                </td>
                                                            )}
                                                        </tr>)
                                                })}
                                                <tr>
                                                    <td className={`border-0`}/>
                                                    {this.state.hours.map((hour, key) =>
                                                        <td key={key}
                                                            className={`align-middle border-0 text-nowrap 
                                                        ${key % 2 !== 0 && !(this.state.mobileSettings && this.state.showMobileSettings) ? 'px-3' : 'px-0'}`}
                                                            align="center">
                                                            {key % 2 === 0 ? hour.from.format('h A') : ''}
                                                        </td>
                                                    )}
                                                </tr>

                                                </tbody>
                                            </table>

                                            <div
                                                className={`flex ${this.state.showMobileSettings && !this.state.mobileSettings ? 'justify-content-start'
                                                    : 'justify-content-end'} `}>
                                                <button className={`flex cursor-pointer bg-white text-black align-items-center text-nowrap
                                                ${!this.state.selectedDay ? 'disabled' : ''}`}
                                                        disabled={!this.state.selectedDay}
                                                        onClick={() => {
                                                            this.openScheduling()
                                                        }}>
                                                    <i className="fas fa-plus-circle fa-lg"/>
                                                    <span className={`ml-2`}>Add</span>
                                                </button>

                                                <button className={`flex ml-5 cursor-pointer bg-white text-black align-items-center text-nowrap
                                                ${!this.state.selectedDay ? 'disabled' : ''}`}
                                                        disabled={!this.state.selectedDay}
                                                        onClick={() => {
                                                            this.removeSelectedDay()
                                                        }}>
                                                    <i className="far fa-trash-alt fa-lg"/>
                                                    <span className={`ml-2`}>Remove</span>
                                                </button>

                                                <button className={`flex ml-5 cursor-pointer bg-white text-black align-items-center text-nowrap
                                                ${!this.state.selectedDay ? 'disabled' : ''}`}
                                                        disabled={!this.state.selectedDay}
                                                        onClick={() => {
                                                            this.copyDayData()
                                                        }}>
                                                    <i className="far fa-copy fa-lg"/>
                                                    <span className={`ml-2`}>Copy</span>
                                                </button>

                                                {this.state.copiedDay ? (
                                                    <button className={`flex ml-5 cursor-pointer bg-white text-black
                                                ${!this.state.selectedDay ? 'disabled' : ''}`}
                                                            onClick={() => this.pasteDayData()}>
                                                        <svg width="18" height="22" viewBox="0 0 18 22" fill="none"
                                                             xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M10 6H4V4H10V6Z" fill="#141414"/>
                                                            <path d="M10 10H4V8H10V10Z" fill="#141414"/>
                                                            <path d="M4 14H10V12H4V14Z" fill="#141414"/>
                                                            <path fillRule="evenodd" clipRule="evenodd"
                                                                  d="M0 18V0H14V4H18V22H4V18H0ZM12 16V2H2V16H12ZM14 6V18H6V20H16V6H14Z"
                                                                  fill="#141414"/>
                                                        </svg>
                                                        <p className={`ml-2`}>Paste</p>
                                                    </button>
                                                ) : null}

                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <Load/>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                        <motion.div initial={{scale: 0}}
                                    animate={{scale: 1}}
                                    transition={{duration: 0.3, delay: 1.5}}
                                    className={`text-center py-5 ${styles.buttonsDiv}`}>


                            <button type="button"
                                    className={`btn background-dark-blue radius-5 btn-wide mx-2 mt-2 ${styles.minButton} 
                                    ${this.state.saveLoading ? 'disabled' : ''}`}
                                    onClick={() => this.saveChanges()}
                                    disabled={this.state.saveLoading}>
                                <span className={`font-weight-bold text-white text-nowrap`}>Save changes
                                    {this.state.saveLoading ? (
                                        <div
                                            className="spinner-border spinner-border-sm font-14 ml-2"
                                            role="status">
                                        </div>) : null}
                                </span>
                            </button>
                            <button type="button"
                                    className={`btn border radius-5 btn-wide mx-2 mt-2 text-nowrap ${styles.minButton}`}
                                    onClick={() => this.discardChanges()}
                                    disabled={this.state.discardLoading}>
                                <span className={`font-weight-bold`}>Discard changes
                                    {this.state.discardLoading ? (
                                        <div
                                            className="spinner-border spinner-border-sm font-14 ml-2"
                                            role="status">
                                        </div>) : null}</span>
                            </button>
                        </motion.div>
                    </div>
                ) : (
                    <div>
                        <Load/>
                    </div>
                )}
                <Footer/>

                <NotificationSystem ref={this.notificationSystem}/>
                <SetSchedule/>
                <ResetSchedule/>
            </div>
        )
    }
}

export default Settings
