import React, { PureComponent } from 'react';
import styled from 'styled-components';

const Root = styled.section`
    padding: 20px 0;
`;

const Row = styled.div`
    min-height: 1200px;
`;

const MainHeader = styled.div`
    font-family: ${a => a.theme.fontFamilyBold};
    font-size: 36px;
    line-height: 1.06;
    letter-spacing: 0.6px;
    color: #333;
    margin-bottom: 60px;
`;

const Description = styled.div`
    font-family: 'Open Sans', 'sans-serif';
    font-size: 14px;
    line-height: 1.57;
`;

const Block = styled.div`
    border-radius: 8px;
    background-color: #fff;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
    padding: 40px 60px;
    min-height: 460px;
    margin: 0.9375rem 0;

    @media screen and (max-width: 63.9375em) {
        min-height: 500px;
    }
    @media screen and (max-width: 39.9375em) {
        min-height: 400px;
    }
`;

const Image = styled.div`
    height: 70px;
`;

const Header = styled.div`
    font-family: ${a => a.theme.fontFamilyBold};
    font-size: 22px;
    line-height: 1.42;
    color: #212121;
    margin: 20px 0;
`;

const Button = styled.a`
    margin: 30px 0 0;
    padding: 0.85em 1.5em;
    letter-spacing: 3px;
`;

const items = [
    {
        header: 'Ключи',
        pic: 'password',
        description:
            'Ваш виртуальный паспорт в мире блокчейна. Ключи подтверждают, что аккаунт и токены принадлежат именно вам, берегите ключи. В отличие от настоящего паспорта, никто не сможет помочь вам их восстановить.',
    },
    {
        header: 'Голосование',
        pic: 'monitor-like',
        description:
            'Ежедневно у вас есть 10 голосов со 100% силой, для того чтобы оценить интересные посты. Кроме того, вы имеете возможность отблагодарить авторов, нажав соответствующую кнопку под постом.',
    },
    {
        header: 'Tеги',
        pic: 'monitor',
        description:
            'Это темы, по которым можно искать интересные для вас посты. Также на Голосе есть основные категории, которые вы видите в лентах и при добавлении своих постов.',
    },
    {
        header: 'Посты',
        pic: 'website',
        description:
            'В отличие от других блог-платформ, у нас есть не одна, а несколько лент. Новое — всё, что недавно опубликовали, обсуждаемое — с активными дискуссиями, популярное — посты с наибольшей поддержкой сообщества.',
    },
    {
        header: 'Токены',
        pic: 'bitcoin',
        description:
            'Монеты блокчейна, на основе которого работает Голос. Все награды за посты, комментарии и репосты выплачиваются токенами. Их можно обменять на биржах на любые криптовалюты или привычные деньги.',
    },
    {
        header: 'Сохранность',
        pic: 'bitcoin-chain',
        description: 'Всё, что было написано на Голосе, останется в блокчейне навсегда. Даже при редактировании или удалении ваше каждое действие сохранится в неизменной цепочке блоков, хранящейся на множестве серверов.',
    },
];

export default class Differences extends PureComponent {
    render() {
        return (
            <Root>
                <Row className="row align-middle">
                    <div className="columns">
                        <MainHeader>Интересные особенности</MainHeader>
                        <div className="row small-up-1 medium-up-2 large-up-3">
                            {this._renderItems()}
                        </div>
                    </div>
                </Row>
            </Root>
        );
    }

    _renderItems() {
        return items.map(({ header, description, pic, url }, i) => (
            <div key={i} className="columns">
                <Block className="align-top align-justify flex-dir-column flex-container">
                    <div>
                        <Image>
                            <img src={`images/new/welcome/${pic}.svg`} />
                        </Image>
                        <Header>{header}</Header>
                        <Description>{description}</Description>
                    </div>
                    {url ? (
                        <Button
                            className="button small violet hollow"
                            href={url}
                        >
                            Подробнее
                        </Button>
                    ) : null}
                </Block>
            </div>
        ));
    }
}
