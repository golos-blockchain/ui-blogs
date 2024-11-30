import React from 'react'
import { connect } from 'react-redux'
import { Formik, Form, Field, ErrorMessage, } from 'formik'
import tt from 'counterpart'
import { Asset, AssetEditor } from 'golos-lib-js/lib/utils'

import AmountField from 'app/components/elements/forms/AmountField'
import AmountAssetField from 'app/components/elements/forms/AmountAssetField'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import transaction from 'app/redux/Transaction'
import session from 'app/utils/session'
import { withScreenSize } from 'app/utils/ScreenSize'

class SponsorSubscription extends React.Component {
    constructor(props) {
        super(props)
    }

    state = {
    }

    async componentDidMount() {
        await this.initForm()
    }

    async componentDidUpdate() {
        await this.initForm()
    }

    initForm = async () => {
        if ((!this.state.pso && this.props.pso)
            || (this.state.pso && this.state.pso.author !== this.props.pso.get('author'))) {
            const pso = this.props.pso.toJS()
            pso.cost = await AssetEditor(pso.cost)
            this.setState({
                pso
            })
        }
    }

    createNew = (e) => {
        e.preventDefault()
        this.setState({
            creating: true,
            pso: {
                ...this.state.pso,
                cost: AssetEditor('1000.000 GOLOS')
            }
        })
    }

    cancelCreate = (e) => {
        e.preventDefault()
        this.setState({
            creating: false
        })
    }

    validate = (values) => {
        const errors = {}
        if (values.cost.asset.eq(0)) {
            errors.cost = tt('sponsors_jsx.fill_cost')
        }
        return errors
    }

    setSubmitting = (submitting) => {
        this.setState({ submitting })
    }

    _onSubmit = async (values) => {
        const { username } = this.props
        this.setSubmitting(true)
        if (values.author) {
            await this.props.updatePso(username, values.oid, values.cost, values.subscribers, () => {
                this.setState({
                    saved: true,
                })
                setTimeout(() => {
                    this.setState({
                        saved: false
                    })
                }, 2000)
                this.setSubmitting(false)
            }, (err) => {
                console.error(err)
                this.setSubmitting(false)
            })
            return
        }
        await this.props.createPso(username, values.oid, values.cost, () => {
            this.props.fetchState()
            this.setState({
                created: true,
            })
            setTimeout(() => {
                this.setState({
                    created: false
                })
            }, 3000)
            this.setSubmitting(false)
        }, (err) => {
            console.error(err)
            this.setSubmitting(false)
        })
    }

    deletePso = async (e) => {
        e.preventDefault()
        this.setSubmitting(true)

        const { pso } = this.state
        const { username } = this.props
        await this.props.deletePso(username, pso.oid, pso.subscribers, () => {
            this.props.fetchState()
            this.setSubmitting(false)
        }, (err) => {
            console.error(err)
            this.setSubmitting(false)
        })
    }

    _renderSubmittingIndicator = () => {
        const { submitting } = this.state

        return submitting ? <span className='submitter'>
            <LoadingIndicator type='circle' />
        </span> : null
    }

