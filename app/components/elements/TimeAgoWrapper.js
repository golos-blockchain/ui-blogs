/* eslint react/prop-types: 0 */
import React from 'react';
import { FormattedRelativeTime, formatRelativeTime } from 'react-intl'
import { selectUnit } from 'app/utils/selectUnit'

import Tooltip from 'app/components/elements/Tooltip'

function processDate(date) {
    if (date && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$/.test(date)) {
        date = date + 'Z' // Firefox really wants this Z (Zulu)
    }
    const dt = new Date(date)
    const res = selectUnit(dt)
    return { dt, res }
}

export function wrapDate(date, intl) {
    const { dt, res } = processDate(date)
    const { value, unit } = res
    return intl.formatRelativeTime(value, unit)
}

export default class TimeAgoWrapper extends React.Component {
    render() {
        const { date, className } = this.props
        const { dt, res } = processDate(date)
        const { value, unit } = res
        return <Tooltip t={dt.toLocaleString()} className={className}>
            <FormattedRelativeTime {...this.props} value={value} unit={unit} />
        </Tooltip>
    }
}
