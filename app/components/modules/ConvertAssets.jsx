import React from 'react'
import PropTypes from 'prop-types'
import { api, } from 'golos-lib-js'
import { Asset, AssetEditor, Price } from 'golos-lib-js/lib/utils'
import tt from 'counterpart'
import { connect, } from 'react-redux'
import { Map, } from 'immutable'
import { Link } from 'react-router'

import AssetBalance from 'app/components/elements/AssetBalance'
import CMCValue from 'app/components/elements/market/CMCValue'
import FinishedOrder from 'app/components/elements/market/FinishedOrder'
import Icon from 'app/components/elements/Icon'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import MarketPair from 'app/components/elements/market/MarketPair'
import { normalizeAssets, DEFAULT_EXPIRE, generateOrderID,
        calcFeeForSell, calcFeeForBuy } from 'app/utils/market/utils'
import transaction from 'app/redux/Transaction'

class ConvertAssets extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            loading: true,
            myBalance: Asset(0, 3, 'GOLOS'),
            sellAmount: AssetEditor(0, 3, 'GOLOS'),
            sellError: '',
            buyAmount: AssetEditor(0, 3, 'GBG'), // not includes fee
            fee: Asset(0, 3, 'GBG'),
            warning: '',
            cmcPrice: {}
        }
    }

    sellSym = () => this.state.sellAmount.asset.symbol
    buySym = () => this.state.buyAmount.asset.symbol

    async componentDidMount() {
        let assetsRaw
        try {
            assetsRaw = await api.getAssetsAsync('', [], '', 5000, 'by_marketed')
        } catch (err) {
            console.error(err)
            return
        }
        let assets = {}
        for (const i in assetsRaw) {
            const asset = assetsRaw[i]
            assets[asset.supply.split(" ")[1]] = asset
        }
        let assetsNorm = normalizeAssets(assets)
        this.setState({
            loading: false,
            assets: assetsNorm
        })
    }

    getBalance = async (sym1, asset1) => {
        const { currentAccount } = this.props
        let myBalance = this.state.myBalance
        if (sym1 === 'GOLOS') {
            myBalance = Asset(currentAccount.get('balance'))
        } else if (sym1 === 'GBG') {
            myBalance = Asset(currentAccount.get('sbd_balance'))
        } else {
            const res = await api.getAccountsBalances([currentAccount.get('name')])
            myBalance = res[0][sym1] ? Asset(res[0][sym1].balance) : Asset(0, asset1.precision, sym1)
        }
        return myBalance
    }

    initOrders = async (sym1, sym2) => {
        const now = Date.now()
        if (!this.ordersUpdated || now - this.ordersUpdated > 3000) {
            this.orders = await api.getOrderBookExtendedAsync(500, [sym1, sym2])
            this.ordersUpdated = now
        }
    }

    normalizeOrder = (order, sym1, sym2, prec1, prec2) => {
        if (!order.asset1.symbol)
            order.asset1 = Asset(order.asset1, prec1, sym1)
        if (!order.asset2.symbol)
            order.asset2 = Asset(order.asset2, prec1, sym2)
        if (!order._price)
            order._price = Price(order.order_price)
    }

    calculate = async (sellAmount, buyAmount, myBalance, isSell = true) => {
        let res = isSell ? buyAmount.clone() : sellAmount.clone()
        res.amount = 0
        let req = isSell ? sellAmount.clone() : buyAmount.clone()

        await this.initOrders(sellAmount.symbol, buyAmount.symbol)

        this.limitPrice = null
        this.bestPrice = null

        let orders = this.orders.bids
        if (!orders.length) {
            this.setState({
                warning: tt('convert_assets_jsx.no_orders_DIRECTION', {
                    DIRECTION: sellAmount.symbol + '/' + buyAmount.symbol
                })
            })
            return null
        }

        let warning = ''

        if (!req.amount) {
            this.setState({ warning })
            return res
        }

        for (let i = 0; i < orders.length; ++i) {
            const order = orders[i]
            this.normalizeOrder(order, sellAmount.symbol, buyAmount.symbol, sellAmount.precision, buyAmount.precision)

            const orderAmount = isSell ? order.asset1 : order.asset2

            const amount = req.min(orderAmount)
            let amount2 = amount.mul(order._price)
            res = res.plus(amount2)

            this.bestPrice = this.bestPrice || order._price.clone()
            this.limitPrice = order._price.clone()

            req = req.minus(orderAmount)

            if (req.amount <= 0) {
                req.amount = 0
                break
            }
        }

        if (res.amount == 0) {
            res.amount = 1
            warning = tt('convert_assets_jsx.too_low_amount')
        } else if (!isSell && res.gt(myBalance)) {
            res.amount = myBalance.amount
            this.limitPrice = Price(req, res)
            warning = tt('convert_assets_jsx.too_big_price')
        } else if (req.amount > 0) {
            warning = {
                a1: (isSell ? sellAmount : buyAmount).minus(req).floatString,
                a2: res.floatString,
                remain: req.floatString,
                isSell
            }
            if (!isSell) {
                res = res.plus(req.mul(this.bestPrice))
            }
        }

        this.setState({ warning })

        return res
    }

    onPairChange = async ({ event, sym1, asset1, sym2, asset2 }) => {
        if (event) {
            event.preventDefault()
        }
        if (this.state.canceled) {
            this.setState({ canceled: false })
            return
        }
        let buyAmount = Asset(0, asset2.precision, sym2)
        const myBalance = await this.getBalance(sym1, asset1)

        let sellAmount = myBalance.clone()

        this.ordersUpdated = null

        let fee = buyAmount.clone()
        fee.amount = 0
        let calcBuy = await this.calculate(sellAmount, buyAmount, myBalance)
        if (calcBuy) {
            let calc = calcFeeForSell(calcBuy, this.state.assets[sym2].fee_percent)
            calcBuy = calc.clearBuy
            fee = calc.fee
        }

        this.setState({
            myBalance,
            sellAmount: AssetEditor(sellAmount),
            sellError: '',
            buyAmount: AssetEditor(calcBuy || buyAmount),
            fee,
        })
    }

    sellAmountUpdated = async () => {
        const { sellAmount, buyAmount, myBalance, assets } = this.state
        let newBuy = await this.calculate(sellAmount.asset, buyAmount.asset, myBalance)
        if (newBuy) {
            let calc = calcFeeForSell(newBuy, assets[buyAmount.asset.symbol].fee_percent)
            newBuy = calc.clearBuy
            this.setState({
                buyAmount: AssetEditor(newBuy),
                fee: calc.fee
            })
        }
    }

    assetBalanceClick = e => {
        e.preventDefault()
        const { myBalance } = this.state
        this.setState({
            sellAmount: AssetEditor(myBalance),
            sellError: ''
        }, () => {
            this.sellAmountUpdated()
        })
    }

    onSellAmountChange = (e) => {
        let newAmount = this.state.sellAmount.withChange(e.target.value)
        if (newAmount.hasChange && newAmount.asset.amount >= 0) {
            let sellError = ''
            if (newAmount.asset.gt(this.state.myBalance)) {
                sellError = tt('transfer_jsx.insufficient_funds')
            }
            this.setState({
                sellAmount: newAmount,
                sellError
            }, () => {
                this.sellAmountUpdated()
            })
        }
    }

    onBuyAmountChange = async (e) => {
        let newAmount = this.state.buyAmount.withChange(e.target.value)
        if (newAmount.hasChange && newAmount.asset.amount >= 0) {
            this.setState({
                buyAmount: newAmount,
            })

            const { sellAmount, myBalance, assets } = this.state
            let calc = calcFeeForBuy(newAmount.asset, assets[newAmount.asset.symbol].fee_percent)

            let newSell = await this.calculate(sellAmount.asset, calc.buyWF, myBalance, false)
            if (newSell) {
                this.setState({
                    sellAmount: AssetEditor(newSell),
                })
            }
            this.setState({
                fee: calc.fee
            })
        }
    }

    submit = (e) => {
        e.preventDefault()
        const {
            sellAmount: { asset: sellAmount },
            buyAmount: { asset: buyAmount }
        } = this.state
        let minToReceive
        let confirm
        if (this.limitPrice) {
            minToReceive = sellAmount.mul(this.limitPrice)

            let possible = sellAmount.mul(this.bestPrice)
            if (possible.minus(possible.mul(3000).div(10000)).gt(buyAmount)) {
                confirm = tt('convert_assets_jsx.price_warning')
            }
        } else {
            minToReceive = this.state.buyAmount.asset
        }

        this.setState({ loading: true })

        const { currentAccount } = this.props
        this.props.placeOrder(currentAccount.get('name'),
            sellAmount, minToReceive, confirm, async (orderid) => {
            await new Promise(resolve => setTimeout(resolve, 4000))
            const orders = await api.getOpenOrdersAsync(currentAccount.get('name'),
                [sellAmount.symbol, minToReceive.symbol])
            let found
            for (let order of orders){
                if (order.orderid === orderid) {
                    found = order
                    break
                }
            }
            const newState = { loading: false, finishedAcc: currentAccount.get('name') }
            if (!found) {
                this.setState({
                    ...newState,
                    finished: 'full',
                })
            } else if (found.asset1 === found.sell_price.base && found.asset2 === found.sell_price.quote) {
                this.setState({
                    ...newState,
                    finished: 'not'
                })
            } else {
                this.setState({
                    ...newState,
                    finished: 'partly',
                    remainToReceive: Asset(found.sell_price.base)
                })
            }
        }, () => {
            this.setState({ loading: false, canceled: true })
        })
    }

    _renderDescription() {
        const { modal } = this.props
        const delimiter = modal ? ' ' : <br />
        const lines =  tt('convert_assets_jsx.description')
            .reduce((prev, curr) => [prev, delimiter, curr])
        const width = modal ? ((this.sellSym().length + this.buySym().length) > 11 ? '30%' : '40%') : '50%'
        return (<span className={'secondary ConvertAssets__description'} style={{ width }} >
                {lines}
            </span>)
    }

    _renderPrice() {
        const { sellAmount: {asset: sellAmount }, buyAmount: {asset: buyAmount } } = this.state

        if (sellAmount.amount == 0 || buyAmount.amount == 0) {
            return null
        }

        let res = (parseFloat(buyAmount.amountFloat) / parseFloat(sellAmount.amountFloat)).toString()
        const dot = res.indexOf(res)
        if (dot != -1) {
            res = res.substring(0, dot + 9)
        }

        return <div style={{ marginTop: '0.25rem' }}>
                    {tt('convert_assets_jsx.price')} {'1 ' + sellAmount.symbol}:<br/>
                    <b>{' ~' + res + ' ' + buyAmount.symbol}</b>
                </div>
    }

    _renderFields() {
        const { direction } = this.props
        const { myBalance, sellAmount, sellError, buyAmount } = this.state
        const fieldSell = (<React.Fragment>
                <div style={{ marginTop: '1.25rem' }}>
                    {tt('convert_assets_jsx.sell_amount')}
                    <div className='input-group'>
                        <input type='text' value={sellAmount.amountStr} onChange={this.onSellAmountChange} />
                        <span className='input-group-label uppercase'>{this.sellSym()}</span>
                    </div>
                </div>
                <AssetBalance balanceValue={myBalance.toString()} onClick={this.assetBalanceClick} />
                {sellError ? <div className='error'>{sellError}</div> : null}
                {this._renderPrice()}
            </React.Fragment>)
        const fieldBuy = (<React.Fragment>
                <div style={{ marginTop: '1.25rem' }}>
                    {tt('convert_assets_jsx.buy_amount')}
                    <div className='input-group'>
                        <input type='text' value={buyAmount.amountStr} onChange={this.onBuyAmountChange} />
                        <span className='input-group-label uppercase'>{this.buySym()}</span>
                    </div>
                </div>
                <CMCValue
                    buyAmount={buyAmount.asset}
                    renderer={cmc => <div>{tt('convert_assets_jsx.coinmarketcap_value')}{cmc}</div>}
                    />
                {this._renderFee()}
            </React.Fragment>)
        return (<div className='row'>
                    <div className='column small-6' style={{ paddingLeft: '0rem' }}>
                        {fieldSell}
                    </div>
                    <div className='column small-6' style={{ paddingRight: '0rem' }}>
                        {fieldBuy}
                    </div>
            </div>)
    }

    _renderFee() {
        const { buyAmount, fee, assets } = this.state
        const { fee_percent } = assets[buyAmount.asset.symbol]

        let feeStr = fee.floatString

        const buyWF = buyAmount.asset.plus(fee)

        return (<div>
                <small style={{ marginTop: '0.25rem' }}>
                    {tt('g.fee') + ': '}
                    <b>{feeStr}</b>
                    {fee_percent > 0 ? <span>{' (' + (fee_percent / 100) + '%)'}</span> : null}
                </small>
                {fee.amount > 0 ? <small style={{ marginTop: '0.25rem' }}><br/>
                    {tt('convert_assets_jsx.amount_with_fee') + ' '}
                    {buyWF.amountFloat}
                </small> : null}
            </div>)
    }

    _renderWarning() {
        const { warning } = this.state
        if (!warning) {
            return null
        }
        let children = warning
        if (warning.a1) {
            const { a1, a2, remain, isSell } = warning
            children = [
                <span>{tt('convert_assets_jsx.too_much_amount1')}</span>,
                <b>{a1}</b>,
                <span>{isSell ? tt('convert_assets_jsx.too_much_amount2') : tt('convert_assets_jsx.too_much_amount2a')}</span>,
                <b>{a2}</b>,
                <span>{tt('convert_assets_jsx.too_much_amount3')}</span>,
                <span>{remain}</span>,
                <span>{tt('convert_assets_jsx.too_much_amount4')}</span>
            ]
        }
        return (<div className='callout' style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                {children}
                &nbsp;
                <Icon name='info_o' title={tt('convert_assets_jsx.order_can_be_canceled')} />
            </div>)
    }

    render() {
        const { direction } = this.props
        const { loading, finished, assets, isSubmitting, sellAmount, sellError, buyAmount, warning } = this.state
        if (loading) {
            return (<center>
                <LoadingIndicator type='circle' size='25px' />
            </center>)
        }
        if (finished) {
            const { finishedAcc, remainToReceive } = this.state
            return <FinishedOrder finished={finished}
                finishedAcc={finishedAcc}
                buyAmount={buyAmount.asset} sellAmount={sellAmount.asset}
                remainToReceive={remainToReceive} />
        }
        const disabled = isSubmitting || !sellAmount.asset.amount || !buyAmount.asset.amount || sellError
        return (<div className='ConvertAssets'>
            <h3>{tt('g.convert_assets')}</h3>
            <div>
                <MarketPair assets={assets} itemsPerPage={8}
                    sym1={this.props.sellSym}
                    sym2={this.props.buySym}
                    label1={tt('convert_assets_jsx.sell')}
                    label2={tt('convert_assets_jsx.buy')}
                    onChange={this.onPairChange} />
                {this._renderDescription()}
            </div>
            {this._renderFields()}
            {this._renderWarning()}
            <div style={{ marginTop: '1.25rem' }}>
                <button onClick={this.submit} className='button' disabled={disabled}>
                    {direction === 'sell' ? tt('g.sell') : tt('g.buy')}
                </button>
                <a href={'/market/' + this.sellSym() + '/' + this.buySym()} className='MarketLink float-right'
                        style={{ paddingTop: '0.3rem', paddingRight: '0.1rem' }}>
                    <Icon name='trade' size='1_5x' />
                    <span style={{ verticalAlign: 'middle', marginLeft: '0.4rem' }}>
                        {tt('filled_orders_jsx.open_market')}
                    </span>
                </a>
            </div>
        </div>)
    }
}

