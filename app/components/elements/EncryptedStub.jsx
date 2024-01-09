import React from 'react'
import tt from 'counterpart'
import {connect} from 'react-redux'
import { Asset } from 'golos-lib-js/lib/utils'

import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import transaction from 'app/redux/Transaction'
import { checkAllowed, AllowTypes } from 'app/utils/Allowance'
import LinkEx from 'app/utils/LinkEx'
import { EncryptedStates, makeOid } from 'app/utils/sponsors'

class EncryptedStub extends React.Component {
    state = {}

    _renderAuthor = (title, author) => {
        return <div>
            {title}
            <LinkEx to={'/@' + author}>
                {'@' + author}
            </LinkEx>{'. '}
        </div>
    }

    _renderSub = (sub) => {
        if (!sub) return null
        sub = sub.toJS()
        return <div>
            {tt('poststub.for_sponsors2')}
            <b>{Asset(sub.cost).floatString}</b>
            {sub.tip_cost ? tt('poststub.for_sponsors3') : null}
            {tt('poststub.for_sponsors4')}{' '}
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
                err = err.message || err
                if (err && err.includes('Account does not have sufficient funds')) {
                    err = tt('transfer_jsx.insufficient_funds')
                }
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

    onDonateClick = (e, decrypt_fee) => {
        e.preventDefault()

        const { dis, username, } = this.props

        const author = dis.get('author')
        const permlink = dis.get('permlink')

        this.setState({ submitting: true, err: null })

        this.props.donate({
            username,
            to: author,
            permlink,
            amount: decrypt_fee,
            successCallback: () => {
                this.setState({ submitting: false })
            },
            errorCallback: (err) => {
                console.error(err)
                err = err.message || err
                if (err && err.includes('Account does not have sufficient funds')) {
                    err = tt('transfer_jsx.insufficient_funds')
                }

                this.setState({ submitting: false, err })
            }
        })
    }

    _renderDonate = (decrypt_fee, isMy) => {
        if (isMy || !decrypt_fee) return null
        decrypt_fee = Asset(decrypt_fee)
        if (decrypt_fee.eq(0)) return null
        return <div>
            {tt('poststub.you_can_decrypt_just_this_post')}
            <b>{decrypt_fee.floatString}</b>.<br/>
            <button className='button hollow small' style={{ marginTop: '0.5rem' }}
                    onClick={e => this.onDonateClick(e, decrypt_fee)}>
                {tt('poststub.donate')}
            </button>
        </div>
    }

    onDeleteClick = (e) => {
        e.preventDefault()

        const { dis, } = this.props

        const author = dis.get('author')
        const permlink = dis.get('permlink')

        this.props.deletePost(author, permlink)
    }

    render() {
        const { dis, encrypted, username } = this.props

        const author = dis.get('author')

        const isMy = author === username

        const btn = isMy && <div><button onClick={this.onDeleteClick} className='button alert slim hollow'>{tt('g.remove')}</button></div>

        if (this.state.submitting) {
            return <LoadingIndicator type='circle' />
        }

        if ((encrypted === EncryptedStates.no_sponsor && !username) || encrypted === EncryptedStates.no_auth) {
            return (<div>
                    {this._renderAuthor(tt('poststub.for_sponsors'), author)}
                    {tt('poststub.login_to_become_sponsor')}
            </div>)
        } else if (encrypted === EncryptedStates.no_sponsor) {
            const sub = dis.get('encrypted_sub')
            const encrypted_decrypt_fee = dis.get('encrypted_decrypt_fee')

            return (<div>
                {this._renderAuthor(tt('poststub.for_sponsors'), author)}
                {this._renderSub(sub)}
                {this._renderButton(sub, tt('poststub.become_sponsor'))}
                {this._renderDonate(encrypted_decrypt_fee, isMy)}
            </div>)
        } else if (encrypted === EncryptedStates.inactive) {
            const sub = dis.get('encrypted_sub')
            const encrypted_decrypt_fee = dis.get('encrypted_decrypt_fee')

            return (<div>
                {this._renderAuthor(tt('poststub.sponsorship_expired'), author)}
                {this._renderSub(sub)}
                {this._renderButton(sub, tt('poststub.prolong_sponsorship'))}
                {this._renderDonate(encrypted_decrypt_fee, isMy)}
            </div>)
        } else if (encrypted === EncryptedStates.no_key) {
            return <div>{tt('postsummary_jsx.no_decrypt_key')}{btn}</div>
        } else if (encrypted === EncryptedStates.no_sub) {
            const encrypted_decrypt_fee = dis.get('encrypted_decrypt_fee')

            const donateWay = this._renderDonate(encrypted_decrypt_fee, isMy)

            return <div>{!donateWay && tt('postsummary_jsx.no_sub')}
                {donateWay}
            </div>
        } else if (encrypted === EncryptedStates.wrong_format) {
            return <div>{tt('postsummary_jsx.wrong_format')}{btn}</div>
        }
        return <div>{tt('postsummary_jsx.no_decrypt_key')}{btn}</div>
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
        deletePost(author, permlink) {
            dispatch(
                transaction.actions.broadcastOperation({
                    type: 'delete_comment',
                    operation: { author, permlink },
                    confirm: tt('g.are_you_sure'),
                })
            );
        },
        donate: async ({
            username, to, permlink, amount, successCallback, errorCallback
        }) => {
            let operation = {
                from: username, to, amount: amount.toString()
            }

            operation.memo = {
                app: 'golos-blog', version: 1, comment: '',
                target: {
                    author: to, permlink
                }
            }

            let trx = [
                ['donate', operation]
            ]
            let aTypes = [
                AllowTypes.transfer
            ]

            const onSuccess = () => {
                const pathname = window.location.pathname
                dispatch({type: 'FETCH_STATE', payload: {pathname}})
                successCallback()
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
                type: 'donate', username, trx, confirm, successCallback: onSuccess, errorCallback
            }))
        },
        fetchState: () => {
            const pathname = window.location.pathname
            dispatch({type: 'FETCH_STATE', payload: {pathname}})
        }
    })
)(EncryptedStub)
