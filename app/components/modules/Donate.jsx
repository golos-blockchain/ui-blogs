import React from 'react'
import { connect } from 'react-redux'
import { Formik, Form, Field, ErrorMessage, } from 'formik'
import { Map } from 'immutable'
import { Asset, AssetEditor } from 'golos-lib-js/lib/utils'
import tt from 'counterpart'

import g from 'app/redux/GlobalReducer'
import transaction from 'app/redux/Transaction'
import user from 'app/redux/User'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import AmountField from 'app/components/elements/forms/AmountField'
import MemoInput from 'app/components/elements/forms/MemoInput'
import FormikAgent from 'app/components/elements/donate/FormikUtils'
import PresetSelector from 'app/components/elements/donate/PresetSelector'
import TipAssetList from 'app/components/elements/donate/TipAssetList'
import VoteSlider from 'app/components/elements/donate/VoteSlider'
import { checkMemo } from 'app/utils/ParsersAndFormatters';
import { accuEmissionPerDay } from 'app/utils/StateFunctions'
import { checkAllowed, AllowTypes } from 'app/utils/Allowance'

class Donate extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            initialValues: {
                amount: AssetEditor(0, 3, 'GOLOS'),
                sliderPercent: 100,
                memo: ''
            },
            isMemoEncrypted: false
        }
    }

    componentDidMount() {
        if (!this.props.uias.size) {
            this.props.fetchUIABalances(this.props.currentUser)
        }
    }

    balanceValue = () => {
        let res = null
        const { opts, currentAccount } = this.props
        const { sym } = opts
        if (sym === 'GOLOS') {
            if (currentAccount) {
                res = Asset(currentAccount.get('tip_balance'))
            }
        } else {
            const uias = this.props.uias && this.props.uias.toJS()
            if (uias) {
                res = Asset(uias[sym].tip_balance)
            }
        }
        return res
    }

    validate = (values) => {
        const errors = {}
        const balance = this.balanceValue()
        if (balance && values.amount.asset.gt(balance)) {
            errors.amount = tt('transfer_jsx.insufficient_funds')
        }
        if (checkMemo(values.memo)) {
            errors.memo = tt('transfer_jsx.private_key_in_memo')
        }
        return errors
    }

    onSliderChange = (sliderPercent, values, setFieldValue) => {
        setFieldValue('sliderPercent', sliderPercent)

        const { sliderMax } = this.props
        let amount = sliderMax.mul(sliderPercent).div(100)
        amount = amount.toString(0).split(' ')[0]
        setFieldValue('amount', values.amount.withChange(amount))
    }

    onPresetChange = (amountStr, values, setFieldValue) => {
        setFieldValue('amount', values.amount.withChange(amountStr))
    }

    onTipAssetChanged = (sym, precision) =>{
        const donateDefs = {...this.props.opts}
        donateDefs.sym = sym
        donateDefs.precision = precision
        this.props.setDonateDefaults(donateDefs)
    }

    _onSubmit = async (values, actions) => {
        const { currentUser, opts, dispatchSubmit } = this.props
        const { to, permlink, is_comment } = opts
        const { isMemoEncrypted } = this.state
        const vote = {
            percent: values.sliderPercent * 100
        }
        await dispatchSubmit({
            to, amount: values.amount.asset, memo: values.memo, isMemoEncrypted,
            permlink, is_comment,
            vote,
            myVote: opts.myVote * 100,
            voteAllowType: opts.voteAllowType,
            currentUser,
            errorCallback: (err) => {
                if (err) {
                    actions.setErrors({ memo: err.message || err })
                }
                actions.setSubmitting(false)
            }
        })
    }

    render() {
        const { currentUser, currentAccount, opts, uias, sliderMax } = this.props
        const { sym } = opts
        const { isMemoEncrypted } = this.state

        const form = (<Formik
            initialValues={this.state.initialValues}
            enableReinitialize={true}
            validate={this.validate}
            onSubmit={this._onSubmit}
        >
        {({
            handleSubmit, isSubmitting, isValid, values, setFieldValue, handleChange,
        }) => {
            let disabled = null
            if (opts.myVote) {
                disabled = !isValid ||
                    (values.sliderPercent === opts.myVote && !values.amount.asset.amount)
            } else {
                disabled = !isValid ||
                    (!values.sliderPercent && !values.amount.asset.amount)
            }
            return (
        <Form>
            <Field name='sliderPercent' as={VoteSlider}
                onChange={val => this.onSliderChange(val, values, setFieldValue)} />

            <div className='row'>
                <div className='column small-2' style={{paddingTop: '1rem'}}>
                    {tt('transfer_jsx.donate_amount')}
                </div>
                <div className='column small-2' style={{paddingTop: '0.55rem'}}>
                    <div className='input-group' style={{marginBottom: 5}}>
                        <AmountField
                            placeholder={tt('transfer_jsx.donate_amount')}
                        />
                    </div>
                </div>
                <div className='column small-8' style={{paddingTop: '0.4rem'}}>
                    <PresetSelector
                    username={currentUser.get('username')}
                    amountStr={values.amount.amountStr}
                    onChange={amountStr => this.onPresetChange(amountStr, values, setFieldValue)}
                    />
                    <TipAssetList
                        value={sym} uias={uias} currentAccount={currentAccount}
                        currentBalance={this.balanceValue()}
                        onChange={this.onTipAssetChanged}
                    />
                </div>
            </div>
            <div className='row'>
                <div className='column small-12'>
                    <ErrorMessage name='amount' component='div' className='error' />
                </div>
            </div>

            <div className='row' style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                <div className='column small-2' style={{paddingTop: '7px'}}>
                    {tt('transfer_jsx.memo')}
                </div>
                <div className='column small-10'>
                    <Field name='memo' as={MemoInput} currentUser={currentUser}
                        compact={true}
                        isEncrypted={isMemoEncrypted}
                        onToggleEncrypted={(isMemoEncrypted, memo) => {
                            this.setState({ isMemoEncrypted })
                            setFieldValue('memo', memo)
                        }}
                    />
                    <ErrorMessage name='memo' component='div' className='error' />
                </div>
            </div>

            {isSubmitting ? <span><LoadingIndicator type='circle' /><br /></span>
            : <span>
                <button type='submit' disabled={disabled} className='button'>
                    {tt('g.donate_support')}
                </button>
            </span>}

            <FormikAgent opts={opts} setFieldValue={setFieldValue}
                sliderMax={sliderMax} currentUser={currentUser} myVote={opts.myVote} />
        </Form>
        )}}</Formik>)

        return <div>
               <div className='row'>
                   <h3>{tt('transfer_jsx.donate_support')}</h3>
               </div>
            {form}
        </div>
    }
}