    render() {
        const { pso, creating, submitting } = this.state

        let { account, username, isS } = this.props
        if (!username && process.env.BROWSER) {
            username = session.load().currentName
        }

        if (!pso || !account) {
            return <div>
                <h3>{tt('sponsors_jsx.title')}</h3>
                <LoadingIndicator type='circle' />
            </div>
        }

        if (account.name !== username) {
            if (!pso.author) {
                return <div>
                    <h3>{tt('sponsors_jsx.title')}</h3>
                    {tt('sponsors_jsx.not_yet_NAME', { NAME: account.name })}
                </div>
            }
            return <div>
                <h3>{tt('sponsors_jsx.title')}</h3>
                {tt('poststub.for_sponsors2')}
                <b>{pso.cost.asset.floatString}</b>
                {pso.tip_cost ? tt('poststub.for_sponsors3') : null}
                {tt('poststub.for_sponsors4')}{' '}
            </div>
        }

        if (creating || pso.author) {
            const assets = {}
            assets['GOLOS'] = { supply: Asset(0, 3, 'GOLOS') }
            for (const asset of this.props.tokens) {
                asset.supply = asset.supply.symbol ? asset.supply : Asset(asset.supply)
                assets[asset.supply.symbol] = asset
            }

            return <div>
                <h3>{tt('sponsors_jsx.title')}</h3>
                <Formik
                    initialValues={this.state.pso}
                    enableReinitialize={true}
                    validate={this.validate}
                    onSubmit={this._onSubmit}
                >
                {({
                    handleSubmit, isValid, values, dirty, setFieldValue, handleChange,
                }) => {
                    const { symbol } = values.cost.asset
                    const clsColumn = 'column small-' + (isS ? '10' : '6')
                    return (
                <Form>
                    <div>
                        {tt('sponsors_jsx.cost')}
                    </div>
                    <div className='row'>
                        <div className={clsColumn}>
                            <div className='input-group' style={{marginBottom: 5}}>
                                <AmountField name='cost' />
                                <span className="input-group-label" style={{paddingLeft: 0, paddingRight: 0}}>
                                    <AmountAssetField amountField='cost' setFieldValue={setFieldValue} values={values} assets={assets} />
                                </span>
                            </div>
                            <ErrorMessage name='cost' component='div' className='error' />
                        </div>
                    </div>
                    <div className='row' style={{ marginTop: '0.5rem' }}>
                        {pso.author ? <div className={clsColumn}>
                            <button type='submit' disabled={!isValid || !dirty || submitting} className='button'>
                                {tt('g.save')}
                            </button>
                            <button type='button' disabled={submitting} className='button hollow alert' onClick={this.deletePso}>
                                {tt('g.delete')}
                            </button>
                            {this._renderSubmittingIndicator()}
                            {this.state.saved ? <small className="success uppercase saved">{tt('g.saved') + '!'}</small> : null}
                            {this.state.created ? <small className="success uppercase saved">{tt('sponsors_jsx.created') + '!'}</small> : null}
                        </div> : <div className={clsColumn}>
                            <button type='submit' disabled={!isValid || submitting} className='button'>
                                {tt('g.create')}
                            </button>
                            <button type='button' disabled={submitting} className='button hollow' onClick={this.cancelCreate}>
                                {tt('g.cancel')}
                            </button>
                            {this._renderSubmittingIndicator()}
                            {this.state.created ? <small className="success uppercase saved">{tt('sponsors_jsx.created') + '!'}</small> : null}
                        </div>}
                    </div>
                </Form>
                )}}</Formik>
            </div>
        } else {
            return <div>
                <h3>{tt('sponsors_jsx.title')}</h3>
                {tt('sponsors_jsx.not_yet') + ' '}
                <a href='#' onClick={this.createNew}>{tt('sponsors_jsx.create_it')}</a>
                {tt('sponsors_jsx.to_be_able_to_create_paid_posts')}
            </div>
        }
    }
}

export default connect(
    state => {
        const current_user = state.user.get('current')
        const username = current_user ? current_user.get('username') : null
        const pso = state.global.get('pso')
        const tokens = state.global.get('tokens')

        return {
            current_user,
            username,
            pso,
            tokens: tokens ? tokens.toJS() : {},
        };
    },
    dispatch => ({
        createPso: async (author, oid, cost, successCallback, errorCallback) => {
            const operation = {
                author,
                oid,
                cost: cost.asset.toString(),
                tip_cost: true,
                allow_prepaid: false,
                interval: 30*24*60*60,
                executions: 4294967295,
                extensions: []
            }
            dispatch(
                transaction.actions.broadcastOperation({
                    type: 'paid_subscription_create',
                    operation,
                    successCallback,
                    errorCallback
                })
            )
        },
        updatePso: async (author, oid, cost, subscribers, successCallback, errorCallback) => {
            const operation = {
                author,
                oid,
                cost: cost.asset.toString(),
                tip_cost: true,
                interval: 30*24*60*60,
                executions: 4294967295,
                extensions: []
            }
            const confirm = tt('sponsors_jsx.are_you_sure_update')
            dispatch(
                transaction.actions.broadcastOperation({
                    type: 'paid_subscription_update',
                    confirm,
                    operation,
                    successCallback,
                    errorCallback
                })
            )
        },
        deletePso: async (author, oid, subscribers, successCallback, errorCallback) => {
            const operation = {
                author,
                oid,
                extensions: []
            }
            let confirm = tt('sponsors_jsx.are_you_sure')
            subscribers
            if (subscribers) {
                confirm = tt('sponsors_jsx.are_you_sure_COUNT', { COUNT: subscribers})
            }
            dispatch(
                transaction.actions.broadcastOperation({
                    type: 'paid_subscription_delete',
                    confirm,
                    operation,
                    successCallback,
                    errorCallback
                })
            )
        },
        fetchState: () => {
            const pathname = window.location.pathname
            dispatch({type: 'FETCH_STATE', payload: {pathname}})
        }
    })
)(withScreenSize(SponsorSubscription))
