import React from 'react';
import tt from 'counterpart';

export default class DateJoinWrapper extends React.Component {
    render() {
        let date = new Date(this.props.date);
        let monthNames;
        if (tt.getLocale() === 'ru') {
            monthNames = ["января", "февраля", "марта", "апреля", "мая", "июня",
                "июля", "августа", "сентября", "октября", "ноября", "декабря"
            ];
        } else {
            monthNames = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];
        }
        let joinMonth = monthNames[date.getMonth()];
        let joinYear = date.getFullYear();
        return (
                <span>{tt('g.joined')} {joinMonth} {joinYear}</span>
            )
    }
}
