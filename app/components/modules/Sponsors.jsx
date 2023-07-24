import React from 'react'
import { connect } from 'react-redux'
import tt from 'counterpart'

import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import SponsorList from 'app/components/modules/SponsorList'
import SponsorSubscription from 'app/components/modules/SponsorSubscription'

class Sponsors extends React.Component {
    constructor(props) {
        super(props)
    }

    state = {
    }

    render() {
        const { pso, } = this.props

        if (!pso) {
            return <div style={{ paddingBottom: '1rem' }}>
                <LoadingIndicator type='circle' />
            </div>
        }

        let { sponsors, sponsoreds, account, current_user } = this.props

        sponsors = sponsors.toJS()
        sponsoreds = sponsoreds.toJS()

        const username = current_user && current_user.get('username')

        const isMyAccount = account && account.name == username

        return <div style={{ paddingBottom: '1rem' }}>
            <SponsorSubscription account={account} username={username} />
            <div>
                <h3>{tt('sponsors_jsx.your_sponsors')}</h3>
                <SponsorList items={sponsors} type='sponsors'
                    account={account} username={username} />
            </div>
            <div>
                <h3>{tt('sponsors_jsx.sponsored_authors')}</h3>
                <SponsorList items={sponsoreds} type='sponsoreds'
                    account={account} username={username} />
            </div>
        </div>
    }
}


export default connect(
    state => {
        const pso = state.global.get('pso')
        const sponsors = state.global.get('sponsors')
        const sponsoreds = state.global.get('sponsoreds')

        return {
            pso,
            sponsors,
            sponsoreds,
        };
    },
    dispatch => ({
    })
)(Sponsors)
