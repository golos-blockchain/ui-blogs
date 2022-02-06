import React from 'react';
import { connect } from 'react-redux';
import tt from 'counterpart';
import { api } from 'golos-lib-js';
import Icon from 'app/components/elements/Icon';

class Footer extends React.Component {
    state = {
        currentSupply: 0,
    };

    async componentDidMount() {
        const { pricePerGolos } = this.props;

        const res = await api.getDynamicGlobalProperties();
        this.setState({
            currentSupply: Math.floor(
                parseInt(res.current_supply) / pricePerGolos
            ),
        });
    }

    renderItems(items) {
        if (items[0].icon) {
            return (
                <ul>
                    <li className="social-icons">
                        {items.map((item, i) => (
                            <a key={i} href={item.url} target="blank">
                                <Icon name={item.icon} size={item.size} />
                            </a>
                        ))}
                    </li>
                </ul>
            );
        }

        if (Array.isArray(items[0])) {
            return (
                <div className="row medium-up-1 large-up-2">
                    {items.map((chunk, ic) => (
                        <ul className="columns" key={ic}>
                            {chunk.map((item, i) => (
                                <li key={i} className={item.className}>
                                    <a href={item.url} target="blank">
                                        {item.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    ))}
                </div>
            );
        }

        return (
            <ul>
                {items.map((item, i) => (
                    <li key={i} className={item.className}>
                        <a href={item.url} target="blank">
                            {item.name}
                        </a>
                    </li>
                ))}
            </ul>
        );
    }

    render() {
        const { currentSupply } = this.state;
        const year = new Date().getFullYear();

        const menuItems = [];
        menuItems.push(
            {
                name: tt('g.social_network'),
                columnAlign: 'left',
                width: 'medium-3',
                items: [
                    {
                        name: 'Twitter',
                        url: 'https://twitter.com/goloschain',
                        icon: 'new/twitter',
                        size: '1_5x',
                    },
                    {
                        name: 'Telegram',
                        url: 'https://t.me/golos_id',
                        icon: 'new/telegram',
                        size: '1_5x',
                    },
                    {
                        name: 'VK',
                        url: 'https://vk.com/golosclassic',
                        icon: 'new/vk',
                        size: '1_5x',
                    },
                    {
                        name: 'GitHub',
                        url: 'https://github.com/golos-blockchain',
                        icon: 'github',
                        size: '1_5x',
                    },
                    {
                        name: 'Wiki',
                        url: 'https://wiki.golos.id',
                        icon: 'new/wikipedia',
                        size: '1_5x',
                    }
                ],
            },
        );

        return (
            <section className="Footer">
                <div className="Footer__menus">
                    <div className="row" id="footer">                    
                        {this._renderMenus(menuItems)}

                        {$STM_Config.show_adv_banners ?
                        (<iframe data-aa='1148805' src='//ad.a-ads.com/1148805?size=728x90' scrolling='no'
                        style={{width:'728px', height:'90px', border:'0px', padding:'0', overflow:'hidden'}}
                        allowtransparency='true' sandbox='allow-same-origin allow-scripts allow-popups' loading='lazy'></iframe>) : (<div><a target='_blank' href='https://golostalk.com'><img src={require('app/assets/images/banners/golostalk.png')} width='800' height='100' /></a></div>)}

                    </div>
                </div>
                <div className="Footer__description">
                    <div className="row">
                        <div className="small-12 medium-12 columns">
                            <span className="left">
                                © 2016-{year} {tt('g.about_project')}
                            </span>
                            <span className="right">
                                <a href='mailto:info@golos.id'><Icon name="new/envelope" /> Contact Us</a>
                            </span>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    _renderMenus(menuItems) {
        return menuItems.map((menu, index) => (
            <div
                key={index}
                className={`small-12 ${menu.width} columns text-${
                    menu.columnAlign
                }`}
            >
                <strong>{menu.name}</strong>
                {this.renderItems(menu.items)}
            </div>
        ));
    }
}

export default connect(state => {
    const feedPrice = state.global.get('feed_price');
    let pricePerGolos = undefined;

    if (feedPrice && feedPrice.has('base') && feedPrice.has('quote')) {
        const { base, quote } = feedPrice.toJS();
        if (/ GBG$/.test(base) && / GOLOS$/.test(quote))
            pricePerGolos =
                parseFloat(base.split(' ')[0]) /
                parseFloat(quote.split(' ')[0]);
    }

    return { pricePerGolos };
})(Footer);
