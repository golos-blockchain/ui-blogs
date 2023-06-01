import React from 'react'
import tt from 'counterpart'
import { connect } from 'react-redux'

import CloseButton from 'react-foundation-components/lib/global/close-button'

import user from 'app/redux/User'

class AppReminder extends React.Component {
    state = {
        hidden: false
    }

    hideMe = () => {
        const now = Date.now()
        localStorage.setItem('app_reminder', now)
        this.setState({
            hidden: true
        })
    }

    showModal = (e) => {
        e.preventDefault()
        this.props.showModal()
        this.hideMe()
    }

    render() {
        if (this.state.hidden) {
            return null
        }
        return <span className='AppReminder callout primary' onClick={this.showModal}>
            <CloseButton
                onClick={() => {
                    this.hideMe()
                }}
            />
            {tt('app_reminder.text')}
        </span>
    }
}

export default connect(
    state => {
        return {}
    },
    dispatch => ({
        showModal: () => {
            dispatch(user.actions.showAppDownload())
        }
    })
)(AppReminder)
