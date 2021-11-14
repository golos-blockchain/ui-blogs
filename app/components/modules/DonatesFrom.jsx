/* eslint react/prop-types: 0 */
import React from 'react';
import {connect} from 'react-redux'
import TransferHistoryRow from 'app/components/cards/TransferHistoryRow';
import {numberWithCommas, vestsToSp, assetFloat} from 'app/utils/StateFunctions'
import tt from 'counterpart';
import Icon from 'app/components/elements/Icon';
import { LIQUID_TICKER, VEST_TICKER } from 'app/client_config';

class DonatesFrom extends React.Component {
    state = { historyIndex: 0 }

    shouldComponentUpdate(nextProps, nextState) {
        if (!this.props.account.transfer_history) return true;
        if (!nextProps.account.transfer_history) return true;
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

        const transfer_history = account.transfer_history || [];

        let curation_log = transfer_history.map((item, index) => {
            // Filter out rewards
            if (item[1].op[0] === "donate") {
                if (incoming && item[1].op[1].from != account.name) {
                    return null;
                }
                if (!incoming && item[1].op[1].to != account.name) {
                    return null;
                }

                if (incoming)
                    return <TransferHistoryRow key={index} op={item} context="from" acc={account.name} />;
                else
                    return <TransferHistoryRow key={index} op={item} context="to" acc={account.name} />;
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
                    <span style={{float: 'right', fontSize: '85%'}}><a target="_blank" href="https://dpos.space/golos/donates/donators/golos"><Icon name="hf/hf2" size="2x" /> {tt('g.top_donates')}</a></span>
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
)(DonatesFrom)
