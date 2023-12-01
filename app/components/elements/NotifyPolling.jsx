import React from 'react'
import { connect } from 'react-redux'

import { counterSubscribeWs, getNotificationsWs } from 'app/utils/NotifyApiClient'

const delay = async (msec) => await new Promise(resolve => setTimeout(resolve, msec))

class NotifyPolling extends React.Component {
    componentDidMount() {
        const { username } = this.props
        if (username) {
            this.poll(username)
        }
    }

    componentDidUpdate(prevProps) {
        const { username } = this.props
        if (username && username !== prevProps.username) {
            this.poll(username)
        }
    }

    async poll(username) {
        let firstFilled = false

        const { update } = this.props

        await delay(500)

        let subscribeRes
        while (true) {
            try {
                subscribeRes = await counterSubscribeWs(username, async function (err, res) {
                    if (err) {
                        console.error(err)
                        return
                    }

                    if (firstFilled) { // TODO: it is more reliably to use timestamps to check order
                        await update(res.counters)
                    }
                })

                break
            } catch (err) {
                console.warn('counterSubscribeWs:', err, ', retry...')
                await delay(500)
            }
        }

        while (true) {
            if (this.props.username !== username) {
                return
            }

            let counters
            try {
                counters = await getNotificationsWs(username)
            } catch (err) {
                console.error('getNotificationsWs', err)
            }

            if (counters) {
                firstFilled = true
                await update(counters)
                break
            }
            await delay(2000)
        }
    }

    render() {
        return null
    }
}

export default connect(
    (state, ownProps) => {
        const current = state.user.get('current')
        const username = current && current.get('username')
        return { username }
    },
    dispatch => ({
        update: (payload) => {
            dispatch({type: 'UPDATE_NOTIFICOUNTERS', payload})
        },
    })
)(NotifyPolling)
