import React from 'react'
import tt from 'counterpart'
import { Formik, Field } from 'formik'

import Icon from 'app/components/elements/Icon'
import AppLogs from 'app/components/elements/app/AppLogs'

const mockLogs = () => {
    // mock for tests
    if (typeof(NativeLogs) === 'undefined') {
        window.NativeLogs = {
            getLog: (limit, some, callback) => {
                let logs = '';
                for (let i = 0; i < limit; ++i) {
                    const level = ((i % 10 === 0) ? 'E' : 'W');
                    let line = 'Log line #' + i;
                    if (i % 4 === 0) {
                        for (let j = 0; j < 5; ++j) {
                            line = (line + ' ' + line);
                        }
                    }
                    if (i % 3 === 0) {
                        line = '      ' + line;
                    }

                    line = '10-07 20:32:02.522 6440 6440 ' + level + ' ' + line;
                    logs += line + '\n';
                }
                callback(logs);
            }
        }
    }
};

class AppSettings extends React.Component {
    state = {};

    _onSubmit = (data) => {
        let cfg = { ...$STM_Config }
        if (data.custom_address) {
            const exists = cfg.ws_connection_app.find(item => item.address === data.custom_address)
            if (!exists) {
                cfg.ws_connection_app.push({
                    address: data.custom_address
                })
            }
        }
        if (data.ws_connection_client === 'custom') {
            cfg.ws_connection_client = data.custom_address
        } else {
            cfg.ws_connection_client = data.ws_connection_client
        }
        cfg.images.img_proxy_prefix = data.img_proxy_prefix
        cfg.images.use_img_proxy = data.use_img_proxy
        cfg.auth_service.host = data.auth_service
        cfg.notify_service.host = data.notify_service
        cfg.notify_service.host_ws = data.notify_service_ws
        cfg.elastic_search.url = data.elastic_search
        if (process.env.MOBILE_APP) {
            cfg = JSON.stringify(cfg)
            localStorage.setItem('app_settings', cfg)
            window.location.href = '/'
            return
        } else {
            cfg.main_app = data.main_app
        }
        window.appSettings.save(cfg)
    }

    _onClose = (e) => {
        e.preventDefault()
        if (process.env.MOBILE_APP) {
            window.location.href = '/'
            return
        }
        window.close()
    }

    makeInitialValues() {
        let initialValues = {
            ws_connection_client: $STM_Config.ws_connection_client,
            img_proxy_prefix: $STM_Config.images.img_proxy_prefix,
            use_img_proxy: $STM_Config.images.use_img_proxy,
            auth_service: $STM_Config.auth_service.host,
            notify_service: $STM_Config.notify_service.host,
            notify_service_ws: $STM_Config.notify_service.host_ws || '',
            elastic_search: $STM_Config.elastic_search.url,
            main_app: $STM_Config.main_app,
        }
        this.initialValues = initialValues
    }

    constructor(props) {
        super(props)
        this.makeInitialValues()
    }

    showLogs = (limit = 200) => {
        mockLogs();
        NativeLogs.getLog(
            limit,
            false,
            logs => {
                this.setState({ logs, logLimit: limit });
            }
        )
    }

    _renderNodes(ws_connection_client) {
        let fields = []
        for (let i in $STM_Config.ws_connection_app) {
            let pair = $STM_Config.ws_connection_app[i]
            let { address, } = pair
            fields.push(
                <div style={{ display: 'block' }}>
                    <label style={{ textTransform: 'none', color: 'inherit', fontSize: 'inherit' }}>
                        <Field name='ws_connection_client'
                            type='radio'
                            value={address}
                        />
                        {address}
                    </label>
                </div>
            )
        }
        fields.push(
            <div style={{ display: 'block' }}>
                <label style={{ textTransform: 'none', color: 'inherit', fontSize: 'inherit' }}>
                    <Field name='ws_connection_client'
                        type='radio'
                        value={'custom'}
                    />
                    <Field name='custom_address'
                        type='text'
                        autoComplete='off'
                        style={{ width: '300px', display: 'inline-block' }}
                    />
                </label>
            </div>
        )
        return fields
    }

