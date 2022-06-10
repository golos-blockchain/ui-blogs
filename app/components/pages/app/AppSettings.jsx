import React from 'react'
import tt from 'counterpart'
import { Formik, Field } from 'formik'

class AppSettings extends React.Component {
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
        cfg.elastic_search.url = data.elastic_search
        window.appSettings.save(cfg)
    }

    _onClose = () => {
        window.close()
    }

    makeInitialValues() {
        let initialValues = {
            ws_connection_client: $STM_Config.ws_connection_client,
            img_proxy_prefix: $STM_Config.images.img_proxy_prefix,
            use_img_proxy: $STM_Config.images.use_img_proxy,
            auth_service: $STM_Config.auth_service.host,
            notify_service: $STM_Config.notify_service.host,
            elastic_search: $STM_Config.elastic_search.url,
        }
        this.initialValues = initialValues
    }

    constructor(props) {
        super(props)
        this.makeInitialValues()
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
        return <div>
            <h1 style={{marginLeft: '0.5rem', marginTop: '1rem'}}>{tt('g.settings')}</h1>
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
                            {tt('app_settings.elastic_search')}
                            <div className='input-group' style={{marginBottom: '1.25rem'}}>
                                <Field name='elastic_search'
                                    type='text'
                                    autoComplete='off'
                                />
                            </div>
                        </div>
                    </div>
                    <div className='row' style={{marginTop: 15}}>
                        <div className='small-12 columns'>
                            <div>
                                <button type='submit' className='button'>
                                    {tt('app_settings.save_and_restart')}
                                </button>
                                <button type='button' className='button hollow float-right' onClick={this._onClose}>
                                    {tt('app_settings.cancel')}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            )}</Formik>
        </div>
    }
}

module.exports = {
    path: '/__app_settings',
    component: AppSettings,
}
