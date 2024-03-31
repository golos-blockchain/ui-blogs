import React from 'react'
import golos from 'golos-lib-js';
import GolosDexApi from 'golos-dex-lib-js'

import Icon from 'app/components/elements/Icon'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import tt from 'counterpart'

import { walletUrl } from 'app/utils/walletUtils'

class CMCWidget extends React.Component {
    state = {
        loaded: false
    }

    getPriceChange = (res) => {
        let price_change = null
        try {
            price_change = res.data.quote.RUB.percent_change_24h
        } catch (err) {}
        if (price_change) {
            price_change = parseFloat(price_change)
            if (isNaN(price_change)) {
                price_change = null
            }
        }
        return price_change
    }

    async componentDidMount() {
        try {
            new GolosDexApi(golos, {
                host: $STM_Config.apidex_service.host
            })
        } catch (err) {
            console.error('Cannot init GolosDexApi', err)
            this.setState({
                failed: true
            })
            return
        }

        const { dex } = golos.libs
        let res = await dex.apidexGetPrices({ sym: 'GOLOS' })
        if (res.price_rub) {
            const price_change = this.getPriceChange(res)
            this.setState({
                loaded: true,
                price_usd: res.price_usd,
                price_rub: res.price_rub,
                page_url: res.page_url,
                price_change,
            })
        } else {
            this.setState({
                failed: true
            })
        }
    }

    render() {
        const { loaded, failed, price_usd, price_rub, page_url, price_change } = this.state
        if (!loaded) {
            return (<div className="CMCWidget">
                    <div className="CMCWidget__inner">
                        <div className='CMCWidget__inner2' style={{ justifyContent: 'center' }} >
                            {!failed ?
                                <LoadingIndicator type='circle' size='25px' /> :
                                null}
                        </div>
                    </div>
                </div>)
        }
        let url = walletUrl(`/exchanges`)

        const now = new Date()
        const nowMonth = now.getMonth() + 1
        const nowDay = now.getDate()
        const christmas = (nowMonth === 12 && nowDay >= 15)
            || (nowMonth === 1 && nowDay <= 15)
        
        return (<div className="CMCWidget">
                <div className="CMCWidget__inner">
                    <div className='CMCWidget__inner2'>
                        <div className="CMCWidget__icon-parent">
                            {christmas ?
                                <img src={require('app/assets/images/logo-ng3.png')} width='40' height='46' /> :
                                <Icon name='golos' size="2x" />}
                        </div>
                        <div className="CMCWidget__main-parent">
                            <span style={{ fontSize: '18px' }}>
                                <a href={page_url} target="_blank" className="CMCWidget__link">Golos Blockchain </a>
                            </span><br/>
                            <span style={{ fontSize: '16px' }}>
                                <span className="CMCWidget__main-val">{price_rub ? price_rub.toFixed(5) : null}</span>                
                                <span className="CMCWidget__main-cur">&nbsp;RUB&nbsp;
                                {(price_change && price_change.toFixed) ? <span style={{ color: price_change < 0 ? '#d94040' : '#009600' }}>({price_change.toFixed(2)}%)</span> : null}
                                </span><br />
                                <span className="CMCWidget__sub-parent">
                                    <span className="CMCWidget__sub">{price_usd ? price_usd.toFixed(5) + ' USD' : null}</span>
                                </span><br/>
                                <span style={{ fontSize: '12px' }}>
                                    <a href={url} target="_blank" className="CMCWidget__link">{tt('g.buy_or_sell')}</a>
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>)
    }
}

export default CMCWidget