export default connect(
    (state, ownProps) => {
        const defaults = state.user.get('convert_assets_defaults', Map()).toJS();

        const currentUser = state.user.getIn(['current'])
        const currentAccount = currentUser && state.global.getIn(['accounts', currentUser.get('username')])

        return {
            ...ownProps,
            sellSym: defaults.sellSym || undefined,
            buySym: defaults.buySym || undefined,
            direction: defaults.direction || undefined,
            currentAccount,
        };
    },
    dispatch => ({
        placeOrder: (
                owner, amountToSell, minToReceive, confirm, successCallback, errorCallback
            ) => {
            const orderid = generateOrderID()

            const operation = {
                owner,
                amount_to_sell: amountToSell,
                min_to_receive: minToReceive,
                fill_or_kill: false,
                expiration: DEFAULT_EXPIRE,
                orderid,
            }

            dispatch(
                transaction.actions.broadcastOperation({
                    type: 'limit_order_create',
                    operation,
                    confirm,
                    successCallback: () => {
                        let pathname = window.location.pathname
                        dispatch({type: 'FETCH_STATE', payload: {pathname}})
                        successCallback(orderid)
                    },
                    errorCallback: () => {
                        errorCallback()
                    }
                })
            )
        },
        showOpenOrders: defaults => {
            dispatch(user.actions.setOpenOrdersDefaults(defaults))
            dispatch(user.actions.showOpenOrders())
            dispatch(user.actions.hideConvertAssets())
        },
    })
)(ConvertAssets)
