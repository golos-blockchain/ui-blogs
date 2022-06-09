import React from 'react'
import PropTypes from 'prop-types'
import tt from 'counterpart'
import { connect } from 'react-redux'
import { Asset, AssetEditor } from 'golos-lib-js/lib/utils'

import transaction from 'app/redux/Transaction';
import CMCValue from 'app/components/elements/market/CMCValue'
import MarketInput from 'app/components/elements/market/MarketInput'
import { DEFAULT_EXPIRE, generateOrderID, roundUp, roundDown, float2str } from 'app/utils/market/utils'
import FloatEditor from 'app/utils/market/FloatEditor'

class OrderForm extends React.Component {
    static propTypes = {
        placeOrder: PropTypes.func.isRequired,
        onCreate: PropTypes.func.isRequired,
    };

    state = {
        price: new FloatEditor(0, 8),
        amount: AssetEditor(0, 3, 'GOLOS'),
        total: AssetEditor(0, 3, 'GBG'),
        fee: Asset(0, 3, 'GBG'),
        feePct: Asset(0, 2, 'PCT'),
        submitDisabled: true
    }

    initFields = (prevProps) => {
        const { sym1, sym2, assets, isSell } = this.props
        if (sym1 !== prevProps.sym1 || sym2 !== prevProps.sym2 ||
            assets && !prevProps.assets) {
            let feeSym = isSell ? sym2 : sym1
            this.setState({
                amount: AssetEditor(0, assets[sym1].precision, sym1),
                total: AssetEditor(0, assets[sym2].precision, sym2),
                fee: Asset(0, assets[feeSym].precision, feeSym),
                feePct: Asset(assets[feeSym].fee_percent, 2, 'PCT')
            })
        }
    }

    componentDidMount() {
        this.initFields({})
    }

    componentDidUpdate(prevProps) {
        this.initFields(prevProps)
    }

    updateTotal = (amount, price) => {
        const totalFloat = parseFloat(amount.amountFloat) * price

        let total = this.state.total.asset.clone()
        const { precision } = this.state.total.asset
        let amountFloat
        if (this.props.isSell) {
            amountFloat = roundDown(totalFloat, precision)
        } else {
            amountFloat = roundUp(totalFloat, precision)
        }
        total.amountFloat = amountFloat.toString()// float2str(amountFloat)
        return total
    }

    onPriceChange = e => {
        const price = this.state.price.withChange(e.target.value)
        if (price.hasChange && price.float >= 0) {
            let total = this.updateTotal(this.state.amount.asset, price.float)
            this.setState({
                price,
                total: AssetEditor(total)
            }, () => {
                this.validate()
            })
        }
    }

    onAmountChange = e => {
        const amount = this.state.amount.withChange(e.target.value)
        if (amount.hasChange && amount.asset.amount >= 0) {
            const { price } = this.state

            let total = this.updateTotal(amount.asset, price.float)
            this.setState({
                amount,
                total: AssetEditor(total)
            }, () => {
                this.validate()
            })
        }
    }

    updateAmount = (total, price ) => {
        const amountFloat = parseFloat(total.amountFloat)
            / price

        let amount = this.state.amount.asset.clone()
        const { precision } = this.state.amount.asset
        let priceFix
        if (this.props.isSell) {
            amount.amountFloat = roundUp(amountFloat, precision).toFixed(precision)
        } else {
            amount.amountFloat = roundDown(amountFloat, precision).toFixed(precision)
        }
        priceFix = parseFloat(total.amountFloat) / parseFloat(amount.amountFloat)
        return {amount, price: priceFix}
    }

    onTotalChange = e => {
        const total = this.state.total.withChange(e.target.value)
        if (total.hasChange && total.asset.amount >= 0) {
            const { price } = this.state
            const res = this.updateAmount(total.asset, price.float)
            this.setState({
                total,
                amount: AssetEditor(res.amount),
                price: this.state.price.withVirtChange(res.price)
            }, () => {
                this.validate()
            })
        }
    }