export default connect(
    (state, ownProps) => {
        const opts = state.user.get('donate_defaults', Map()).toJS()

        const currentUser = state.user.getIn(['current'])
        const currentAccount = currentUser && state.global.getIn(['accounts', currentUser.get('username')])

        let uias = state.global.get('assets')
        let uia 
        if (uias) {
            uia = uias.get(opts.sym)
        }

        let sliderMax = null
        if (!uia) {
            const gprops = state.global.get('props')
            const emission = accuEmissionPerDay(currentAccount, gprops)

            sliderMax = Asset(0, 3, 'GOLOS')
            sliderMax.amountFloat = emission.toString()

            const username = currentUser.get('username')
            let emissionDonatePct = localStorage.getItem('donate.emissionpct-' + username)
            emissionDonatePct = emissionDonatePct ? parseFloat(emissionDonatePct) : 10

            sliderMax = sliderMax.mul(emissionDonatePct).div(100)

            if (sliderMax.amount < 1000) {
                sliderMax.amount = 1000
            }

            const balance = Asset(currentAccount.get('tip_balance'))
            if (sliderMax.gt(balance)) {
                sliderMax = balance
            }
        } else {
            sliderMax = Asset(uia.get('tip_balance'))
        }

        return { ...ownProps,
            currentUser,
            currentAccount,
            opts,
            sliderMax,
            uias
        }
    },
    dispatch => ({
        fetchUIABalances: (currentUser) => {
            if (!currentUser) return
            const account = currentUser.get('username')
            dispatch(g.actions.fetchUiaBalances({ account }))
        },
        setDonateDefaults: (donateDefaults) => {
            dispatch(user.actions.setDonateDefaults(donateDefaults))
        },
        dispatchSubmit: async ({
            to, amount, memo, isMemoEncrypted,
            permlink, is_comment, vote, myVote, voteAllowType, currentUser, errorCallback
        }) => {
            const username = currentUser.get('username')

            let operation = {
                from: username, to, amount: amount.toString()
            }

            operation.memo = {
                app: 'golos-blog', version: 1, comment: memo,
                target: {
                    author: to, permlink
                }
            }

            if (isMemoEncrypted)
                operation._memo_private = true

            let trx = [
                ['donate', operation]
            ]
            let aTypes = [
                AllowTypes.transfer
            ]
            if (vote && vote.percent !== myVote) {
                const voteOp = {
                    voter: username, author: to, permlink,
                    weight: vote.percent
                }
                if (amount.amount <= 0) {
                    trx = []
                    aTypes = []
                }
                trx.push(['vote', voteOp])
                aTypes.push(voteAllowType)

                if (!myVote) {
                    localStorage.removeItem('vote_weight'); // deprecated
                    localStorage.setItem('voteWeight-' + username + (is_comment ? '-comment' : ''),
                        vote.percent)
                }
            }

            const successCallback = () => {
                let pathname
                if (amount.isUIA) {
                    pathname = `@${username}/transfers`
                } else {
                    pathname = `@${username}/assets`
                }
                dispatch({type: 'FETCH_STATE', payload: {pathname}})
                dispatch(user.actions.hideDonate())
            }

            let confirm
            const tipAmount = Asset(operation.amount)
            const blocking = await checkAllowed(operation.from, [operation.to], tipAmount, aTypes)
            if (blocking.error) {
                errorCallback(blocking.error)
                return
            }
            confirm = blocking.confirm

            dispatch(transaction.actions.broadcastOperation({
                type: 'donate', username, trx, confirm, successCallback, errorCallback
            }))
        }
    })
)(Donate)
