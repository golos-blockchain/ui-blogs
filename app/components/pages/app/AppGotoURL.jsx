import React from 'react'
import tt from 'counterpart'

import KEYS from 'app/utils/keyCodes'

class AppGotoURL extends React.Component {
    state = {
        url: '',
        modified: false,
    }

    componentDidMount() {
        document.addEventListener('keydown', this.onGlobalKeyDown)
        const url = decodeURI(this.props.location.search.slice(1) + this.props.location.hash)
        this.setState({
            url,
            modified: false,
        })
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.onGlobalKeyDown)
    }

    navigate = () => {
        let url = this.state.url.trimStart()
        if (!url.startsWith('https://')) {
            url = 'https://' + url.replace('http://', '')
        }
        try {
            url = new URL(url)
            if ($STM_Config.url_domains.includes(url.host)) {
                url.host = $STM_Config.site_domain
                url.protocol = 'app:'
                window.appNavigation.loadURL(url.toString())
                this.close()
                return
            }
        } catch (err) {
            console.error(err)
        }
        if (confirm(tt('app_goto_url.wrong_domain_DOMAINS', { DOMAINS: $STM_Config.url_domains }))) {
            window.appNavigation.loadURL(url.toString(), true)
            this.close()
        }
    }

    close = () => {
        window.close()
    }

    onFocus = (e) => {
        e.target.select()
    }

    onChange = (e) => {
        this.setState({
            url: e.target.value,
            modified: true,
        })
    }

    onSubmit = (e) => {
        e.preventDefault()
        this.navigate()
    }

    onKeyDown = (e) => {
        if (e.which === KEYS.ENTER) {
            e.preventDefault()
            this.navigate()
        }
    }

    onCancel = (e) => {
        e.preventDefault()
        this.close()
    }

    onGlobalKeyDown = (e) => {
        if (e.which === KEYS.ESCAPE) {
            e.preventDefault()
            this.close()
        }
    }

    render() {
        const { url, modified } = this.state
        return (<div>
                <div className='row'>
                    <div className='column small-12' style={{paddingTop: 5}}>
                        <input type='text' name='url' value={url}
                            onChange={this.onChange} onFocus={this.onFocus} onKeyDown={this.onKeyDown} />
                    </div>
                </div>
                <div className='row' style={{marginTop: 15}}>
                    <div className='small-12 columns'>
                        <div className='float-right'>
                            <button type='submit' className='button'
                                disabled={!modified || !url} onClick={this.onSubmit}>
                                {tt('app_goto_url.goto')}
                            </button>
                            <button type='button' className='button hollow' onClick={this.onCancel}>
                                {tt('g.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>)
    }
}

module.exports = {
    path: '/__app_goto_url',
    component: AppGotoURL,
}
