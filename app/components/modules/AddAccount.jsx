import React from 'react'
import { Formik, Form, Field, ErrorMessage, } from 'formik'
import tt from 'counterpart'
import { connect } from 'react-redux'
import golos from 'golos-lib-js'

import user from 'app/redux/User'
import {validate_account_name} from 'app/utils/ChainValidation'

class AddAccount extends React.Component {
    componentDidMount() {
        this.loginInput.focus()
    }

    cancel = e => {
        e.preventDefault()
        this.props.cancel()
    }
    
    validate = (values) => {
        const errors = {}
        if (!values.username) {
            errors.username = tt('g.required')
        } else {
            const err = validate_account_name(values.username)
            if (err) errors.username = err
        }
        if (!values.password) {
            errors.password = tt('g.required')
        }
        return errors
    }

    _onSubmit = async (values, actions) => {
        let res
        try {
            res = await golos.auth.login(values.username, values.password)
        } catch (err) {
            let error = (err && err.message) || err
            if (err === 'No such account') {
                error = tt('g.account_not_found')
            } else if (err === 'Account is frozen') {
                error = tt('loginform_jsx.account_frozen')
            }
            actions.setErrors({ username: error })
            return
        }
        if (!res.posting) {
            actions.setErrors({ password: tt('g.incorrect_password') })
            return
        }
        this.props.login(values.username, values.password)
    }

    render() {
        return <div>
            <h4>{tt('change_account_jsx.add_account')}</h4>
            <Formik
                initialValues={{
                    username: '',
                    password: ''
                }}
                validate={this.validate}
                validateOnBlur={false}
                validateOnChange={false}
                onSubmit={this._onSubmit}
                >
                {({
                    handleSubmit, isSubmitting, isValid, values, setFieldValue, handleChange,
                }) => {
                    return (
                <Form>
                    <div className="input-group">
                        <span className="input-group-label">@</span>
                        <Field type='text' name='username' className='input-group-field' required placeholder={tt('loginform_jsx.enter_your_username')} autoComplete='on'
                            disabled={isSubmitting} innerRef={ input => this.loginInput = input } />
                    </div>
                    <ErrorMessage name='username' component='div' className='error' />

                    <div>
                        <Field type='password' name='password' className='input-group-field' required placeholder={tt('g.password_or_posting')} autoComplete='off'
                            disabled={isSubmitting} />
                    </div>
                    <ErrorMessage name='password' component='div' className='error' />

                    <div>
                        <br />
                        <button type="submit" disabled={isSubmitting || !isValid} className="button">
                            {tt('g.add')}
                        </button>
                        {<button type="button float-right" disabled={isSubmitting} className="button hollow" onClick={this.cancel}>
                            {tt('g.cancel')}
                        </button>}
                    </div>
                </Form>)
                }}
            </Formik>
        </div>
    }
}

export default connect(
    (state, props) => {
        return {
            ...props,
        };
    },
    dispatch => ({
        login: (username, password) => {
            dispatch(user.actions.changeAccount({username, password }))
            dispatch(user.actions.hideAddAccount())
        },
        cancel: () => {
            dispatch(user.actions.hideAddAccount())
            dispatch(user.actions.showChangeAccount())
        }
    })
)(AddAccount)
