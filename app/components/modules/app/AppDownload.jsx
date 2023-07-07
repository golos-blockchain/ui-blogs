import React from 'react'
import tt from 'counterpart'

class AppDownload extends React.Component {
    componentDidMount() {
    }

    render() {
        const updaterHost = 'https://files.golos.app'
        const winUrl = new URL('/api/exe/desktop/windows/latest', updaterHost)
        const linuxUrl = new URL('/api/exe/desktop/linux/latest', updaterHost)
        return <div>
            <h4>{tt('app_download.title')}</h4>
            <a href={winUrl} target='_blank' rel='nofollow noreferrer' title={tt('app_download.download_for') + ' Windows'}>
                <img src={require('app/assets/images/app/windows.png')} />
                Windows
            </a><br />
            <a href={linuxUrl} title={tt('app_download.download_for') + ' Linux'}>
                <img src={require('app/assets/images/app/linux.png')} />
                Linux (deb)
            </a>
        </div>
    }
}

export default AppDownload
