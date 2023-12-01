import React from 'react'
import { Link } from 'react-router'
import { connect } from 'react-redux'
import tt from 'counterpart'
import { Asset } from 'golos-lib-js/lib/utils'
import CopyToClipboard from 'react-copy-to-clipboard'
import { IntlContext } from 'react-intl'

import DateJoinWrapper from 'app/components/elements/DateJoinWrapper'
import DropdownMenu from 'app/components/elements/DropdownMenu'
import Icon from 'app/components/elements/Icon'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import TimeAgoWrapper, { wrapDate } from 'app/components/elements/TimeAgoWrapper'
import g from 'app/redux/GlobalReducer'
import LinkEx from 'app/utils/LinkEx'
import { getLastSeen } from 'app/utils/NormalizeProfile'
import { vestsToSteem } from 'app/utils/StateFunctions'

class Referrals extends React.Component {
    static contextType = IntlContext

    constructor(props, context) {
        super(props, context)
    }

    state = {
        copied_addr: false,
    }

    componentDidMount() {
        this.refetch()
    }

    refetch = () => {
        this.props.fetchReferrals(this.props.account, '', this.sort)
    }

    sortOrder = (e, sort) => {
        e.preventDefault()
        this.sort = sort
        this.refetch()
    }

    render() {
        const { referrals, account } = this.props

        const props = this.props.props ? this.props.props.toJS() : {}

        if (!referrals || !referrals.get('loaded')){
            return <div style={{ paddingBottom: '1rem' }}>
                <h3>{tt('referrals_jsx.title')}</h3>
                <LoadingIndicator type='circle' />
            </div>
        }

        let refs = referrals.get('data').toJS()

        let count = 0

        let items = refs.map(ref => {
            ++count

            const { accounts } = this.props
            let acc = accounts.get(ref.account)
            if (acc) acc = acc.toJS()

            let lastSeen
            if (acc) {
                lastSeen = getLastSeen(acc)
            }

            const golosRewards = Asset(ref.referrer_rewards).plus(Asset(ref.referrer_donate_rewards))

            const inactive = acc && acc.referral_end_date.startsWith('19')

            const tdClass = inactive && 'inactive'

            return <tr key={count} className={count % 2 == 0 ? '' : 'zebra'}>
                <td className={!inactive ? undefined : 'inactive-link'} title={!inactive ? (acc && (tt('referrals_jsx.end_date') + wrapDate(acc.referral_end_date, this.context))) : tt('referrals_jsx.inactive')}>
                    <LinkEx to={'/@' + ref.account}><b>
                        {ref.account}
                    </b></LinkEx>
                </td>
                {acc && <td className={tdClass} title={tt('referrals_jsx.vs')}>
                    {Asset(vestsToSteem(acc.vesting_shares, props) + ' GOLOS').floatString}
                </td>}
                {acc && <td className={tdClass} title={tt('referrals_jsx.posts')}>
                    {tt('user_profile.post_count', {count: acc.post_count || 0})}
                </td>}
                <td className={tdClass}>
                    <span title={tt('referrals_jsx.rewards')}>
                        {' +'}
                        {golosRewards.floatString}
                    </span>
                </td>
                <td className={tdClass} title={tt('referrals_jsx.joined')}>
                    <DateJoinWrapper date={ref.joined} />
                </td>
                <td className={tdClass} title={tt('referrals_jsx.last')}>
                    {lastSeen && <TimeAgoWrapper date={`${lastSeen}`} />}
                </td>
            </tr>
        })

        let refUrl
        if (account) {
            refUrl = 'https://' + $STM_Config.site_domain + '/welcome?invite=' + account.name
        }

        const next_start_name = referrals.get('next_start_name')

        const sortItems = [
            { link: '#', onClick: e => {
                this.sortOrder(e, 'by_joined', false)
            }, value: tt('referrals_jsx.by_joined') },
            { link: '#', onClick: e => {
                this.sortOrder(e, 'by_rewards', true)
            }, value: tt('referrals_jsx.by_rewards') },
        ]

        let currentSort = tt('referrals_jsx.by_joined')
        if (this.sort === 'by_rewards') {
            currentSort = tt('referrals_jsx.by_rewards')
        }

        return <div className='Referrals' style={{ paddingBottom: '1rem' }}>
            <h3 style={{ display: 'inline-block' }}>{tt('referrals_jsx.title')}</h3>
            <Link to={`/referrers`} className="button float-right">
                {tt('referrers_jsx.button')}
            </Link>
            <div>{tt('referrals_jsx.desc')}</div>
            {refUrl && <div style={{ display: 'inline-block', fontSize: '85%', marginTop: '1rem', marginBottom: '0.25rem' }}>
                <Icon name="hf/hf5" size="2x" />
                {' '}{tt('g.referral_link')}{' - '}
                <span style={{border: '1px solid lightgray', padding: '5px', borderRadius: '3px'}}>
                    <a target="_blank" href={refUrl}>{refUrl}</a>
                </span>
                <CopyToClipboard text={refUrl} onCopy={() => this.setState({copied_addr: true})}>
                    <span style={{cursor: 'pointer'}}>
                        <Icon name="copy" size="2x" /> {this.state.copied_addr ? <Icon name="copy_ok" /> : null}
                    </span>
                </CopyToClipboard>
                <span className='float-right'>&nbsp;&nbsp;</span>
            </div>}
            <div className='float-right' style={{ marginTop: '0.75rem '}} >
                <DropdownMenu el='div' items={sortItems} selected={currentSort}>
                    <span title={tt('referrals_jsx.sort')} style={{ display: 'block', marginTop: '5px' }}>
                        {currentSort}
                        <Icon name='dropdown-arrow' size='0_95x' />
                    </span>
                </DropdownMenu>
            </div>
            {items.length ? <table style={{marginTop: '1rem'}}>
            <thead>
                <th>{tt('referrals_jsx.name')}</th>
                <th>{tt('referrals_jsx.vs')}</th>
                <th>{tt('referrals_jsx.posts')}</th>
                <th>{tt('referrals_jsx.rewards')}</th>
                <th>{tt('referrals_jsx.joined')}</th>
                <th>{tt('referrals_jsx.last')}</th>
            </thead>
            <tbody>
                {items}
            </tbody></table> : null}
            {next_start_name ? <div className='load-more' key='load_more'>
                <center><button className='button hollow small' onClick={
                    e => this.props.fetchReferrals(this.props.account, next_start_name, this.sort)
                }>{tt('g.load_more')}</button></center>
            </div> : null}
        </div>
    }
}


export default connect(
    state => {
        const referrals = state.global.get('referrals')
        const accounts = state.global.get('accounts')
        const props = state.global.get('props')

        return {
            referrals,
            accounts,
            props,
        }
    },
    dispatch => ({
        fetchReferrals: (referrer, start_name, sort) => {
            if (!referrer) return
            dispatch(g.actions.fetchReferrals({ referrer: referrer.name, start_name, sort }))
        },
    })
)(Referrals)