    render() {
        const { MOBILE_APP } = process.env
        const { logs, logLimit } = this.state
        return <div>
            <h1 style={{marginLeft: '0.5rem', marginTop: '1rem'}}>
                {MOBILE_APP ? <a href='/' style={{ marginRight: '0.5rem' }} onClick={this._onClose}>
                    <Icon name='chevron-left' />
                </a> : null}
                {MOBILE_APP ? tt('app_settings.mobile_title') : tt('g.settings')}
            </h1>
            <div className='secondary' style={{ paddingLeft: '0.625rem', marginBottom: '0.25rem' }}>
                {tt('app_settings.to_save_click_button')}
            </div>
            <Formik
                initialValues={this.initialValues}
                onSubmit={this._onSubmit}
            >
                {({
                    handleSubmit, isSubmitting, errors, values, handleChange,
                }) => (
                <form
                    onSubmit={handleSubmit}
                    autoComplete='off'
                >
                    <div className='row'>
                        <div className='column small-12' style={{paddingTop: 5}}>
                            {tt('app_settings.ws_connection_client')}
                            <div style={{marginBottom: '1.25rem'}}>
                                {this._renderNodes(values.ws_connection_client)}
                            </div>
                        </div>
                    </div>
                    <div className='row'>
                        <div className='column small-12' style={{paddingTop: 5}}>
                            <label style={{ textTransform: 'none', color: 'inherit', fontSize: 'inherit' }}>
                                <Field
                                    name={`use_img_proxy`}
                                    type='checkbox'
                                    className='input-group-field bold'
                                />
                                {tt('app_settings.img_proxy_prefix')}
                            </label>
                            <div className='input-group' style={{marginBottom: '1.25rem'}}>
                                <Field name='img_proxy_prefix'
                                    disabled={!values.use_img_proxy}
                                    type='text'
                                    autoComplete='off'
                                />
                            </div>
                        </div>
                    </div>
                    <div className='row'>
                        <div className='column small-12' style={{paddingTop: 5}}>
                            {tt('app_settings.auth_service')}
                            <div className='input-group' style={{marginBottom: '1.25rem'}}>
                                <Field name='auth_service'
                                    type='text'
                                    autoComplete='off'
                                />
                            </div>
                        </div>
                    </div>
                    <div className='row'>
                        <div className='column small-12' style={{paddingTop: 5}}>
                            {tt('app_settings.notify_service')}
                            <div className='input-group' style={{marginBottom: '1.25rem'}}>
                                <Field name='notify_service'
                                    type='text'
                                    autoComplete='off'
                                />
                            </div>
                        </div>
                    </div>
                    <div className='row'>
                        <div className='column small-12' style={{paddingTop: 5}}>
                            {tt('app_settings.notify_service_ws')}
                            <div className='input-group' style={{marginBottom: '1.25rem'}}>
                                <Field name='notify_service_ws'
                                    type='text'
                                    autoComplete='off'
                                />
                            </div>
                        </div>
                    </div>
                    <div className='row'>
                        <div className='column small-12' style={{paddingTop: 5}}>
                            {tt('app_settings.elastic_search')}
                            <div className='input-group' style={{marginBottom: '1.25rem'}}>
                                <Field name='elastic_search'
                                    type='text'
                                    autoComplete='off'
                                />
                            </div>
                        </div>
                    </div>
                    {MOBILE_APP ? null : <div className='row'>
                        <div className='column small-12' style={{paddingTop: 5}}>
                            {tt('app_settings.main_app')}
                            <div className='input-group' style={{marginBottom: '1.25rem'}}>
                                <Field name='main_app'
                                    as='select'
                                >
                                    <option value='blogs'>{tt('app_settings.blogs_service')}</option>
                                    <option value='wallet'>{tt('app_settings.wallet_service')}</option>
                                    <option value='msgs'>{tt('app_settings.messenger_service')}</option>
                                </Field>
                            </div>
                        </div>
                    </div>}
                    <div className='row' style={{marginTop: 15}}>
                        <div className='small-12 columns'>
                            <div>
                                <button type='submit' className='button'>
                                    {MOBILE_APP ? tt('g.save') : tt('app_settings.save_and_restart')}
                                </button>
                                {MOBILE_APP ? null :<button type='button' className='button hollow float-right' onClick={this._onClose}>
                                    {tt('app_settings.cancel')}
                                </button>}
                                {MOBILE_APP ? <span className='float-right'>
                                    {tt('app_settings.version') + ' ' + $STM_Config.app_version}
                                    <a href='#' style={{ marginLeft: '5px' }} onClick={e => {
                                        e.preventDefault();
                                        this.showLogs();
                                    }}>
                                        {tt('app_settings.logs')}
                                    </a>
                                </span> : null}
                            </div>
                        </div>
                    </div>
                </form>
            )}</Formik>
            {logs && <AppLogs logs={logs} logLimit={logLimit} showLogs={this.showLogs} hideMe={() => {
                this.setState({
                    logs: null
                });
            }} />}
        </div>
    }
}

module.exports = {
    path: '/__app_settings',
    component: AppSettings,
}

module.exports.openAppSettings = function() {
    if (!process.env.MOBILE_APP) {
        window.location.href = '/__app_settings'
        return
    }
    const { pathname } = window.location
    window.location.href = '/#app-settings'
    if (pathname === '/' && window.appMounted) {
        window.location.reload() 
    }
}
