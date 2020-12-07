import React from 'react';
import tt from 'counterpart';
import Icon from 'app/components/elements/Icon'

class Services extends React.Component {
    render() {
        return (
            <div className='landing-services'>
                <div className='landing-services-block'>
                    <div className='column large-12 medium-12 small-12'>
                        <h2>{tt('navigation.services')}</h2>
                    </div>
                    <img className="float-center" src={require("app/assets/images/landing/golos_is_usefull.png")} height="175" width="700" />
                    <div className='row landing-services-block-center'>
                        На данной странице собраны наиболее популярные сервисы и боты, которые могут оказаться полезными пользователям для взаимодействия с блокчейном Голос.
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
                                <h4><a target="_blank" href="https://dpos.space/golos/"><Icon name="new/monitor" /> Сервисы dpos.space</a></h4>
                                Разработчик сервисов <a target="_blank" href="/@denis-skripnik">@denis-skripnik</a>
                                </div>
                                <div className='column large-12 medium-12 small-12'>
                                    <br />Большое количество разнообразных инструментов для работы с блокчейном и получения из него информации... <a target="_blank" href="/@denis-skripnik/dpos-space-services-worker">{tt('g.more_hint')}</a> <Icon name="extlink" />
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
                            <hr/>
                        </div>
                        <div className='column large-12 medium-12 small-12'>
                            <div className='row'>
                                <div className='column large-12 medium-12 small-12' align='center'>
                                <h4><a target="_blank" href="https://golos.cf/"><Icon name="new/monitor" /> Сервисы golos.cf</a></h4>
                                Разработчик сервисов <a target="_blank" href="/@vik">@vik</a>
                                </div>
                                <div className=' column large-12 medium-12 small-12'>
                                    <br />Функциональный и удобный сервис для получения информации из блокчейна о любом аккаунте и истории операций... <a target="_blank" href="/@vik/explorer-guide">{tt('g.more_hint')}</a> <Icon name="extlink" />
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
                            <hr/>
                        </div>
                        <div className='column large-12 medium-12 small-12'>
                            <div className='row'>
                                <div className='column large-12 medium-12 small-12' align='center'>
                                <h4><a target="_blank" href="https://t.me/golosclassicbot"><Icon name="new/telegram" /> golosclassicbot</a></h4>
                                </div>
                                <div className='column large-12 medium-12 small-12'>
                                    <br />Легко настраиваемый бот, который позволяет получать уведомления о разных событиях, связанных с выбранным пользователем (упоминания, комментарии, переводы, подписка)... <a target="_blank" href="/@vict0r/samyi-priyatnyi-bot-na-golose">{tt('g.more_hint')}</a> <Icon name="extlink" />
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
                            <hr/>
                        </div>
                        <div className='column large-12 medium-12 small-12'>
                            <div className='row'>
                                <div className='column large-12 medium-12 small-12' align='center'>
                                <h4><a target="_blank" href="https://t.me/upit_bot"><Icon name="new/telegram" /> upit_bot</a></h4>
                                Разработчик телеграм-бота <a target="_blank" href="/@vvk">@vvk</a>
                                </div>
                                <div className='column large-12 medium-12 small-12'>
                                    <br />Бот, позволяющий подписываться на новые комментарии к постам с возможностью ответа на них, а также лайков/дизлайков, вознаграждений... <a target="_blank" href="/@upit/upit-comments-subscriptions">{tt('g.more_hint')}</a> <Icon name="extlink" />
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
                            <hr/>
                        </div>
                        <div className='column large-12 medium-12 small-12'>
                            <div className='row'>
                                <div className='column large-12 medium-12 small-12' align='center'>
                                <h4><a target="_blank" href="https://t.me/tip23bot"><Icon name="new/telegram" /> tip23bot</a></h4>
                                Разработчик телеграм-бота <a target="_blank" href="/@ksantoprotein">@ksantoprotein</a>
                                </div>
                                <div className='column large-12 medium-12 small-12'>
                                    <br />Бот позволяет вознаграждать токенами других пользователей в телеграм-группах, а также автоматически получать токены с вашего CLAIM-баланса... <a target="_blank" href="/@ksantoprotein/tip23bot-telegramm-bot-dlya-laikov-avtokleminga-i-igr">{tt('g.more_hint')}</a> <Icon name="extlink" />
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
                                    Если вы считаете, что здесь не хватает какого-то сервиса, напишите в телеграм-чат <a target="_blank" href='https://t.me/golos_id_issue'>golos_id_issue</a> или добавьте пост на Голосе.
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