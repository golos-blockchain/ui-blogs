/* eslint react/prop-types: 0 */
import React from 'react';
import {connect} from 'react-redux'
import TransferHistoryRow from 'app/components/cards/TransferHistoryRow';
import {numberWithCommas, vestsToSp, assetFloat} from 'app/utils/StateFunctions'
import tt from 'counterpart';
import { LIQUID_TICKER, VEST_TICKER } from 'app/client_config';
import { Link } from 'react-router';
import Icon from 'app/components/elements/Icon';

class DonatesTo extends React.Component {
    state = { historyIndex: 0 }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            nextProps.account.transfer_history.length !== this.props.account.transfer_history.length ||
            nextState.historyIndex !== this.state.historyIndex);
    }

    _setHistoryPage(back) {
        const newIndex = this.state.historyIndex + (back ? 10 : -10);
        this.setState({historyIndex: Math.max(0, newIndex)});
    }

    render() {
        const VESTING_TOKENS = tt('token_names.VESTING_TOKENS')

        const {state: {historyIndex}} = this
        const {account, incoming} = this.props;

        // FIX bug, golos doesn't return transfer_history sometimes
        if (!account.transfer_history) account.transfer_history = [];

        /// transfer log
        let rewards24 = 0, rewardsWeek = 0, totalRewards = 0;
        let today = new Date();
        let oneDay = 86400 * 1000;
        let yesterday = new Date(today.getTime() - oneDay ).getTime();
        let lastWeek = new Date(today.getTime() - 7 * oneDay ).getTime();

        let firstDate, finalDate;
        let curation_log = account.transfer_history.map((item, index) => {
            // Filter out rewards
            if (item[1].op[0] === "donate") {
                if (incoming && item[1].op[1].from != account.name) {
                    return null;
                }
                if (!incoming && item[1].op[1].to != account.name) {
                    return null;
                }
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

                if (incoming)
                    return <TransferHistoryRow key={index} op={item} context="from"/>;
                else
                    return <TransferHistoryRow key={index} op={item} context="to"/>;
            }
            return null;
        }).filter(el => !!el);
        let currentIndex = -1;
        const curationLength = curation_log.length;
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
                    {/** history */}
                    <span style={{ float: 'right' }} title={tt('g.referral_link_title')}><Icon name="hf/hf5" size="2x" /> {tt('g.referral_link')} - <Link target="_blank" to={"/welcome?invite=" + account.name}>{location.origin + "/welcome?invite=" + account.name}</Link></span>
                    <h4 className="uppercase">{incoming ? tt('g.donates_from') : tt('g.donates_to')}</h4>
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
        return {
            state,
            ...ownProps
        }
    }
)(DonatesTo)
