import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

const NotifiCounter = ({ value }) => {
    if (!value) return null
    return <div className='NotifiCounter'>{value}</div>
}

NotifiCounter.propTypes = {
    value: PropTypes.number
}

export default connect(
    (state, props) => {
        const counters = state.app.notificounters
        const fields = props.fields.replace(/\s/g,'').split(',')
        const value = counters
            ? fields.reduce((res, field) => res + (counters[field] || 0), 0)
            : null
        return { value }
    }
)(NotifiCounter)
