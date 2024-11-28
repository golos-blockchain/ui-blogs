
import React, { Component } from 'react'
import tt from 'counterpart'

import Icon from '@elements/Icon'
import QRCode from 'app/components/elements/QrCode'

class LoginAppReminder extends Component {
    state = { showAndroid: false }

    showForAndroid = (e) => {
        e.preventDefault()
        this.setState({
            showAndroid: !this.state.showAndroid
        })
    }

    render() {
        const winUrl = 'https://files.golos.app/api/exe/desktop/windows/latest'
        const linuxUrl = 'https://files.golos.app/api/exe/desktop/linux/latest'
        const androidUrl = 'https://files.golos.app/api/exe/blogs/android/latest'
    
        const { showAndroid } = this.state

        const androidTitle = (tt('login_app_reminder.title') + 'Android')

        return <div className='LoginAppReminder'>
            {tt('login_app_reminder.or_download_for')}
            <a href={winUrl} target='_blank' rel='nofollow noreferrer' title={tt('login_app_reminder.title') + 'Windows'}>
                <img src={require('app/assets/images/app/windows.png')} />
            </a>
            <a href={linuxUrl} target='_blank' rel='nofollow noreferrer' title={tt('login_app_reminder.title') + 'Linux'}>
                <img src={require('app/assets/images/app/linux.png')} />
            </a>
            <a onClick={this.showForAndroid} title={!showAndroid && androidTitle}>
                <img src={require('app/assets/images/app/android48x48.png')} />
                <Icon name='badge-new' size='2x' />
            </a>
            {showAndroid ?
                <div>
                    <a href={androidUrl} target='_blank' rel='nofollow noreferrer' title={androidTitle}>
                        <QRCode text={androidUrl} size={2} />
                        &nbsp;&nbsp;
                        {androidUrl.replace('https://', '')}
                    </a>
                </div> : null}
        </div>
    }
}

export default LoginAppReminder
