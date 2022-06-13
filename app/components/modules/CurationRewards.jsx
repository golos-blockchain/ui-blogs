/* eslint react/prop-types: 0 */
import React from 'react';
import { Link } from 'react-router';
import {connect} from 'react-redux'
import TransferHistoryRow from 'app/components/cards/TransferHistoryRow';
import {numberWithCommas, vestsToSp, assetFloat} from 'app/utils/StateFunctions'
import tt from 'counterpart';
import Callout from 'app/components/elements/Callout';
import Icon from 'app/components/elements/Icon';
import { LIQUID_TICKER, VEST_TICKER } from 'app/client_config';
import { Asset } from 'golos-lib-js/lib/utils';

class CurationRewards extends React.Component {
    state = { historyIndex: 0 }

    shouldComponentUpdate(nextProps, nextState) {
        if (!this.props.account.transfer_history) return true;
        if (!nextProps.account.transfer_history) return true;
        if (!this.props.current_user && nextProps.current_user) return true;
        return (
            nextProps.account.transfer_history.length !== this.props.account.transfer_history.length ||
            nextState.historyIndex !== this.state.historyIndex);
    }

    _setHistoryPage(back) {
        const newIndex = this.state.historyIndex + (back ? 10 : -10);
        this.setState({historyIndex: Math.max(0, newIndex)});
    }

    vestsToSteem(vestingShares, gprops) {
        const { total_vesting_fund_steem, total_vesting_shares } = gprops;
        const totalVestingFundSteem = Asset(total_vesting_fund_steem).amount;
        const totalVestingShares = Asset(total_vesting_shares).amount;
        const vesting_shares = Asset(vestingShares).amount;
        return totalVestingFundSteem * vesting_shares / totalVestingShares;
    }

    effectiveVestingShares(account, gprops) {
        const vesting_steem = this.vestsToSteem(account.vesting_shares, gprops);
        const received_vesting_shares = this.vestsToSteem(account.received_vesting_shares, gprops);
            + this.vestsToSteem(account.emission_received_vesting_shares, gprops)
        const delegated_vesting_shares = this.vestsToSteem(account.delegated_vesting_shares, gprops);
            + this.vestsToSteem(account.emission_delegated_vesting_shares, gprops);
        return Asset(vesting_steem
            + received_vesting_shares
            - delegated_vesting_shares, 3, 'GOLOS');
    }

