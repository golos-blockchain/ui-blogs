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
                            <a target="_blank" href="https://dex.golos.app" className="golos-btn btn-secondary btn-round"><Icon name="trade" /> Golos Market</a>&nbsp;<a target="_blank" href="/convert" className="golos-btn btn-secondary btn-round"><Icon name="sorting" /> Golos Convert</a>&nbsp;<a target="_blank" href="https://coinmarketcap.com/currencies/golos-blockchain/" className="golos-btn btn-secondary btn-round"><Icon name="extlink" /> CoinMarketCap</a>&nbsp;<a target="_blank" href="https://explorer.golos.id/" className="golos-btn btn-secondary btn-round"><Icon name="cog" /> Block Explorer</a>&nbsp;<a href="mailto:info@golos.id" className="golos-btn btn-secondary btn-round"><Icon name="new/envelope" /> Contact Us</a>
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
                                <a target="_blank" href="https://rudex.org/"><img src={require("app/assets/images/exchanges/rudex.png")} width="275" /></a>
                                </div>
                                <div className='landing-exchanges-block-center column large-12 medium-12 small-12'>
                                    <a target="_blank" href="/@allforyou/golos-delistyat-s-kuny-perekhodim-na-rudex">{tt('exchanges_jsx.guide_user')}</a> <Icon name="extlink" />
                                    <br /><br />
                                    <a target="_blank" href="https://market.rudex.org/#/market/RUDEX.GOLOS_RUDEX.USDT" className="button">GOLOS-USDT</a>&nbsp;&nbsp;<a target="_blank" href="https://market.rudex.org/#/market/RUDEX.GOLOS_RUDEX.BTC" className="button">GOLOS-BTC</a>&nbsp;&nbsp;<a target="_blank" href="https://market.rudex.org/#/market/RUDEX.GOLOS_RUDEX.BTS" className="button">GOLOS-BTS</a>
                                    <br />
                                    <a target="_blank" href="/@alex-pu/dexbot-na-vps-v-dokere-dlya-babushek">Настройка</a> и <a target="_blank" href="/@alex-pu/dexbot-best-long-term-strategy">стратегии</a> по торговому боту DEXbot, <a target="_blank" href="https://github.com/golos-blockchain/libs/wiki">примеры</a> биржевых операций.
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
                                <a target="_blank" href="https://coins.black/"><img src={require("app/assets/images/exchanges/coinsblack.png")} width="275" /></a>
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
                                <a target="_blank" href="https://dex.golos.app"><img src={require("app/assets/images/exchanges/golosdex.png")} width="285" /></a>
                                </div>
                                <div className='landing-exchanges-block-center column large-12 medium-12 small-12'>
                                    <p><a target="_blank" href="/@allforyou/torguem-na-vnutrennei-birzhe-golosa">Внутренняя биржа</a> и <a target="_blank" href="/convert">обменник</a>, на которых возможно покупать/продавать токены GOLOS через<br/> альтернативные шлюзы, напр. к <small>USDT, LTC, DASH, TRON, DOGE</small> и другим активам...</p>
                                    <p><Icon name="line" /> <a target="_blank" href="/@ecurrex-ru/ymrub-umer-da-zdravstvuet-ymrub"><small>YM</small>RUB</a> <small>(эквивалент рубля, ADVcash / PAYEER / Qiwi)</small>, обсуждение шлюза <a target="_blank" href="https://golostalk.com/services/@ecurrex-ru/ecurrex-tokeny-ymxxx">на форуме</a></p>                                    
                                    <p><Icon name="line" /> <a target="_blank" href="/@ecurrex-ru/novyi-shlyuz-litecoin-ymltc"><small>YM</small>LTC</a>, <a target="_blank" href="/@ecurrex-ru/anons-shlyuza-dash"><small>YM</small>DASH</a>, <a target="_blank" href="/@ecurrex-ru/anons-shlyuzov-dlya-hive-i-steem"><small>YM</small>HIVE и <small>YM</small>STEEM</a>, <a target="_blank" href="/@ecurrex-ru/prizm-na-golose"><small>YM</small>PZM</a> от эмитента <a href="/@ecurrex-ru">@ecurrex-ru</a></p>                                    
                                    <p><Icon name="line" /> <a target="_blank" href="/@ecurrex-ru/anons-novye-shlyuzy-tron-trx-i-usdt-trc-20"><small>YM</small>USDT</a> <small> TRC-20 (позволяющий вести обмен через популярные биржи)</small></p>
                                    <p><b>Новый интерфейс</b> на <a target="_blank" href="https://dex.golos.app">dex.golos.app</a> или <a target="_blank" href="https://gls.exchange">gls.exchange</a>, прежний доступен <a href="/market">здесь</a>.</p>
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
                                <a target="_blank" href="https://www.minter.network/"><img src={require("app/assets/images/exchanges/minter.png")} width="210" /></a>
                                </div>
                                <div className='landing-exchanges-block-center column large-12 medium-12 small-12'>
                                    <a target="_blank" href="/@denis-skripnik/glsmp">{tt('g.more_hint')}</a> <Icon name="extlink" />
                                    <br /><br />
                                    <a target="_blank" href="https://chainik.io/pool/GOLOSCHAIN/BIP" className="button">GOLOS-BIP</a>&nbsp;&nbsp;<a target="_blank" href="https://chainik.io/pool/GOLOSCHAIN/USDTE" className="button">GOLOS-USDT</a>&nbsp;&nbsp;<a target="_blank" href="https://chainik.io/pool/GOLOSCHAIN/BNB" className="button">GOLOS-BNB</a>
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
                                <a target="_blank" href="https://steem-engine.net/"><img src={require("app/assets/images/exchanges/steemengine.png")} width="182" /></a>
                                </div>
                                <div className='landing-exchanges-block-center column large-12 medium-12 small-12'>
                                    <a target="_blank" href="/@allforyou/zavodim-i-vyvodim-golosa-s-birzhi-steem-engine">{tt('exchanges_jsx.guide_user')}</a> <Icon name="extlink" />
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