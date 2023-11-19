import React from 'react'
import { connect } from 'react-redux'
import tt from 'counterpart'
import { Asset } from 'golos-lib-js/lib/utils'

import DropdownMenu from 'app/components/elements/DropdownMenu'
import Icon from 'app/components/elements/Icon'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import g from 'app/redux/GlobalReducer'
import { vestsToSteem } from 'app/utils/StateFunctions'
import LinkEx from 'app/utils/LinkEx'

class Referrers extends React.Component {
    constructor(props) {
        super(props)
    }

    state = {
    }

    componentDidMount() {
        this.refetch()
    }

    refetch = () => {
        this.props.fetchReferrers('', this.sort)
    }

    sortOrder = (e, sort) => {
        e.preventDefault()
        this.sort = sort
        this.refetch()
    }

    render() {
        const { referrers } = this.props

        const props = this.props.props ? this.props.props.toJS() : {}

        if (!referrers || !referrers.get('loaded')){
            return <div className='column' style={{marginTop: '3.5rem'}}>
                <div className='row'>
                    <div style={{ paddingBottom: '1rem' }}>
                        <h3>{tt('referrers_jsx.title')}</h3>
                        <LoadingIndicator type='circle' />
                    </div>
                </div>
            </div>
        }

        let refs = referrers.get('data').toJS()

        let count = 0

        let items = refs.map(ref => {
            ++count

            const golosRewards = Asset(ref.referrer_rewards).plus(Asset(ref.referrer_donate_rewards))

            const tdClass = ''

            return <tr key={count} className={count % 2 == 0 ? '' : 'zebra'}>
                <td>
                    {count}
                </td>
                <td>
                    <LinkEx to={'/@' + ref.account}><b>
                        {ref.account}
                    </b></LinkEx>
                </td>
                <td className={tdClass} title={tt('referrers_jsx.referral_count')}>
                    <LinkEx to={'/@' + ref.account + '/referrals'}>
                        {tt('user_profile.referral_count', {count: ref.referral_count || 0})}
                    </LinkEx>
                </td>
                 <td className={tdClass} title={tt('referrers_jsx.post_count')}>
                    {tt('user_profile.post_count', {count: ref.referral_post_count || 0})}
                </td>
                <td className={tdClass} title={tt('referrers_jsx.vs')}>
                    {Asset(vestsToSteem(ref.total_referral_vesting, props) + ' GOLOS').floatString}
                </td>
            </tr>
        })

        const next_start_name = referrers.get('next_start_name')

        const sortItems = [
            { link: '#', onClick: e => {
                this.sortOrder(e, 'by_referral_count', false)
            }, value: tt('referrers_jsx.by_referral_count') },
            { link: '#', onClick: e => {
                this.sortOrder(e, 'by_referral_vesting', true)
            }, value: tt('referrers_jsx.by_referral_vesting') },
            { link: '#', onClick: e => {
                this.sortOrder(e, 'by_referral_post_count', true)
            }, value: tt('referrers_jsx.by_referral_post_count') },
        ]

        let currentSort = tt('referrers_jsx.by_referral_count')
        if (this.sort === 'by_referral_vesting') {
            currentSort = tt('referrers_jsx.by_referral_vesting')
        } else if (this.sort === 'by_referral_post_count') {
            currentSort = tt('referrers_jsx.by_referral_post_count')
        }

        return <div className='column' style={{marginTop: '3.5rem'}}>
            <div className='row'>
                <div className='Referrers' style={{ paddingBottom: '1rem', width: '100%' }}>
                    <h3 style={{ display: 'inline-block' }}>{tt('referrers_jsx.title')}</h3>
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
                        <th></th>
                        <th>{tt('referrals_jsx.name')}</th>
                        <th>{tt('referrers_jsx.referral_count')}</th>
                        <th>{tt('referrals_jsx.posts')}</th>
                        <th>{tt('referrals_jsx.vs')}</th>
                    </thead>
                    <tbody>
                        {items}
                    </tbody></table> : null}
                    {next_start_name ? <div className='load-more' key='load_more'>
                        <center><button className='button hollow small' onClick={
                            e => this.props.fetchReferrers(next_start_name, this.sort)
                        }>{tt('g.load_more')}</button></center>
                    </div> : null}
                </div>
            </div>
        </div>
    }
}

module.exports = {
    path: '/referrers',
    component: connect(
	    state => {
	        const referrers = state.global.get('referrers')
            const props = state.global.get('props')

	        return {
	            referrers,
                props
	        }
	    },
	    dispatch => ({
            fetchReferrers: (start_name, sort) => {
                dispatch(g.actions.fetchReferrers({ start_name, sort }))
            },
	    })
	)(Referrers)
}
