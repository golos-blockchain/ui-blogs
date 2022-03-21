import React from 'react'
import tt from 'counterpart'

import LoadingIndicator from 'app/components/elements/LoadingIndicator'

class AppUpdate extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            loading: true,
        }
    }

    appUpdaterUrl = (file) => {
        let url = new URL(
            '/blogs-' + ($STM_Config.platform === 'linux' ? 'linux' : 'win') + '/' + file,
            $STM_Config.app_updater.host
        )
        return url.toString()
    }

   async componentDidMount() {
        let params = new URLSearchParams(window.location.search)
        const v = params.get('v')
        const exe = params.get('exe')
        const txt = params.get('txt')

        const exeUrl = this.appUpdaterUrl(exe)
        const txtUrl = this.appUpdaterUrl(txt)

        this.setState({
            v,
            exeUrl
        })

        try {
            let res = await fetch(txtUrl)
            const decoder = new TextDecoder('windows-1251')
            res = decoder.decode(await res.arrayBuffer())

            this.setState({
                description: res,
                loading: false
            })
        } catch (error) {
            console.error(error)
            this.setState({
                loading: false
            })
        }
    }

    goDownload = (e) => {
        e.preventDefault()
        window.open(this.state.exeUrl, '_blank')
    }

    render() {
        const { loading, v, description } = this.state
        if (this.state.loading) {
            return <center style={{ paddingTop: '5rem' }}>
                    <LoadingIndicator type='circle' size='25px' />
                </center>
        }
        return <div style={{ padding: '2rem' }}>
                <h2>GOLOS Blogs - {v}</h2>
                <hr />
                <div style={{ whiteSpace: 'pre-line' }}>
                    {description}
                </div>
                <div>
                    <a href='#' onClick={this.goDownload}>
                        <button type='button' className='button' style={{ marginTop: '1rem' }}>
                            {tt('app_update.download')}
                        </button>
                    </a>
                </div>
            </div>
    }
}

module.exports = {
    path: '/__app_update',
    component: AppUpdate,
}
