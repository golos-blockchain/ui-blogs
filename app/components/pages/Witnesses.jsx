import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import ByteBuffer from 'bytebuffer';
import { is } from 'immutable';
import tt from 'counterpart';
import { api, } from 'golos-lib-js';
import links from 'app/utils/Links';
import Button from 'app/components/elements/Button';
import Icon from 'app/components/elements/Icon';
import PagedDropdownMenu from 'app/components/elements/PagedDropdownMenu';
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper';
import transaction from 'app/redux/Transaction';
import g from 'app/redux/GlobalReducer';
import { formatAsset } from 'app/utils/ParsersAndFormatters';
import {numberWithCommas, vestsToSteem} from 'app/utils/StateFunctions';

const Long = ByteBuffer.Long;

class Witnesses extends Component {
    static propTypes = {
        accounts: PropTypes.object.isRequired,
        witnesses: PropTypes.object.isRequired,
        accountWitnessVote: PropTypes.func.isRequired,
        username: PropTypes.string,
        witnessVotes: PropTypes.object,
    };

    state = {
        customUsername: '',
        proxy: '',
        proxyFailed: false,
        showAfter50: false
    };

    shouldComponentUpdate(np, ns) {
        return (
            !is(np.witnessVotes, this.props.witnessVotes) ||
            np.accounts !== this.props.accounts ||
            np.witnesses !== this.props.witnesses ||
            np.currentProxy !== this.props.currentProxy ||
            np.username !== this.props.username ||
            ns.customUsername !== this.state.customUsername ||
            ns.proxy !== this.state.proxy ||
            ns.proxyFailed !== this.state.proxyFailed
        );
    }

    loadMore = (e) => {
        e.preventDefault();
        this.setState({showAfter50: true}, () => { this.forceUpdate(); });
    }

    loadMoreVotes = async ({ newPage, items }) => {
        const lastItem = items[items.length - 1];
        let { _witness, } = lastItem;
        const res = await api.getWitnessVotesAsync([_witness], 21, (newPage-1)*20, '1.000 GOLOS');
        const nextItems = res[_witness];
        const oneM = Math.pow(10, 6);
        let voteList = [];
        for (let vote of nextItems) {
            let rshares = vote.rshares;
            rshares = vestsToSteem((rshares / oneM).toString() + '.000000 GESTS', this.props.gprops.toJS());
            rshares = formatAsset(rshares + ' GOLOS', false) + ' ' + tt('g.gp');
            voteList.push({
                _witness,
                key: vote.account,
                value: ' + ' + vote.account,
                link: '/@' + vote.account,
                data: rshares,
            });
        }
        return voteList;
    };

