import React from 'react';
import tt from 'counterpart';
import Icon from 'app/components/elements/Icon'

class Services extends React.Component {
    render() {
        return (
            <div className='landing-services'>
                <div className='landing-services-block'>                    
                    <img className="float-center" style={{marginTop: "60px"}} src={require("app/assets/images/services.png")} width="500" />
                    <div className='row landing-services-block-center float-center'>
                        {tt('services.title_1')},<br />{tt('services.title_2')}.
                    </div>
                </div>
                <div className='landing-services-block'>
                    <div className='column large-12 medium-12 small-12'>
                        <div className='row'>
                            <div className='column large-3 medium-3 small-6'>
                                <a target="_blank" href="https://wiki.golos.id"><Icon name='blockchain' size='10x'/>
                                <h5>Golos Blogs</h5></a>
                                <p className='landing-services-block-icon-text'>Основные веб-клиенты блогов <a target="_blank" href="https://golos.id">golos.id</a> и <a target="_blank" href="https://golos.in">golos.in</a>, альтернативные <a target="_blank" href="https://wiki.golos.id">клиенты</a>, а также Desktop (для <a target="_blank" href="https://files.golos.app/blogs-win/latest.exe">Windows</a> и <a target="_blank" href="https://files.golos.app/blogs-linux/latest.deb">Linux</a>)</p>
                            </div>
                            <div className='column large-3 medium-3 small-6'>
                                <a target="_blank" href="https://dex.golos.app"><Icon name='money' size='10x'/>
                                <h5>Golos DEX</h5></a>
                                <p className='landing-services-block-icon-text'>Торговля токенами на <a target="_blank" href="/market">внутренней бирже</a> и <a target="_blank" href="/convert">обменнике</a>, веб-клиентах <a target="_blank" href="https://dex.golos.app">dex.golos.app</a> или <a target="_blank" href="https://gls.exchange">gls.exchange</a></p>
                            </div>
                            <div className='column large-3 medium-3 small-6'>
                                <a target="_blank" href="https://golostalk.com"><Icon name='team' size='10x'/>
                                <h5>Golos Forums</h5></a>
                                <p className='landing-services-block-icon-text'>Формат общения по категориям/темам: <a target="_blank" href="https://golostalk.com">golostalk.com</a>, <a target="_blank" href="https://prizmtalk.com">prizmtalk.com</a>, <a target="_blank" href="https://forum.gph.ai">forum.gph.ai</a></p>
                            </div> 
                            <div className='column large-3 medium-3 small-6'>
                                <a target="_blank" href="https://chat.golos.app"><Icon name='rocket' size='10x'/>
                                <h5>Golos Messenger</h5></a>
                                <p className='landing-services-block-icon-text'>Чаты с приватными сообщениями на <a target="_blank" href="https://chat.golos.app">chat.golos.app</a> или для установки на Android <a target="_blank" href="https://files.golos.app/msg-android/latest.apk">apk-файл</a> (<a target="_blank" href={require("app/assets/images/msg-load.png")}>QR-код</a>)</p>
                            </div>                                                       
                        </div>
                    </div>
                    <div className='column large-12 medium-12 small-12'>
                        <hr/>
                    </div>
                </div>
                <div className='landing-services-block'>
                    <div className='column large-12 medium-12 small-12'>
                        <div className='row'>
                            <div className='column large-12 medium-12 small-12' align='center'>
                                <h3><Icon name="golos" size="2x" /> {tt('services.services')}</h3><br />
                            </div>
                            <div className=' column large-12 medium-12 small-12'>
                                <h4><a target="_blank" rel="noopener noreferrer" href="https://dpos.space/golos/"><Icon name="new/monitor" /> dpos.space</a></h4>
                                {tt('services.developer')} <a href="/@denis-skripnik">@denis-skripnik</a>
                                <p>Большое количество инструментов для работы с блокчейном и получения из него информации... <a href="/@denis-skripnik/dpos-space-services-worker">{tt('g.more_hint')}</a> <Icon name="extlink" /></p>
                                <h4><a target="_blank" rel="noopener noreferrer" href="https://pisolog.net/stats/accounts/allaccounts"><Icon name="new/monitor" /> pisolog.net</a></h4>
                                {tt('services.developer')} <a href="/@bitwheeze">@bitwheeze</a>
                                <p>Наглядная статистика по аккаунтам, кураторам, репутации, изменениям Силы Голоса... <a href="/@bitwheeze/osen">{tt('g.more_hint')}</a> <Icon name="extlink" /></p>
                                <h4><a target="_blank" rel="noopener noreferrer" href="https://golos.cf/"><Icon name="new/monitor" /> golos.cf</a></h4>
                                {tt('services.developer')} <a href="/@vik">@vik</a>
                                <p>Функциональный сервис для получения информации из блокчейна о любом аккаунте, истории операций... <a href="/@vik/explorer-guide">{tt('g.more_hint')}</a> <Icon name="extlink" /></p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='landing-services-block'>
                    <div className='column large-12 medium-12 small-12'>
                        <hr/>
                    </div>
                    <div className='column large-12 medium-12 small-12'>
                        <div className='row'>
                            <div className='column large-12 medium-12 small-12' align='center'>
                                <h3><Icon name="golos" size="2x" /> {tt('services.games')}</h3><br />
                            </div>
                            <div className=' column large-12 medium-12 small-12'>
                                <h4><a target="_blank" rel="noopener noreferrer" href="https://sol.pisolog.net"><Icon name="new/monitor" /> пасьянс косынка <span className='new'>new</span></a></h4>
                                {tt('services.developer')} <a href="/@bitwheeze">@bitwheeze</a>
                                <p>Всем знакомая игра в пасьянс, ставки, выигрыши токенами... <a href="/@bitwheeze/upakovka-brambuletov">{tt('g.more_hint')}</a> <Icon name="extlink" /></p>
                                <h4><a target="_blank" href="/@one-armed"><Icon name="new/monitor" /> однорукий бандит</a></h4>
                                {tt('services.developer')} <a href="/@jackvote">@jackvote</a>
                                <p>Классическая слот-машина "однорукий бандит" с тремя барабанами... <a href="/@one-armed/slot-mashina-tri-kita">{tt('g.more_hint')}</a> <Icon name="extlink" /></p>
                            </div>
                        </div>
                    </div>
                    <div className='column large-12 medium-12 small-12'>
                        <hr/>
                    </div>
                </div>
                <div className='landing-services-block'>
                    <div className='column large-12 medium-12 small-12'>
                        <div className='row'>
                            <div className='column large-12 medium-12 small-12' align='center'>
                                <h3><Icon name="golos" size="2x" /> {tt('services.bots')}</h3><br />
                            </div>
                            <div className=' column large-12 medium-12 small-12'>
                                <h4><a target="_blank" href="https://t.me/golosclassicbot"><Icon name="new/telegram" /> golosclassicbot</a></h4>
                                {tt('services.developer')} <a href="/@rudex">@rudex</a>
                                <p>Легко настраиваемый бот, который позволяет получать уведомления о разных событиях, связанных с выбранным пользователем (упоминания, комментарии, переводы, подписка)... <a href="/@vict0r/samyi-priyatnyi-bot-na-golose">{tt('g.more_hint')}</a> <Icon name="extlink" /></p>
                                <h4><a target="_blank" href="https://t.me/tip23bot"><Icon name="new/telegram" /> tip23bot</a></h4>
                                {tt('services.developer')} <a href="/@ksantoprotein">@ksantoprotein</a>
                                <p>Бот позволяет вознаграждать пользователей токенами в телеграм-группах, и не только... <a href="/@ksantoprotein/tip23bot-telegramm-bot-dlya-laikov-avtokleminga-i-igr">{tt('g.more_hint')}</a> <Icon name="extlink" /></p>
                                {/* <h4><a target="_blank" href="https://t.me/upit_bot"><Icon name="new/telegram" /> upit_bot</a></h4>
                                {tt('services.developer')} <a href="/@vvk">@vvk</a>
                                <p>Бот, позволяющий подписываться на новые комментарии к постам с возможностью ответа на них, а также лайков/дизлайков, вознаграждений... <a href="/@upit/upit-comments-subscriptions">{tt('g.more_hint')}</a> <Icon name="extlink" /></p> */}
                                <h4><a target="_blank" href="https://t.me/golosyakabot"><Icon name="new/telegram" /> golosyakabot</a></h4>
                                {tt('services.developer')} <a href="/@jackvote">@jackvote</a>
                                <p>Сканер о событиях в блокчейне с подпиской на интересуемые аккаунты и/или операции... <a href="/@lindsay/chetyre-poleznykh-telegram-bota-dlya-blokcheina-golos">{tt('g.more_hint')}</a> <Icon name="extlink" /></p>
                                <h4><a target="_blank" href="https://t.me/gacinfobot"><Icon name="new/telegram" /> gacinfobot</a></h4>
                                {tt('services.developer')} <a href="/@jackvote">@jackvote</a>
                                <p>Бот с подробной информацией об аккаунтах на Голосе... <a href="/@jackvote/informaciya-s-gakom-ili-bot-informator-ob-akkauntakh-golosa">{tt('g.more_hint')}</a> <Icon name="extlink" /></p>
                                <h4><a target="_blank" href="https://t.me/mintcandybot"><Icon name="new/telegram" /> mintcandybot <span className='new'>new</span></a></h4>
                                {tt('services.developer')} <a href="/@maxwell2019">@maxwell2019</a>
                                <p>Бот позволяет вознаграждать пользователей токенами в телеграм-группах... <a href="/@mint-candy/mint-candy">{tt('g.more_hint')}</a> <Icon name="extlink" /></p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='landing-services-block'>
                    <div className='row'>
                        <div className='column large-12 medium-12 small-12'>
                            <p className='landing-services-block-text landing-services-block-center'>
                                {tt('services.footer_1')} <a target="_blank" href='https://t.me/golos_id'>golos_id</a> {tt('services.footer_2')}.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

module.exports = {
    path: 'services',
    component: Services,
};