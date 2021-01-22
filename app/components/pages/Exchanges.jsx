import React from 'react';
import tt from 'counterpart';
import Icon from 'app/components/elements/Icon'

class Exchanges extends React.Component {
    render() {
        return (
            <div className='landing-exchanges'>
                <div className='landing-exchanges-block'>
                    <div className='column large-12 medium-12 small-12'>
                        <h2>{tt('exchanges_jsx.title')}</h2>
                        <h3><Icon name="golos" size="2x" /> Golos Blockchain (GLS)</h3>
                    </div>
                    <br />
                    <div className='row'>                            
                            <a target="_blank" href="https://explorer.golos.id/" className="golos-btn btn-secondary btn-round"><Icon name="new/search" /> Block Explorer</a>&nbsp;<a target="_blank" href="https://github.com/golos-blockchain" className="golos-btn btn-secondary btn-round"><Icon name="github" /> Source Code</a>&nbsp;<a target="_blank" href="https://coinmarketcap.com/currencies/golos-blockchain/" className="golos-btn btn-secondary btn-round"><Icon name="extlink" /> CoinMarketCap</a>&nbsp;<a href="mailto:info@golos.id" className="golos-btn btn-secondary btn-round"><Icon name="new/envelope" /> Contact Us</a>&nbsp;<a target="_blank" href="https://t.me/golos_delegates" className="golos-btn btn-secondary btn-round"><Icon name="new/telegram" /> Delegates Chat</a>
                    </div>
                </div>
                <div className='landing-exchanges-block'>
                    <div className='column large-12 medium-12 small-12'>
                        <div className='column large-12 medium-12 small-12'>
                            <hr/>
                        </div>
                        <div className='column large-12 medium-12 small-12'>
                            <div className='row'>
                                <div className='column large-12 medium-12 small-12' align='center'>
                                <a target="_blank" href="https://coins.black/"><img src='https://i.imgur.com/1FvfDHw.png' width='275' height='67' /></a>
                                </div>
                                <div className='landing-exchanges-block-center column large-12 medium-12 small-12'>
                                    <a target="_blank" href="https://coins.black/xchange_SBERRUB_to_GLS/?summ=1000&schet2=&lock2=true" className="button">{tt('g.buy')} GOLOS</a>
                                    <br />{tt('exchanges_jsx.other_options')}<br />
                                    <a target="_blank" href="/@on0tole/pryamaya-pokupka-tokenov-golos-za-rubli-i-ne-tolko">{tt('g.more_hint')}</a> <Icon name="extlink" />
                                </div>
                            </div>
                        </div>
                        <div className='column large-12 medium-12 small-12'>
                            <hr/>
                        </div>
                    </div>
                </div>
                <div className='landing-exchanges-block'>
                    <div className='column large-12 medium-12 small-12'>
                        <div className='column large-12 medium-12 small-12'>
                            <hr/>
                        </div>
                        <div className='column large-12 medium-12 small-12'>
                            <div className='row'>
                                <div className='column large-12 medium-12 small-12' align='center'>
                                <a target="_blank" href="https://rudex.org/"><img src='https://i.imgur.com/RyCrpvb.png' width='275' height='77' /></a>
                                </div>
                                <div className='landing-exchanges-block-center column large-12 medium-12 small-12'>
                                    <a target="_blank" href="/@allforyou/golos-delistyat-s-kuny-perekhodim-na-rudex">{tt('exchanges_jsx.guide_user')} @allforyou</a>
                                    <br /><br />
                                    <a target="_blank" href="https://market.rudex.org/#/market/RUDEX.GOLOS_RUDEX.BTC" className="button">GOLOS-BTC</a>&nbsp;&nbsp;<a target="_blank" href="https://market.rudex.org/#/market/RUDEX.GOLOS_RUDEX.USDT" className="button">GOLOS-USDT</a>&nbsp;&nbsp;<a target="_blank" href="https://market.rudex.org/#/market/RUDEX.GOLOS_BTS" className="button">GOLOS-BTS</a>&nbsp;&nbsp;<a target="_blank" href="https://market.rudex.org/#/market/RUDEX.GOLOS_RUBLE" className="button">GOLOS-RUBLE</a>
                                </div>
                            </div>
                        </div>
                        <div className='column large-12 medium-12 small-12'>
                            <hr/>
                        </div>
                    </div>
                </div>
                <div className='landing-exchanges-block'>
                    <div className='column large-12 medium-12 small-12'>
                        <div className='column large-12 medium-12 small-12'>
                            <hr/>
                        </div>
                        <div className='column large-12 medium-12 small-12'>
                            <div className='row'>
                                <div className='column large-12 medium-12 small-12' align='center'>
                                <a target="_blank" href="https://steem-engine.net/"><img src='https://i.imgur.com/KpqwZy6.png' width='182' height='125' /></a>
                                </div>
                                <div className='landing-exchanges-block-center column large-12 medium-12 small-12'>
                                    <a target="_blank" href="/@allforyou/zavodim-i-vyvodim-golosa-s-birzhi-steem-engine">{tt('exchanges_jsx.guide_user')} @allforyou</a>
                                    <br /><br />
                                    <a target="_blank" href="https://steem-engine.net/?p=market&t=GOLOSP" className="button">GOLOS-STEEM</a>
                                </div>
                            </div>
                        </div>
                        <div className='column large-12 medium-12 small-12'>
                            <hr/>
                        </div>
                    </div>
                </div> 
                <div className='landing-exchanges-block'>
                    <div className='column large-12 medium-12 small-12'>
                        <div className='column large-12 medium-12 small-12'>
                            <hr/>
                        </div>
                        <div className='column large-12 medium-12 small-12'>
                            <div className='row'>
                                <div className='column large-12 medium-12 small-12' align='center'>
                                <p className='landing-exchanges-block-text reg landing-exchanges-block-center'>Кроме того, возможна покупка/продажа токенов:</p>
                                <p>- через <a target="_blank" href="/@ecurrex-ru">@ecurrex-ru</a> (напр. с <a target="_blank" href="/@ecurrex-ru/ymrub-umer-da-zdravstvuet-ymrub">ADVcash и PAYEER</a>), обсуждение сервиса <a target="_blank" href="https://golostalk.com/services/@ecurrex-ru/ecurrex-tokeny-ymxxx">на форуме <Icon name="extlink" /></a></p>
                                <p>- через P2P-сделки в телеграм-ботах <a target="_blank" href="https://t.me/TellerBot"><Icon name="new/telegram" /> TellerBot</a> или <a target="_blank" href="https://t.me/P2PDEXBitshares_bot"><Icon name="new/telegram" /> DexGarant</a></p>
                                </div>
                            </div>
                        </div>
                        <div className='column large-12 medium-12 small-12'>
                            <hr/>
                        </div>
                    </div>
                </div>
                <div className='landing-exchanges-block'>
                    <div className='column large-12 medium-12 small-12'>
                        <h2>{tt('exchanges_jsx.questions')}?</h2>
                        <div className='column large-12 medium-12 small-12'>
                            <hr/>
                        </div>
                        <div className='row'>
                            <div className='column large-12 medium-12 small-12'>
                                <p className='landing-exchanges-block-text landing-exchanges-block-center'>
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