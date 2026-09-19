import React from 'react'
import tt from 'counterpart'

const DateJoinWrapper = ({ date }) => {
    const dateObj = new Date(date)
    let monthNames
    if (tt.getLocale() === 'ru') {
        monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
            'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
        ]
    } else {
        monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ]
    }
    const joinMonth = monthNames[dateObj.getMonth()]
    const joinYear = dateObj.getFullYear()
    return (
        <span>{tt('g.joined')} {joinMonth} {joinYear}</span>
    )
}

export default DateJoinWrapper
