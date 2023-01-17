/* eslint react/prop-types: 0 */
import React from 'react';
import { FormattedRelativeTime } from 'react-intl'
import { selectUnit } from '@formatjs/intl-utils'

import Tooltip from 'app/components/elements/Tooltip'

export default class TimeAgoWrapper extends React.Component {
    render() {
        let {date, className} = this.props
        if (date && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$/.test(date)) {
            date = date + 'Z' // Firefox really wants this Z (Zulu)
        }
        const dt = new Date(date)
        const { value, unit } = selectUnit(dt)
        return <Tooltip t={dt.toLocaleString()} className={className}>
                  <FormattedRelativeTime {...this.props} value={value} unit={unit} />
               </Tooltip>
    }
}
