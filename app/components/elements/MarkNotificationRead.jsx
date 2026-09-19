import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { markNotificationReadWs } from 'app/utils/NotifyApiClient'

const MarkNotificationRead = (props) => {
    const { fields, account, update, interval } = props
    const intervalRef = useRef(null)
    const fieldsArrayRef = useRef([])

    const activateInterval = (intervalDuration) => {
        if (!intervalRef.current) {
            intervalRef.current = setInterval(() => {
                markNotificationReadWs(account, fieldsArrayRef.current).then(nc => update(nc))
            }, intervalDuration)
        }
    }

    useEffect(() => {
        fieldsArrayRef.current = fields.replace(/\s/g, '').split(',')

        if (interval) {
            activateInterval(interval)
        } else {
            markNotificationReadWs(account, fieldsArrayRef.current).then(nc => update(nc))
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, [])

    useEffect(() => {
        if (interval) {
            activateInterval(interval)
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, [interval])

    return null
}

MarkNotificationRead.propTypes = {
    fields: PropTypes.string,
    account: PropTypes.string,
    update: PropTypes.func,
    interval: PropTypes.number,
}

export default connect(null, dispatch => ({
    update: (payload) => { dispatch({ type: 'UPDATE_NOTIFICOUNTERS', payload }) },
}))(MarkNotificationRead)
