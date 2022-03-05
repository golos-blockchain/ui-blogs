import React from 'react'

import Icon from 'app/components/elements/Icon'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'

class AppSplash extends React.Component {
    quitApp = () => {
        window.close() // Will trigger app quit
    }

    render() {
        return <div style={{ '-webkit-app-region': 'drag', '-webkit-user-select': 'none', 'user-select': 'none' }}>
                <center style={{ paddingTop: '5rem' }}>
                    <Icon name='golos' size='4x' />
                </center>
                <center style={{ paddingTop: '2rem' }}>
                    <LoadingIndicator type='circle' size='25px' />
                </center>
                <div style={{
                    position: 'absolute',
                    top: '0px',
                    right: '3px',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    '-webkit-app-region': 'no-drag'
                }} onClick={this.quitApp}>
                    <Icon name='cross' size='0_95x' />
                </div>
            </div>
    }
}

module.exports = {
    path: '/__app_splash',
    component: AppSplash,
}