    render() {
        const { witnessVotes, currentProxy, totalVestingShares, witness_vote_size } = this.props;

        const { customUsername, proxy, showAfter50 } = this.state;
        const sorted_witnesses = this.props.witnesses.sort((a, b) =>
            Long.fromString(String(b.get('votes'))).subtract(
                Long.fromString(String(a.get('votes'))).toString()
            )
        );

        const up = <Icon name="chevron-up-circle" />;
        let witness_vote_count = 0;
        let rank = 1;

        const witnesses = sorted_witnesses.map(item => {
            const owner = item.get('owner');
            const thread = item.get('url');
            const votes = item.get('votes');
            const missed = item.get('total_missed');
            const lastBlock = item.get('last_confirmed_block_num');
            const lastUpdateFeed = item.get('last_sbd_exchange_update');
            const priceFeed = item.get('sbd_exchange_rate');
            const version = item.get('running_version');
            const signingKey = item.get('signing_key');
            const props = item.get('props').toJS();

            let api_node = null;
            let seed_node = null;
            const acc = this.props.accounts.get(owner);
            try {
              const metadata = JSON.parse(acc.get('json_metadata'));
              if (metadata.witness) {
                api_node = metadata.witness.api_node;
                seed_node = metadata.witness.seed_node;
              }
            } catch(err) {
            }

            //https://github.com/roadscape/db.steemd.com/blob/acabdcb7c7a9c9c4260a464ca86ae4da347bbd7a/app/views/witnesses/index.html.erb#L116
            const oneM = Math.pow(10, 6);
            const approval = vestsToSteem((votes / oneM).toString() + '.000000 GESTS', this.props.gprops.toJS());
            const percentage =
                100 * (votes / oneM / totalVestingShares.split(' ')[0]);

            const lastFeedDate = new Date(lastUpdateFeed).getTime();
            const isOneWeekAgo =
                lastFeedDate < new Date().setDate(new Date().getDate() - 7);

            const isWitnessesDeactive = /GLS1111111111111111111111111111111114T1Anm/.test(
                signingKey
            );
            const noPriceFeed = /0.000 GOLOS/.test(priceFeed.get('base'));

            let lastUpdateFeedClassName;
            if (isOneWeekAgo) {
                lastUpdateFeedClassName = 'error';
            }

            const myVote = witnessVotes ? witnessVotes.has(owner) : null;
            const classUp =
                'Voting__button Voting__button-up' +
                (myVote === true ? ' Voting__button--upvoted' : '');
            let witness_thread = '';
            if (thread) {
                if (links.local.test(thread)) {
                    witness_thread = (
                        <Link to={thread}>
                            {tt('witnesses_jsx.witness_thread')}
                        </Link>
                    );
                } else {
                    witness_thread = (
                        <a href={thread}>
                            {tt('witnesses_jsx.witness_thread')}
                        </a>
                    );
                }
            }

            let voteList = [];
            let vote_list = item.get('vote_list');
            for (let vote of vote_list ? vote_list.toJS() : []) {
                let rshares = vote.rshares;
                rshares = vestsToSteem((rshares / oneM).toString() + '.000000 GESTS', this.props.gprops.toJS());
                rshares = formatAsset(rshares + ' GOLOS', false) + ' ' + tt('g.gp');
                voteList.push({
                    _witness: item.get('id'),
                    key: vote.account,
                    value: ' + ' + vote.account,
                    link: '/@' + vote.account,
                    data: rshares,
                });
            }
            return (
                <tr
                    key={owner}
                    style={
                        (!showAfter50 && rank > 50) ? { display: 'none' } : (isWitnessesDeactive || noPriceFeed
                            ? { opacity: '0.4' }
                            : null)
                    }
                    title={
                        isWitnessesDeactive
                            ? tt('witnesses_jsx.witness_deactive')
                            : noPriceFeed
                                ? tt('witnesses_jsx.no_price_feed')
                                : null
                    }
                >
                    <td width="75">
                        {rank < 10 && '0'}
                        {rank++}
                        &nbsp;&nbsp;
                        {currentProxy && currentProxy.length ? null : (
                        <span className={classUp}>
                            <a
                                href="#"
                                onClick={e =>
                                    this._accountWitnessVote(owner, !myVote, e)
                                }
                                title={tt('g.vote')}
                            >
                                {up}
                            </a>
                        </span>
                        )}
                    </td>
                    <td style={rank <= 20 ? { fontWeight: 'bold' } : null}>
                        <Link to={'/@' + owner}>{owner}</Link>&nbsp;
                        <Link to={'/nodes'}>{api_node && <img src="images/api.png" width="25" height="17" title={tt('witnesses_jsx.what_is_api')} />}</Link>&nbsp;
                        <Link to={'/nodes'}>{seed_node && <img src="images/seed.png" width="33" height="17" title={tt('witnesses_jsx.what_is_seed')} />}</Link>
                    </td>
                    <td>
                        <PagedDropdownMenu className='Witnesses__vote-list' el='div' items={voteList}
                            renderItem={item => item}
                            perPage={20}
                            onLoadMore={this.loadMoreVotes}>
                            {formatAsset(approval + ' GOLOS', false)}
                            <span style={{ fontSize: '65%', opacity: '.5' }}>
                                {tt('g.gp')}
                            </span>
                            <Icon name="dropdown-arrow" />
                        </PagedDropdownMenu>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                        {percentage.toFixed(2)}%
                    </td>
                    <td>{witness_thread}</td>
                    <td style={{ textAlign: 'center' }}>{missed}</td>
                    <td>{lastBlock}</td>
                    <td>
                        <div style={{ fontSize: '.9rem' }}>
                            {priceFeed.get('quote')}
                        </div>
                        <div style={{ fontSize: '.9rem' }}>
                            {priceFeed.get('base')}
                        </div>
                        <div style={{ fontSize: '.9rem' }}>
                            <TimeAgoWrapper
                                date={lastUpdateFeed}
                                className={lastUpdateFeedClassName}
                            />
                        </div>
                    </td>
                    <td>
                        <div
                            style={{ fontSize: '.9rem' }}
                            title={tt('witnesses_jsx.reg_fee')}
                        >
                            {props.account_creation_fee}
                        </div>
                        <div
                            style={{ fontSize: '.9rem' }}
                            title={tt('witnesses_jsx.apr')}
                        >
                            {props.sbd_interest_rate / 100}%
                        </div>
                        <div
                            style={{ fontSize: '.9rem' }}
                        >
                            <span title={tt('witnesses_jsx.block_size')}>
                                {props.maximum_block_size}
                            </span>
                            &nbsp;
                            <Link to={'/@' + owner + '/witness'}>
                                <Icon name="new/setting" />
                            </Link>
                        </div>
                    </td>
                    <td>{version}</td>
                </tr>
            );
        });

        let addlWitnesses = false;

        if (witnessVotes) {
            witness_vote_count = witnessVotes.size;
            addlWitnesses = witnessVotes
                .filter(item => {
                    return !sorted_witnesses.has(item);
                })
                .map(item => {
                    return (
                        <div className="row" key={item}>
                            <div className="column small-12">
                                <span>
                                    <span className="Voting__button Voting__button-up space-right Voting__button--upvoted">
                                        <a
                                            href="#"
                                            onClick={this._accountWitnessVote.bind(
                                                this,
                                                item,
                                                false
                                            )}
                                            title={tt('g.vote')}
                                        >
                                            {up}
                                        </a>
                                        &nbsp;
                                    </span>
                                </span>
                                <Link to={'/@' + item}>{item}</Link>
                            </div>
                        </div>
                    );
                })
                .toArray();
        }

        return (
            <div>
                <div className="row">
                    <div className="column">
                        <a target="_blank" href="https://t.me/golos_delegates" className="golos-btn btn-secondary btn-round" style={{ float: 'right', marginTop: '0.75rem' }}><Icon name="new/telegram" /> {tt('witnesses_jsx.chat_delegates')}</a>
                        <a target="_blank" href="https://props.golos.today/chainprops" className="golos-btn btn-secondary btn-round" style={{ float: 'right', marginTop: '0.75rem' }}><Icon name="extlink" /> {tt('witnesses_jsx.chain_properties')}</a>
                        <h2>{tt('witnesses_jsx.top_witnesses')}</h2>
                        <div className="column secondary">
                            {tt('witnesses_jsx.witness_info')} <a target="_blank" href="https://wiki.golos.id/witnesses/basics">{tt('g.more_hint')}</a> <Icon name="extlink" size="1_5x" />
                        <hr />
                        </div>
                        {currentProxy && currentProxy.length ? (
                            <p>{tt('witnesses_jsx.witness_set')} <a href="#bottom">Отмена прокси.</a></p>
                            ) : (
                            <p>
                                {witness_vote_count == 0 && <strong>
                                    {tt('witnesses_jsx.witness_0')}.
                                </strong>}
                                {witness_vote_count == 1 && <strong>
                                    {tt('witnesses_jsx.witness_supported')} {witness_vote_count} {tt('witnesses_jsx.witness_1')} {formatAsset(witness_vote_size + ' GOLOS', false)} СГ.
                                </strong>}
                                {witness_vote_count > 1 && <strong>
                                    {tt('witnesses_jsx.witness_supported')} {witness_vote_count} {tt('witnesses_jsx.witness_2')} {formatAsset(witness_vote_size + ' GOLOS', false)} СГ {tt('witnesses_jsx.witness_addon')}.
                                </strong>}
                            </p>
                        )}
                    </div>
                </div>

                    <div className="row small-collapse">
                        <div className="column">
                            <table>
                                <thead>
                                    <tr>
                                        <th />
                                        <th>{tt('witnesses_jsx.witness')}</th>
                                        <th>{tt('witnesses_jsx.approval')}</th>
                                        <th style={{ textAlign: 'center' }}>
                                            %
                                        </th>
                                        <th>
                                            {tt('witnesses_jsx.information')}
                                        </th>
                                        <th style={{ textAlign: 'center' }}>
                                            <div>
                                                {tt('witnesses_jsx.missed_1')}
                                            </div>
                                            <div>
                                                {tt('witnesses_jsx.missed_2')}
                                            </div>
                                        </th>
                                        <th style={{ textAlign: 'center' }}>
                                            {tt('witnesses_jsx.last_block')}
                                        </th>
                                        <th>
                                            {tt('witnesses_jsx.price_feed')}
                                        </th>
                                        <th>{tt('witnesses_jsx.props')}</th>
                                        <th>{tt('witnesses_jsx.version')}</th>
                                    </tr>
                                </thead>
                                <tbody>{witnesses.toArray()}</tbody>
                            </table>
                        </div>
                    </div>

                {!showAfter50 &&
                    <div className="row">
                    <div className="App-center" style={{width: '100%', marginBottom: '0.5rem'}}>
                        <Button onClick={this.loadMore} round="true" type="secondary">{tt('witnesses_jsx.load_more')}</Button>
                    </div>
                    </div>
                }

                {currentProxy && currentProxy.length ? null : (
                    <div className="row">
                        <div className="column">
                            <p>
                                {tt(
                                    'witnesses_jsx.if_you_want_to_vote_outside_of_top_enter_account_name'
                                )}.
                            </p>
                            <form>
                                <div className="input-group">
                                    <input
                                        className="input-group-field"
                                        type="text"
                                        style={{
                                            float: 'left',
                                            width: '75%',
                                            maxWidth: '20rem',
                                        }}
                                        value={customUsername}
                                        onChange={this._onWitnessChange}
                                    />
                                    <div className="input-group-button">
                                        <button
                                            className="button"
                                            onClick={e =>
                                                this._accountWitnessVote(
                                                    customUsername,
                                                    witnessVotes
                                                        ? !witnessVotes.has(
                                                              customUsername
                                                          )
                                                        : true,
                                                    e
                                                )
                                            }
                                        >
                                            {tt('g.vote')}
                                        </button>
                                    </div>
                                </div>
                            </form>
                            {addlWitnesses}
                        </div>
                    </div>
                )}
                {
                <div className="row">
                    <div className="column">
                        <p>{tt(currentProxy && currentProxy.length ? 'witnesses_jsx.witness_set' : 'witnesses_jsx.set_witness_proxy', {proxy: currentProxy})}</p>
                        {currentProxy && currentProxy.length ?
                        <div>
                            <div style={{paddingBottom: 10}}>{tt('witnesses_jsx.witness_proxy_current')}: <strong>{}</strong></div>

                            <form>
                                <div className="input-group">
                                    <input className="input-group-field bold" disabled type="text" style={{float: "left", width: "75%", maxWidth: "20rem"}} value={currentProxy} />
                                    <div className="input-group-button">
                                        <button style={{marginBottom: 0}} className="button" onClick={this._accountWitnessProxy}>{tt('witnesses_jsx.witness_proxy_clear')}</button><a name="bottom"></a>
                                    </div>
                                </div>
                            </form>
                        </div> :
                        <form>
                            <div className="input-group">
                                <input className="input-group-field bold" type="text" style={{float: "left", width: "75%", maxWidth: "20rem"}} value={proxy} onChange={(e) => {this.setState({proxy: e.target.value});}} />
                                <div className="input-group-button">
                                    <button style={{marginBottom: 0}} className="button" onClick={this._accountWitnessProxy}>{tt('witnesses_jsx.witness_proxy_set')}</button>
                                </div>
                            </div>
                        </form>}
                        {this.state.proxyFailed && <p className="error">{tt('witnesses_jsx.proxy_update_error')}.</p>}
                        <br />
                     </div>
                </div>}
            </div>
        );
    }

