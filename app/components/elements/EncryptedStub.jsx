import React from 'react'
import tt from 'counterpart'
import {connect} from 'react-redux'
import { Asset } from 'golos-lib-js/lib/utils'

import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import transaction from 'app/redux/Transaction'
import LinkEx from 'app/utils/LinkEx'
import { EncryptedStates, makeOid } from 'app/utils/sponsors'

class EncryptedStub extends React.Component {
    state = {}

    _renderAuthor = (title, author) => {
        return <div>
            {title}
            <LinkEx to={'/@' + author}>
                {'@' + author}
            </LinkEx>
        </div>
    }

    _renderSub = (sub) => {
        if (!sub) return null
        sub = sub.toJS()
        return <div>
            <br />{tt('poststub.for_sponsors2')}
            <b>{Asset(sub.cost).floatString}</b>
            {sub.tip_cost ? tt('poststub.for_sponsors3') : null}
            {tt('poststub.for_sponsors4')}{' '}<br />
            {tt('poststub.for_sponsors5')}{' '}
        </div>
    }

    _renderButton = (sub, title) => {
        if (!sub) return null

        const onClick = (e) => {
            e.preventDefault()

            const { dis, username } = this.props
            const author = dis.get('author')
            const sub = dis.get('encrypted_sub').toJS()
            const { cost, tip_cost } = sub

            this.setState({ submitting: true, err: null })

            this.props.transfer(username, author, cost, tip_cost, () => {
                setTimeout(() => {
                    this.setState({ submitting: false })

                    this.props.fetchState()
                }, 1500)
            }, (err) => {
                this.setState({ submitting: false, err })
            })
        }

        const { err } = this.state

        return <div>
            <button className='button small' style={{marginTop: '0.5rem', display: 'block'}}
                    onClick={onClick}>
                {title}
            </button>
            <div className='error' style={{ marginTop: '0.5rem' }}>
                {err && err.toString()}
            </div>
        </div>
    }

    render() {
        const { dis, encrypted, username } = this.props

        const author = dis.get('author')

        if (encrypted === EncryptedStates.no_auth) {
            return (<div>
                {this._renderAuthor(tt('poststub.for_sponsors'), author)}
                {tt('poststub.login_to_become_sponsor')}
            </div>)
        } else if (encrypted === EncryptedStates.no_sponsor) {
            const sub = dis.get('encrypted_sub')

            if (!username) {
                return (<div>
                    {this._renderAuthor(tt('poststub.for_sponsors'), author)}
                    {tt('poststub.login_to_become_sponsor')}
                </div>)
            }

            return (<div>
                {this._renderAuthor(tt('poststub.for_sponsors'), author)}
                {this._renderSub(sub)}
                {this._renderButton(sub, tt('poststub.become_sponsor'))}
            </div>)
        } else if (encrypted === EncryptedStates.inactive) {
            const sub = dis.get('encrypted_sub')

            return (<div>
                {this._renderAuthor(tt('poststub.sponsorship_expired'), author)}
                {this._renderSub(sub)}
                {this._renderButton(sub, tt('poststub.prolong_sponsorship'))}
            </div>)
        } else if (encrypted === EncryptedStates.no_key) {
            return <div>{tt('postsummary_jsx.no_decrypt_key')}</div>
        } else if (encrypted === EncryptedStates.no_sub) {
            return <div>{tt('postsummary_jsx.no_sub')}</div>
        } else if (encrypted === EncryptedStates.wrong_format) {
            return <div>{tt('postsummary_jsx.wrong_format')}</div>
        }
        return <div>{tt('postsummary_jsx.no_decrypt_key')}</div>
    }
}

export default connect(
    (state, ownProps) => {
        const current_user = state.user.get('current')
        const username = current_user ? current_user.get('username') : null

        return {
            username
        }
    },
    (dispatch) => ({
        transfer: (username, author, amount, from_tip, onSuccess, onError) => {
            dispatch(transaction.actions.broadcastOperation({
                type: 'paid_subscription_transfer',
                operation: {
                    from: username,
                    to: author,
                    oid: makeOid(),
                    amount,
                    memo: '',
                    from_tip,
                },
                username,
                successCallback: () => {
                    onSuccess()
                },
                errorCallback: (err) => {
                    onError(err)
                }
            }))
        },
        fetchState: () => {
            const pathname = window.location.pathname
            dispatch({type: 'FETCH_STATE', payload: {pathname}})
        }
    })
)(EncryptedStub)
