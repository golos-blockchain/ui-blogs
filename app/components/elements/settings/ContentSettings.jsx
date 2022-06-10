import React from 'react'
import { Formik, Form, Field } from 'formik'
import tt from 'counterpart'

import Icon from 'app/components/elements/Icon'

class ContentSettings extends React.Component {
    state = {
    }

    componentDidMount() {
        const { account } = this.props
        const hasLocalStorage = typeof(localStorage) !== 'undefined'
        const nsfwPref = (hasLocalStorage ? localStorage.getItem('nsfwPref-' + account) : null)
            || 'warn'
        const downvotedPref = (hasLocalStorage ? localStorage.getItem('downvotedPref-' + account) : null)
            || 'gray_and_hide'
        this.setState({
            initialValues: {
                nsfwPref,
                downvotedPref
            }
        })
    }

    _onSubmit = (values, { resetForm }) => {
        const { account } = this.props
        const { nsfwPref, downvotedPref } = values
        localStorage.setItem('nsfwPref-' + account, nsfwPref)
        localStorage.setItem('downvotedPref-' + account, downvotedPref)
        resetForm({ values })
    }

    render() {
        const { initialValues } = this.state
        if (!initialValues) {
            return null
        }
        return (
            <Formik
                initialValues={initialValues}
                onSubmit={this._onSubmit}
            >
                {({
                    handleSubmit, dirty
                }) => (
                <Form>
                    <div className='row'>
                        <div className='small-12 medium-8 large-6 columns'>
                            <br /><br />
                            <h3>{tt('settings_jsx.private_post_display_settings')}</h3>
                            <div>
                                {tt('settings_jsx.not_safe_for_work_nsfw_content')}
                            </div>
                            <Field as='select' name='nsfwPref'>
                                <option value='hide'>{tt('settings_jsx.always_hide')}</option>
                                <option value='warn'>{tt('settings_jsx.always_warn')}</option>
                                <option value='show'>{tt('settings_jsx.always_show')}</option>
                            </Field>
                            <div style={{ marginTop: '1rem' }}>
                                {tt('settings_jsx.downvoted_content')}
                                &nbsp;
                                <Icon name='info_o' title={tt('settings_jsx.downvoted_desc')} />
                            </div>
                            <Field as='select' name='downvotedPref'>
                                <option value='gray_and_hide'>{tt('settings_jsx.gray_and_hide')}</option>
                                <option value='gray_only'>{tt('settings_jsx.gray_only')}</option>
                                <option value='no_gray'>{tt('settings_jsx.no_gray')}</option>
                            </Field>
                            <br /><br />
                            <input
                                type='submit'
                                onClick={this._onSubmit}
                                className='button'
                                value={tt('settings_jsx.update')}
                                disabled={!dirty}
                            />
                        </div>
                    </div>
                </Form>
                )}
            </Formik>
        )
    }
}

export default ContentSettings
