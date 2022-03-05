import React, {Component} from 'react'
import Button from '@elements/Button';

class LeavePage extends Component {
    goBack = () => {
        this.props.router.goBack()
    }

    leaveOut = target => () => {
        if (process.env.IS_APP) {
            window.open(target, '_blank')
            window.close()
        } else {
            window.location.assign(target)
        }
    }

    render() {
        const targetPage = this.props.location.search.slice(1) + this.props.location.hash
        return (
            <div className="leave-page" style={{ backgroundImage: 'url(images/leave-bg.svg)' }}>
                <div className="leave-page_content row medium-7 large-7">
                    <div className="column">
                        <h3>
                            Вы покидаете сайт <a href="/">Golos Блоги</a>
                        </h3>
                        <p>
                            Ссылка, на которую вы нажали, переадресует вас по адресу: <strong>{targetPage}</strong></p>
                        <p>
                            <a href="/">Golos Блоги</a> не имеют отношения к этому сайту, и мы не можем гарантировать безопасность его использования. Ресурсы с закрытым исходным кодом могут содержать вредоносные скрипты и использовать мошеннические схемы.
                        </p>
                        <p>
                            Рекомендуем вам не переходить по ссылке, если у вас нет оснований доверять этому сайту.
                        </p>
                        <p>
                            Помните, что ключи вашего аккаунта на <a href="/">Golos Блоги</a> не могут быть восстановлены, а доступ к ним позволит завладеть вашими средствами.
                        </p>
                        <p className="text-center medium-text-left">
                            <Button onClick={this.leaveOut(targetPage)} round>
                                Перейти по ссылке
                            </Button>
                        </p>
                    </div>
                </div>
            </div>
        )
    }
}

module.exports = {
    path: 'leave_page',
    component: LeavePage
};
