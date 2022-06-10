import React from 'react'
import tt from 'counterpart'

import { apidexGetPrices } from 'app/utils/ApidexApiClient'

class CMCValue extends React.Component {
    state = {}

    componentDidMount() {
        this.updateCMCPrice(this.props.buyAmount)
    }

    componentDidUpdate(prevProps) {
        const { buyAmount } = this.props
        if (buyAmount && (!prevProps.buyAmount ||
            buyAmount.ne(prevProps.buyAmount) ||
                buyAmount.symbol !== prevProps.buyAmount.symbol)) {
            this.updateCMCPrice(buyAmount)
        }
    }

    updateCMCPrice = async (buyAmount) => {
        if (!buyAmount) {
            return
        }
        const { price_usd, price_rub, page_url } = await apidexGetPrices(buyAmount.symbol)
        const calc = (price) => {
            if (price === null || price === undefined) return null
            return parseFloat(buyAmount.amountFloat) * price
        }
        const cmcPrice = {
            price_usd: calc(price_usd),
            price_rub: calc(price_rub),
            page_url
        }
        this.setState({
            cmcPrice
        })
    }

    render() {
        const { renderer, compact } = this.props
        let cmc = null
        const { cmcPrice } = this.state
        if (cmcPrice) {
            const formatVal = (val, fmt) => {
                if (val && val.toFixed) {
                    if (val > 1000000) return fmt((val / 1000000).toFixed(3) + 'M')
                    if (compact && val > 100) return fmt(Math.round(val))
                    return fmt(val.toFixed(2))
                }
                return null
            }
            let mainVal, altVal
            const price_usd = formatVal(cmcPrice.price_usd, v => `$${v}`)
            const price_rub = formatVal(cmcPrice.price_rub, v => `${v} RUB`)
            if (tt.getLocale() === 'ru') {
                mainVal = price_rub || price_usd
                altVal = price_usd || price_rub
            } else {
                mainVal = price_usd || price_rub
                altVal = price_rub || price_usd
            }
            if (mainVal) {
                cmc = <b title={'~' + altVal}>{'~' + mainVal}</b>
                if (cmcPrice.page_url) {
                    cmc = <a href={cmcPrice.page_url} target='_blank' rel='noopener noreferrer'>{cmc}</a>
                }
            }
        }
        return (cmc && renderer) ? renderer(cmc) : cmc
    }
}

export default CMCValue
