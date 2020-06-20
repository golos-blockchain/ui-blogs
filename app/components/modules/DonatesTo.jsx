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
        const {state: {historyIndex}} = this
        const {account, incoming} = this.props;

        // FIX bug, golos doesn't return transfer_history sometimes
        if (!account.transfer_history) account.transfer_history = [];

        /// transfer log
        let curation_log = account.transfer_history.map((item, index) => {
            // Filter out rewards
            if (item[1].op[0] === "donate") {
                let context = "";
                if (item[1].op[1].to == account.name) {
                    context = "to";
                } else if (item[1].op[1].from != account.name) { // For referrals
                    context = "ref";
                    const donate_meta = JSON.parse(item[1].json_metadata);
                    if (donate_meta.referrer_interest == "0.000 GOLOS") {
                        return null;
                    }
                } else {
                    return null;
                }
                return <TransferHistoryRow key={index} op={item} context={context}/>;
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
                    <h4 className="uppercase">{incoming ? tt('g.donates_from') : tt('g.donates_to')}</h4>
                    {process.env.BROWSER && (<span>{tt('g.referral_link')} <span title={tt('g.referral_link_title')}><Icon name="info_o" /></span> -&nbsp;<Link to={"/welcome?invite=" + account.name}>{window.location.origin + "/welcome?invite=" + account.name}</Link></span>)}
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
