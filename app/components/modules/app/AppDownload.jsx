import React from 'react'
import tt from 'counterpart'

import Icon from '@elements/Icon'
import QRCode from 'app/components/elements/QrCode'

const updaterHost = 'https://files.golos.app'
const winUrl = new URL('/api/exe/desktop/windows/latest', updaterHost)
const linuxUrl = new URL('/api/exe/desktop/linux/latest', updaterHost)
const androidUrl = new URL('/api/exe/blogs/android/latest', updaterHost)

class AppDownload extends React.Component {
    state = {
        qrShow: false,
    }

    componentDidMount() {
    }

    showQR = (e) => {
        e.preventDefault()
        this.setState({
            qrShow: !this.state.qrShow,
        })
    }

    render() {
        return <div>
            <h4>{tt('app_download.title')}</h4>
            <a href={winUrl} target='_blank' rel='nofollow noreferrer' title={tt('app_download.download_for') + ' Windows'}>
                <img src={require('app/assets/images/app/windows.png')} />
                Windows
            </a><br />
            <a href={linuxUrl} title={tt('app_download.download_for') + ' Linux'}>
                <img src={require('app/assets/images/app/linux.png')} />
                Linux (deb)
            </a><br />
            <a href={androidUrl} title={tt('app_download.mobile') + ' Android'}>
                <img src={require('app/assets/images/app/android48x48.png')} />
                {tt('app_download.mobile') + ' Android'}<Icon name='badge-new' size='1_25x' />
            </a>
            &nbsp;&nbsp;<a href='#' onClick={this.showQR}>
                <QRCode text={androidUrl.toString()} size={this.state.qrShow ? 3 : 1} />
            </a>
        </div>
    }
}

export default AppDownload