    _accountWitnessVote = (accountName, approve, e) => {
        e.preventDefault();

        const { username, accountWitnessVote } = this.props;
        this.setState({ customUsername: '' });
        accountWitnessVote(username, accountName, approve);
    };

    _onWitnessChange = e => {
        const customUsername = e.target.value;
        this.setState({ customUsername });
    };

    _accountWitnessProxy = e => {
        e.preventDefault();
    
        const { username, accountWitnessProxy } = this.props;
    
        accountWitnessProxy(username, this.state.proxy, state => {
            this.setState(state);
        });
    };
}

export default connect(
    state => {
        const gprops = state.global.get('props');
        const currentUser = state.user.get('current');
        const username = currentUser && currentUser.get('username');
        const currentAccount =
            currentUser && state.global.getIn(['accounts', username]);
        const witnessVotes =
            currentAccount && currentAccount.get('witness_votes').toSet();
        const currentProxy = currentAccount && currentAccount.get('proxy');
        let witness_vote_size = currentAccount && vestsToSteem(currentAccount.get('vesting_shares'), gprops.toJS());
        if (currentAccount) {
            if (witnessVotes.size > 0) {
                witness_vote_size /= witnessVotes.size;
            }
        }

        return {
            gprops,
            accounts: state.global.get('accounts'),
            witnesses: state.global.get('witnesses'),
            username,
            witnessVotes,
            currentProxy,
            totalVestingShares: state.global.getIn([
                'props',
                'total_vesting_shares',
            ]),
            witness_vote_size
        };
    },
    dispatch => {
        return {
            accountWitnessVote: (username, witness, approve) => {
                dispatch(
                    transaction.actions.broadcastOperation({
                        type: 'account_witness_vote',
                        operation: { account: username, witness, approve },
                    })
                );
            },

            accountWitnessProxy: (account, proxy, stateCallback) => {
                dispatch(
                    transaction.actions.broadcastOperation({
                        type: 'account_witness_proxy',
                        operation: { account, proxy },
                        successCallback: () => {
                            dispatch(
                                g.actions.updateAccountWitnessProxy({
                                    account,
                                    proxy,
                                })
                            );
                            stateCallback({ proxyFailed: false, proxy: '' });
                        },
                        errorCallback: e => {
                            console.log('error:', e);
                            stateCallback({ proxyFailed: true });
                        },
                    })
                );
            },
        };
    }
)(Witnesses);