    setPrice = priceFloat => {
        const price = new FloatEditor(priceFloat, 8)
        let total = this.updateTotal(this.state.amount.asset, price.float)
        this.setState({
            price,
            total: AssetEditor(total)
        }, () => {
            this.validate()
        })
    }

    onBestPriceClick = e => {  
        e.preventDefault();
        const { bestPrice } = this.props
        this.setPrice(bestPrice)
    }

    _getBalance = () => {
        const { account, assets, sym1, sym2, isSell } = this.props
        let balance
        const balSym = isSell ? sym1 : sym2
        if (account && assets && balSym in assets) {
            if (balSym === 'GOLOS') {
                balance = account.balance
            } else if (balSym === 'GBG') {
                balance = account.sbd_balance
            } else {
                balance = assets[balSym].balance
            }
        }
        return balance
    }

    onBalanceClick = e => {
        e.preventDefault()
        const { isSell } = this.props
        let balance = this._getBalance()
        balance = Asset(balance)
        let amount, total, price
        if (isSell) {
            amount = balance.clone()
            total = this.updateTotal(amount, this.state.price.float)
        } else {
            total = balance.clone()
            let res = this.updateAmount(total, this.state.price.float)
            amount = res.amount
            price = res.price
        }
        this.setState({
            amount: AssetEditor(amount),
            total: AssetEditor(total),
            price: price ? this.state.price.withVirtChange(price) : this.state.price
        }, () => {
            this.validate()
        })
    }

    validate = () => {
        const { isSell } = this.props
        const { price, amount, total } = this.state
        let valid = price.float > 0 && amount.asset.amount > 0 && total.asset.amount > 0
        const balance = this._getBalance()
        if (balance) {
            const suff = (isSell ? amount.asset : total.asset).lte(Asset(balance))
            if (!suff) {
                this.setState({
                    submitDisabled: true,
                    insufficient: true
                })
                return
            }
        }

        const { sym1, sym2, assets} = this.props
        let feeSym = isSell ? sym2 : sym1
        const fee = (isSell ? total.asset : amount.asset).mul(assets[feeSym].fee_percent).div(10000)
        this.setState({
            submitDisabled: !valid,
            insufficient: false,
            priceWarning: valid && (isSell ?
                this.percentDiff(price.float) < -15 :
                this.percentDiff(price.float) > 15),
            fee
        })
    }

    percentDiff = (userPrice) => {
        let bestPrice = parseFloat(this.props.bestPrice)
        let up = userPrice
        return (100 * (up - bestPrice)) / bestPrice
    }

    onSubmit = (e) => {
        e.preventDefault()
        const { placeOrder, account, isSell, bestPrice,
            onCreate } = this.props
        const { amount, total, price, priceWarning } = this.state

        let amountToSell = isSell ? amount.asset.clone() : total.asset.clone()
        let minToReceive = isSell ? total.asset.clone() : amount.asset.clone()
        placeOrder(
            account.name,
            isSell,
            amountToSell,
            minToReceive,
            price.float,
            !!priceWarning,
            bestPrice,
            msg => {
                onCreate(msg)
            }
        )
    }

