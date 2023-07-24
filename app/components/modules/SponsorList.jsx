import React from 'react'
import { connect } from 'react-redux'
import tt from 'counterpart'
import { Asset } from 'golos-lib-js/lib/utils'

import DialogManager from 'app/components/elements/common/DialogManager';
import Icon from 'app/components/elements/Icon'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper'
import g from 'app/redux/GlobalReducer'
import transaction from 'app/redux/Transaction'
import LinkEx from 'app/utils/LinkEx'
import session from 'app/utils/session'
import { makeOid, SPONSORS_PER_PAGE } from 'app/utils/sponsors'
import { walletUrl } from 'app/utils/walletUtils'

class SponsorList extends React.Component {
    state = {
        from: '',
        prevFroms: [],
    }

    /*shouldComponentUpdate(nextProps) {
        const { items, username } = this.props
        console.log('scu', items.data.length, nextProps.items.data.length)
        return items.data.length !== nextProps.items.data.length ||
            items.loading !== nextProps.loading ||
            username !== nextProps.username
    }*/

    goBack = async (e) => {
        e.preventDefault()
        
        const { account } = this.props
        const prevFroms = [ ...this.state.prevFroms ]
        const prevFrom = prevFroms.pop()
        if (this.props.type === 'sponsoreds') {
            await this.props.fetchSponsoreds(account.name, prevFrom)
        } else {
            await this.props.fetchSponsors(account.name, prevFrom)
        }
        this.setState({
            prevFroms,
            from: prevFrom
        })
    }

    goNext = async (e) => {
        e.preventDefault()

        const isSponsoreds = this.props.type === 'sponsoreds'
        
        const { account, items } = this.props

        const last = items.data[items.data.length - 1]
        let newFrom
        if (isSponsoreds) {
            newFrom = last.author
            await this.props.fetchSponsoreds(account.name, newFrom)
        } else {
            newFrom = last.subscriber
            await this.props.fetchSponsors(account.name, newFrom)
        }

        const { prevFroms, from } = this.state
        this.setState({
            prevFroms: [...prevFroms, from],
            from: newFrom
        })
    }

    render() {
        const { items, type } = this.props

        const isSponsoreds = type === 'sponsoreds'

        let content

        let { username } = this.props
        if (!username && process.env.BROWSER) {
            username = session.load().currentName
        }

        if (!items.data.length) {
            const { account, } = this.props
            const isMyAccount = account.name === username
            if (isSponsoreds) {
                return <div>
                    {isMyAccount ? tt('sponsorslist_jsx.no_sponsoreds') : account.name + tt('sponsorslist_jsx.no_sponsoreds2')}
                </div>
            } else {
                return <div>
                    {isMyAccount ? tt('sponsorslist_jsx.no_sponsors') : account.name + tt('sponsorslist_jsx.no_sponsors2')}
                </div>
            }
        }

        let hasMore = false
        let rows = []
        let count = 0
        for (let s of items.data) {
            hasMore = count == SPONSORS_PER_PAGE
            if (hasMore) {
                break
            }

            let cost = Asset(s.cost).floatString

            const expiredHint = (e) => {
                e.preventDefault()
                DialogManager.info(<div>
                    {tt('sponsorslist_jsx.expired_hint')
                    + (s.tip_cost ? 'TIP-' : '')}
                    <LinkEx to={walletUrl('/@' + s.subscriber)} target='_blank' rel='nofollow noreferrer'>{tt('g.balance')}</LinkEx>
                    {' ' + tt('g.on_by') + ' '}
                    <b>{cost}</b>
                    {'. ' + tt('sponsorslist_jsx.expired_hint2')}
                </div>, '')
            }

            const prolongIt = (e) => {
                e.preventDefault()
                this.props.prolong(s.subscriber, s.author, s.cost, s.tip_cost, () => {
                }, (err) => {
                })
            }

            const cancelIt = (e) => {
                e.preventDefault()
                this.props.cancel(s.subscriber, s.author, () => {
                    window.location.reload()
                }, (err) => {
                })
            }

            if (s.tip_cost) {
                cost += tt('poststub.for_sponsors3')
            }

            const user = isSponsoreds ? s.author : s.subscriber

            const mySponsored = username === s.subscriber

            rows.push(<tr key={user} className={count % 2 == 0 ? '' : 'zebra'}>
                <td><LinkEx to={'/@' + user}><b>{user}</b></LinkEx></td>
                <td title={tt('g.per_month')}>{cost}</td>
                {s.active ? <td title={tt('sponsorslist_jsx.payment_hint')}>
                    {tt('sponsorslist_jsx.payment') + ' '}
                    <TimeAgoWrapper date={s.next_payment} />
                </td> : <td>
                    {s.inactive_reason === 'subscription_update' ? <span>
                        <span className='error'>
                            {tt('sponsorslist_jsx.expired_update')}
                        </span>
                    </span> : <span style={{ cursor: mySponsored ? 'pointer' : 'auto' }} onClick={mySponsored ? expiredHint : undefined}>
                        <span className='error'>
                            {tt('sponsorslist_jsx.expired')}
                        </span>
                        {' '}
                        {mySponsored ? <Icon name="info_o" /> : null}
                    </span>}
                </td>}
                {mySponsored ? <td>
                    {!s.active ? <button className='button hollow small' onClick={prolongIt}>{tt('poststub.prolong_sponsorship')}</button> : null}
                    <button className='button hollow small alert' onClick={cancelIt}>{tt('g.cancel2')}</button>
                </td> : <td></td>}
            </tr>)

            ++count
        }

        const { from } = this.state

        const navButtons = (
             <nav style={{ height: '3rem' }}>
               <ul className="pager">
                 <li>
                     <div className={"button tiny hollow float-left " + (!from ? " disabled" : "")} onClick={from ? this.goBack : null} aria-label={tt('g.previous')}>
                         <span aria-hidden="true">&larr; {tt('g.previous')}</span>
                     </div>
                 </li>
                 <li>
                     <div className={"button tiny hollow float-right " + (!hasMore ? " disabled" : "")} onClick={hasMore ? this.goNext : null} aria-label={tt('g.next')}>
                         <span aria-hidden="true">{tt('g.next')} &rarr;</span>
                     </div>
                 </li>
               </ul>
             </nav>
        )

        content = <div className='SponsorList__content'>
            {items.loading ? <LoadingIndicator type='circle' /> :
            <table><tbody>
                {rows}
            </tbody></table>}
        </div>

        return <div>
            {navButtons}
            {content}
            {navButtons}
        </div>
    }
}

export default connect(
    state => {
        return {
        };
    },
    dispatch => ({
        prolong: (username, author, amount, from_tip, onSuccess, onError) => {
            dispatch(transaction.actions.broadcastOperation({
                type: 'paid_subscription_transfer',
                operation: {
                    from: username,
                    to: author,
                    oid: makeOid(),
                    amount,
                    memo: '',
                    from_tip,
                    extensions: [],
                    __prolong: true
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
        cancel: (username, author, onSuccess, onError) => {
            dispatch(transaction.actions.broadcastOperation({
                type: 'paid_subscription_cancel',
                confirm: tt('sponsorslist_jsx.cancel_confirm'),
                operation: {
                    subscriber: username,
                    author,
                    oid: makeOid(),
                    extensions: [],
                    __config: {title: tt('g.are_you_sure')}
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
        fetchSponsors: (author, from) => {
            dispatch(g.actions.fetchSponsors({
                author, from
            }))
        },
        fetchSponsoreds: (sponsor, from) => {
            dispatch(g.actions.fetchSponsoreds({
                sponsor, from
            }))
        }
    })
)(SponsorList)