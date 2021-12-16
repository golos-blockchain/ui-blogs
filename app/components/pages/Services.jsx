import React from 'react';
import tt from 'counterpart';
import Icon from 'app/components/elements/Icon'

class Services extends React.Component {
    render() {
        return (
            <div className='landing-services'>
                <div className='landing-services-block'>                    
                    <img className="float-center" style={{marginTop: "60px"}} src={require("app/assets/images/landing/golos_is_usefull.png")} width="500" />
                    <div className='row landing-services-block-center float-center'>
                        Наиболее популярные <b>сервисы, игры и боты</b>,<br />
                        которые могут оказаться полезными для взаимодействия с блокчейном Голос.
                    </div>                    
                    <br />
                    <div className='row'>                            
                        <a target="_blank" href="/market" className="golos-btn btn-secondary btn-round"><Icon name="trade" /> Golos Exchange</a>&nbsp;<a target="_blank" href="/msgs" className="golos-btn btn-secondary btn-round"><Icon name="new/envelope" /> Golos Messenger</a>&nbsp;<a target="_blank" href="https://golostalk.com" className="golos-btn btn-secondary btn-round"><Icon name="chatboxes" /> Golos Forum </a>&nbsp;<a target="_blank" href="/search" className="golos-btn btn-secondary btn-round"><Icon name="new/search" /> Golos Search</a>&nbsp;<a target="_blank" href="https://golos.app" className="golos-btn btn-secondary btn-round"><Icon name="key" /> Golos Signer</a>
                    </div>
                </div>
                <div className='landing-services-block'>
                    <div className='column large-12 medium-12 small-12'>
                        <div className='column large-12 medium-12 small-12'>
                            <hr/>
                        </div>
                        <div className='column large-12 medium-12 small-12'>
                            <div className='row'>
                                <div className='column large-12 medium-12 small-12' align='center'>
                                    <h3><Icon name="golos" size="2x" /> Сервисы</h3><br />
                                </div>
                                <div className=' column large-12 medium-12 small-12'>
                                    <h4><a target="_blank" rel="noopener noreferrer" href="https://dpos.space/golos/"><Icon name="new/monitor" /> dpos.space</a></h4>
                                    Разработчик <a href="/@denis-skripnik">@denis-skripnik</a>
                                    <p>Большое количество инструментов для работы с блокчейном и получения из него информации... <a href="/@denis-skripnik/dpos-space-services-worker">{tt('g.more_hint')}</a> <Icon name="extlink" /></p>
                                    <h4><a target="_blank" rel="noopener noreferrer" href="https://pisolog.net/stats/accounts/allaccounts"><Icon name="new/monitor" /> pisolog.net</a></h4>
                                    Разработчик <a href="/@bitwheeze">@bitwheeze</a>
                                    <p>Наглядная статистика по аккаунтам, кураторам, репутации, изменениям Силы Голоса... <a href="/@bitwheeze/osen">{tt('g.more_hint')}</a> <Icon name="extlink" /></p>
                                    <h4><a target="_blank" rel="noopener noreferrer" href="https://golos.cf/"><Icon name="new/monitor" /> golos.cf</a></h4>
                                    Разработчик <a href="/@vik">@vik</a>
                                    <p>Функциональный сервис для получения информации из блокчейна о любом аккаунте, истории операций... <a href="/@vik/explorer-guide">{tt('g.more_hint')}</a> <Icon name="extlink" /></p>
                                </div>
                            </div>
                        </div>
                        <div className='column large-12 medium-12 small-12'>
                            <hr/>
                        </div>
                    </div>
                </div>
                <div className='landing-services-block'>
                    <div className='column large-12 medium-12 small-12'>
                        <div className='column large-12 medium-12 small-12'>
                            <div className='row'>
                                <div className='column large-12 medium-12 small-12' align='center'>
                                    <h3><Icon name="golos" size="2x" /> Игры</h3><br />
                                </div>
                                <div className=' column large-12 medium-12 small-12'>
                                    <h4><a target="_blank" rel="noopener noreferrer" href="https://sol.pisolog.net"><Icon name="new/monitor" /> пасьянс</a></h4>
                                    Разработчик <a href="/@bitwheeze">@bitwheeze</a>
                                    <p>Всем знакомая игра в пасьянс, ставки, выигрыши токенами... <a href="/@bitwheeze/upakovka-brambuletov">{tt('g.more_hint')}</a> <Icon name="extlink" /></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='landing-services-block'>
                    <div className='column large-12 medium-12 small-12'>
                        <div className='column large-12 medium-12 small-12'>
                            <hr/>
                        </div>
                        <div className='column large-12 medium-12 small-12'>
                            <div className='row'>
                                <div className='column large-12 medium-12 small-12' align='center'>
                                    <h3><Icon name="golos" size="2x" /> Боты</h3><br />
                                </div>
                                <div className=' column large-12 medium-12 small-12'>
                                    <h4><a target="_blank" href="https://t.me/golosclassicbot"><Icon name="new/telegram" /> golosclassicbot</a></h4>
                                    Разработчик <a href="/@rudex">@rudex</a>
                                    <p>Легко настраиваемый бот, который позволяет получать уведомления о разных событиях, связанных с выбранным пользователем (упоминания, комментарии, переводы, подписка)... <a href="/@vict0r/samyi-priyatnyi-bot-na-golose">{tt('g.more_hint')}</a> <Icon name="extlink" /></p>
                                    <h4><a target="_blank" href="https://t.me/tip23bot"><Icon name="new/telegram" /> tip23bot</a></h4>
                                    Разработчик <a href="/@ksantoprotein">@ksantoprotein</a>
                                    <p>Бот позволяет вознаграждать токенами других пользователей в телеграм-группах, а также автоматически получать токены с вашего CLAIM-баланса... <a href="/@ksantoprotein/tip23bot-telegramm-bot-dlya-laikov-avtokleminga-i-igr">{tt('g.more_hint')}</a> <Icon name="extlink" /></p>
                                    {/* <h4><a target="_blank" href="https://t.me/upit_bot"><Icon name="new/telegram" /> upit_bot</a></h4>
                                    Разработчик <a href="/@vvk">@vvk</a>
                                    <p>Бот, позволяющий подписываться на новые комментарии к постам с возможностью ответа на них, а также лайков/дизлайков, вознаграждений... <a href="/@upit/upit-comments-subscriptions">{tt('g.more_hint')}</a> <Icon name="extlink" /></p> */}
                                    <h4><a target="_blank" href="https://t.me/golosyakabot"><Icon name="new/telegram" /> golosyakabot</a></h4>
                                    Разработчик <a href="/@jackvote">@jackvote</a>
                                    <p>Сканер о событиях в блокчейне с подпиской на интересуемые аккаунты и/или операции... <a href="/@lindsay/chetyre-poleznykh-telegram-bota-dlya-blokcheina-golos">{tt('g.more_hint')}</a> <Icon name="extlink" /></p>
                                    <h4><a target="_blank" href="https://t.me/gacinfobot"><Icon name="new/telegram" /> gacinfobot</a></h4>
                                    Разработчик <a href="/@jackvote">@jackvote</a>
                                    <p>Бот с подробной информацией об аккаунтах на Голосе... <a href="/@jackvote/informaciya-s-gakom-ili-bot-informator-ob-akkauntakh-golosa">{tt('g.more_hint')}</a> <Icon name="extlink" /></p>
                                </div>
                            </div>
                        </div>
                        <div className='column large-12 medium-12 small-12'>
                            <hr/>
                        </div>
                    </div>
                </div>
                <div className='landing-services-block'>
                    <div className='column large-12 medium-12 small-12'>
                        <div className='row'>
                            <div className='column large-12 medium-12 small-12'>
                                <p className='landing-services-block-text landing-services-block-center'>
                                    Если в списке не хватает какого-то полезного сервиса/игры/бота, напишите в ТГ-чат <a target="_blank" href='https://t.me/golos_id_issue'>golos_id_issue</a> или добавьте пост на Голосе.
                                </p>
                            </div>
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