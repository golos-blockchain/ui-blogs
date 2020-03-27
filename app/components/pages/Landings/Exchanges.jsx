import React from 'react';
import tt from 'counterpart';
import Icon from '../../elements/Icon'

class Exchanges extends React.Component {
    render() {
        return (
            <div className='landing-start'>
                <div className='landing-start-block'>
                    <div className='column large-12 medium-12 small-12'>
                        <h2>{tt('exchanges_jsx.title')}</h2>
                        <h3><Icon name="golos" size="2x" /> Golos Blockchain (GLS)</h3>
                    </div>
                    <br />
                    <div className='row'>                            
                            <a target="_blank" href="https://explorer.golos.id/" class="golos-btn btn-secondary btn-round"><Icon name="new/search" /> Block Explorer</a>&nbsp;<a target="_blank" href="https://github.com/golos-blockchain" class="golos-btn btn-secondary btn-round"><Icon name="github" /> Source Code</a>&nbsp;<a target="_blank" href="https://coinmarketcap.com/currencies/golos-blockchain/" class="golos-btn btn-secondary btn-round"><Icon name="extlink" /> CoinMarketCap</a>&nbsp;<a target="_blank" href="mailto:info@golos.id" class="golos-btn btn-secondary btn-round"><Icon name="new/envelope" /> Contact Us</a>&nbsp;<a target="_blank" href="https://t.me/golos_delegates" class="golos-btn btn-secondary btn-round"><Icon name="new/telegram" /> Delegates Chat</a>
                    </div>
                </div>
                <div className='landing-start-block'>
                    <div className='column large-12 medium-12 small-12'>
                        <div className='column large-12 medium-12 small-12'>
                            <hr/>
                        </div>
                        <div className='column large-12 medium-12 small-12'>
                            <div className='row'>
                                <div className='column large-12 medium-12 small-12' align='center'>
                                <a target="_blank" href="https://kuna.io/"><img src='https://i.imgur.com/saLaUIC.png' width='236' height='75' /></a>
                                </div>
                                <div className='landing-start-block-center column large-12 medium-12 small-12'>
                                    <a target="_blank" href="https://kuna.io/markets/golbtc" className="button">GOLOS-BTC</a>
                                </div>
                            </div>
                        </div>
                        <div className='column large-12 medium-12 small-12'>
                            <hr/>
                        </div>
                    </div>
                </div>
                <div className='landing-start-block'>
                    <div className='column large-12 medium-12 small-12'>
                        <div className='column large-12 medium-12 small-12'>
                            <hr/>
                        </div>
                        <div className='column large-12 medium-12 small-12'>
                            <div className='row'>
                                <div className='column large-12 medium-12 small-12' align='center'>
                                <a target="_blank" href="https://rudex.org/"><img src='https://i.imgur.com/RyCrpvb.png' width='266' height='75' /></a>
                                </div>
                                <div className='landing-start-block-center column large-12 medium-12 small-12'>
                                    <a target="_blank" href="https://ticker.rudex.org/market/GLS_BTC" className="button">GOLOS-BTC</a>&nbsp;&nbsp;<a target="_blank" href="https://ticker.rudex.org/market/GLS_BTS" className="button">GOLOS-BTS</a>&nbsp;&nbsp;<a target="_blank" href="https://ticker.rudex.org/market/GLS_USDT" className="button">GOLOS-USDT</a>&nbsp;&nbsp;<a target="_blank" href="https://market.rudex.org/#/market/RUDEX.GOLOS_RUBLE" className="button">GOLOS-RUBLE</a>
                                </div>
                            </div>
                        </div>
                        <div className='column large-12 medium-12 small-12'>
                            <hr/>
                        </div>
                    </div>
                </div>
                <div className='landing-start-block'>
                    <div className='column large-12 medium-12 small-12'>
                        <div className='column large-12 medium-12 small-12'>
                            <hr/>
                        </div>
                        <div className='column large-12 medium-12 small-12'>
                            <div className='row'>
                                <div className='column large-12 medium-12 small-12' align='center'>
                                <a target="_blank" href="https://steem-engine.com/"><img src='https://i.imgur.com/KpqwZy6.png' width='182' height='125' /></a>
                                </div>
                                <div className='landing-start-block-center column large-12 medium-12 small-12'>
                                    <a target="_blank" href="https://steem-engine.com/?p=market&t=GOLOSP" className="button">GOLOS-STEEM</a>
                                </div>
                            </div>
                        </div>
                        <div className='column large-12 medium-12 small-12'>
                            <hr/>
                        </div>
                    </div>
                </div>
                <div className='landing-start-block'>
                    <div className='column large-12 medium-12 small-12'>
                        <div className='column large-12 medium-12 small-12'>
                            <hr/>
                        </div>
                        <div className='column large-12 medium-12 small-12'>
                            <div className='row'>
                                <div className='column large-12 medium-12 small-12' align='center'>
                                <a target="_blank" href="https://livecoin.net/"><img src='https://i.imgur.com/7RrhYFw.png' width='308' height='75' /></a>
                                </div>
                                <div className='landing-start-block-center column large-12 medium-12 small-12'>
                                    {tt('exchanges_jsx.temporarily_disabled')}...
                                </div>
                            </div>
                        </div>
                        <div className='column large-12 medium-12 small-12'>
                            <hr/>
                        </div>
                    </div>
                </div>
                <div className='landing-start-block'>
                    <div className='column large-12 medium-12 small-12'>
                        <div className='row'>
                            <div className='column large-12 medium-12 small-12'>
                                <p className='landing-start-block-text reg landing-start-block-center'>{tt('exchanges_jsx.total_supply')}:</p>
                            </div>
                        </div>
                    </div>
                    <div className='landing-start-block-center column large-12 medium-12 small-12'>
                        <a target="_blank" href="/api/v1/gls-supply" class="golos-btn btn-secondary btn-round">Supply GOLOS</a>&nbsp;&nbsp;<a target="_blank" href="/api/v1/gbg-supply" class="golos-btn btn-secondary btn-round">Supply GBG</a>
                    </div>
                </div>
                <div className='landing-start-block'>
                    <div className='column large-12 medium-12 small-12'>
                        <h2>{tt('exchanges_jsx.questions')}?</h2>
                        <div className='column large-12 medium-12 small-12'>
                            <hr/>
                        </div>
                        <div className='row'>
                            <div className='column large-12 medium-12 small-12'>
                                <p className='landing-start-block-text landing-start-block-center'>
                                    {tt('exchanges_jsx.community_chat')} <a target="_blank" href='https://t.me/golos_id'>t.me/golos_id</a>, {tt('exchanges_jsx.delegate_chat')} <a target="_blank" href='https://t.me/golos_delegates'>t.me/golos_delegates</a></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

module.exports = {
    path: 'exchanges',
    component: Exchanges,
};