    render() {
        const { sym1, sym2, account, assets, bestPrice, isSell } = this.props
        const { priceWarning, submitDisabled,
            price, amount, total, fee, feePct, insufficient } = this.state

        const balance = this._getBalance()

        return (<form className="Market__orderform" onSubmit={this.onSubmit}>
            <MarketInput
                label={tt('g.price')}
                className={'input-group-field' + (priceWarning ? ' price_warning' : '')}
                placeholder="0.0"
                value={price.str}
                onChange={this.onPriceChange}
                symbol={`${sym2}/${sym1}`} />

            <MarketInput
                rowTitle={(insufficient && isSell) ? tt('g.invalid_amount') : ''}
                label={tt('g.amount')}
                className={"input-group-field" +
                    ((insufficient && isSell) ? ' balance_warning' : '')}
                placeholder="0.0"
                value={amount.amountStr}
                onChange={this.onAmountChange}
                symbol={sym1} />

            <MarketInput
                rowTitle={(insufficient && !isSell) ? tt('g.invalid_amount') : ''}
                label={<span>
                        {tt('market_jsx.total')}
                        <small className='Market__orderform-cmc'>
                            <CMCValue buyAmount={total.asset} compact={true} />
                        </small>
                    </span>}
                className={"input-group-field" +
                    ((insufficient && !isSell) ? ' balance_warning' : '')}
                type="text"
                placeholder="0.0"
                value={total.amountStr}
                onChange={this.onTotalChange}
                symbol={sym2} />

            <MarketInput
                label={tt('market_jsx.market_fee_percent_') + feePct.amountFloat + '%'}
                className="input-group-field"
                disabled
                placeholder="0.0"
                value={fee.amountFloat}
                symbol={fee.symbol} />

            <div className="row">
                <div className="column small-3 large-2" />
                <div className="column small-9 large-8">
                    <input
                        disabled={submitDisabled}
                        type="submit"
                        className={'button hollow ' + (isSell ? 'sell' : 'buy') + '-color float-right uppercase'}
                        value={isSell ? tt('navigation.sell_LIQUID_TOKEN', { LIQUID_TOKEN: sym1 }) :
                            tt('navigation.buy_LIQUID_TOKEN', { LIQUID_TOKEN: sym1 })}
                    />

                    <div className="Market__balance">
                        {balance && (
                            <small>
                                <a href="#" onClick={this.onBalanceClick}>
                                    {tt('market_jsx.available')}:
                                </a>{' '}
                                {balance}
                            </small>
                        )}
                        <br/>
                        <small>
                            <a href="#" onClick={this.onBestPriceClick}>
                                {tt('market_jsx.lowest_ask')}:
                            </a>{' '}
                            {bestPrice.toFixed(8)}<br/>
                        </small>
                    </div>
                </div>
            </div>
        </form>)
    }
}

export default connect(
    null,
    dispatch => ({
        placeOrder: (
            owner,
            isSell,
            amount_to_sell,
            min_to_receive,
            effective_price,
            priceWarning,
            marketPrice,
            successCallback,
            fill_or_kill = false,
            expiration = DEFAULT_EXPIRE
        ) => {
            let effectivePrice = float2str(effective_price) + ' ' 

            let confirmStr
            if (isSell) {
                effectivePrice += min_to_receive.symbol + '/' + amount_to_sell.symbol
                confirmStr = tt('market_jsx.sell_amount_for_atleast', {
                    amount_to_sell, min_to_receive, effectivePrice
                })
            } else {
                effectivePrice += amount_to_sell.symbol + '/' + min_to_receive.symbol
                confirmStr = tt('market_jsx.buy_atleast_amount_for', {
                    amount_to_sell, min_to_receive, effectivePrice
                })
            }

            const successMessage = tt('g.order_placed') + ': ' + confirmStr;
            const confirm = confirmStr + '?';
            const warning = priceWarning
                ? tt('market_jsx.price_warning_' + (isSell ? 'below' : 'above'),
                    {
                        marketPrice:
                            parseFloat(marketPrice).toFixed(8) + ' ' +
                            (isSell ? min_to_receive.symbol : amount_to_sell.symbol) +
                            '/' +
                            (isSell ? amount_to_sell.symbol : min_to_receive.symbol)
                    })
                : null;

            const orderid = generateOrderID()

            const operation = {
                owner,
                amount_to_sell,
                min_to_receive,
                fill_or_kill,
                expiration,
                orderid,
            }

            dispatch(
                transaction.actions.broadcastOperation({
                    type: 'limit_order_create',
                    operation,
                    confirm,
                    warning,
                    successCallback: () => {
                        successCallback(successMessage);
                    },
                })
            );
        }
    }), null, {
        forwardRef: true
    }
)(OrderForm)