    render() {
        const VESTING_TOKENS = tt('token_names.VESTING_TOKENS')

        const {state: {historyIndex}} = this
        const { account, current_user, cprops, gprops, } = this.props;

        let gpDeficit = '';
        if (account.vesting_shares && gprops && cprops) {
            let gpExists = this.effectiveVestingShares(account, gprops.toJS());
            let gpMin = cprops.get('min_golos_power_to_curate');
            if (gpMin) {
                gpMin = Asset(gpMin);
                if (gpExists.amount < gpMin.amount) {
                    gpDeficit = gpMin.amount - gpExists.amount;
                    gpDeficit = Asset(gpDeficit, 3, 'GOLOS').toString();
                }
            }
        }

        const transfer_history = account.transfer_history || [];

        /// transfer log
        let rewards24 = 0, rewardsWeek = 0, totalRewards = 0;
        let today = new Date();
        let oneDay = 86400 * 1000;
        let yesterday = new Date(today.getTime() - oneDay ).getTime();
        let lastWeek = new Date(today.getTime() - 7 * oneDay ).getTime();

        let firstDate, finalDate;
        let curation_log = transfer_history.map((item, index) => {
            // Filter out rewards
            if (item[1].op[0] === "curation_reward") {
                if (!finalDate) {
                    finalDate = new Date(item[1].timestamp).getTime();
                }
                firstDate = new Date(item[1].timestamp).getTime();
                const vest = assetFloat(item[1].op[1].reward, VEST_TICKER);
                if (new Date(item[1].timestamp).getTime() > yesterday) {
                    rewards24 += vest;
                    rewardsWeek += vest;
                } else if (new Date(item[1].timestamp).getTime() > lastWeek) {
                    rewardsWeek += vest;
                }
                totalRewards += vest;
                return <TransferHistoryRow key={index} op={item} context={account.name} />
            }
            return null;
        }).filter(el => !!el);
        let currentIndex = -1;
        const curationLength = curation_log.length;
        const daysOfCuration = (firstDate - finalDate) / oneDay || 1;
        const averageCuration = !daysOfCuration ? 0 : totalRewards / daysOfCuration;
        const hasFullWeek = daysOfCuration >= 7;
        const limitedIndex = Math.min(historyIndex, curationLength - 10);
        curation_log = curation_log.reverse().filter(() => {
            currentIndex++;
            return currentIndex >= limitedIndex && currentIndex < limitedIndex + 10;
        });

         const navButtons = (
             <nav>
               <ul className="pager">
                 <li>
                     <div className={"button tiny hollow float-left " + (historyIndex === 0 ? " disabled" : "")} onClick={this._setHistoryPage.bind(this, false)} aria-label="Previous">
                         <span aria-hidden="true">&larr; {tt('g.newer')}</span>
                     </div>
                 </li>
                 <li>
                     <div className={"button tiny hollow float-right " + (historyIndex >= (curationLength - 10) ? " disabled" : "")} onClick={historyIndex >= (curationLength - 10) ? null : this._setHistoryPage.bind(this, true)} aria-label="Next">
                         <span aria-hidden="true">{tt('g.older')} &rarr;</span>
                     </div>
                 </li>
               </ul>
             </nav>
        );

        return (<div className="UserWallet">
            <div className="row">
                <div className="column small-12">
                    <span style={{float: 'right', fontSize: '85%'}}><a href="/allposts"><Icon name="hf/hf18" size="2x" /> {tt('g.posts')}</a> {tt('g.and')} <a href="/allcomments">{tt('g.comments')}</a> {tt('g.sorted_by_payouts')}</span>
                    <h4 className="uppercase">{tt('g.curation_rewards')}</h4>
                </div>
            </div>
            <div className="UserWallet__balance UserReward__row row">
                <div className="column small-12 medium-8">
                    {tt('curationrewards_jsx.estimated_curation_rewards_last_week')}:
                </div>
                <div className="column small-12 medium-4">
                    {numberWithCommas(vestsToSp(this.props.state, rewardsWeek + " " + VEST_TICKER)) + " " + VESTING_TOKENS}
                </div>
            </div>

            {gpDeficit && <Callout>
                <div align="center"><Link to={`/@${account.name}/transfers`}>{tt('curationrewards_jsx.replenish_golos_power')}</Link>
                {tt('curationrewards_jsx.replenish_golos_power_AMOUNT', {AMOUNT: gpDeficit})}
                <br /><Icon name="golos" size="2x" /></div>
            </Callout>}

            {/*  -- These estimates have been causing issus, see #600 --
            <div className="UserWallet__balance UserReward__row row">
                <div className="column small-12 medium-8">
                    {tt('curationrewards_jsx.curation_rewards_last_24_hours')}:
                </div>
                <div className="column small-12 medium-3">
                    {numberWithCommas(vestsToSp(this.props.state, rewards24 + " " + VEST_TICKER)) + " " + VESTING_TOKEN}
                </div>
            </div>
            <div className="UserWallet__balance UserReward__row row">
                <div className="column small-12 medium-8">
                    {tt('curationrewards_jsx.daily_average_curation_rewards')}:
                </div>
                <div className="column small-12 medium-3">
                    {numberWithCommas(vestsToSp(this.props.state, averageCuration + " " + VEST_TICKER)) + " " + VESTING_TOKEN}
                </div>
            </div>
            <div className="UserWallet__balance UserReward__row row">
                <div className="column small-12 medium-8">
                    {tt(!hasFullWeek ? 'estimated_curation_rewards_last_week' : 'curation_rewards_last_week')}:
                </div>
                <div className="column small-12 medium-3">
                    {numberWithCommas(vestsToSp(this.props.state, (hasFullWeek ? rewardsWeek : averageCuration * 7) + " " + VEST_TICKER)) + " " + VESTING_TOKEN}
                </div>
            </div>
            */}
            <div className="row">
                <div className="column small-12">
                    <hr />
                </div>
            </div>

            <div className="row">
                <div className="column small-12">
                    {/** history */}
                    <h4 className="uppercase">{tt('curationrewards_jsx.curation_rewards_history')}</h4>
                    {navButtons}
                    <table>
                        <tbody>
                        {curation_log}
                        </tbody>
                     </table>
                    {navButtons}
                </div>
            </div>
        </div>);
    }
}

export default connect(
    // mapStateToProps
    (state, ownProps) => {
        const gprops = state.global.get('props');
        const cprops = state.global.get('cprops');
        return {
            state,
            ...ownProps,
            gprops,
            cprops,
        }
    }
)(CurationRewards)
