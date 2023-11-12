import React from 'react'
import { connect } from 'react-redux'
import { Map } from 'immutable'
import tt from 'counterpart'
import { Asset } from 'golos-lib-js/lib/utils'

import NFTSmallIcon from 'app/components/elements/nft/NFTSmallIcon'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import g from 'app/redux/GlobalReducer'
import transaction from 'app/redux/Transaction'
import { getAssetMeta } from 'app/utils/market/utils'
import { walletUrl } from 'app/utils/walletUtils'

class GiftNFT extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
        }
    }

    componentDidMount() {
        if (!this.props.nft_tokens) {
            this.props.fetchNFTTokens(this.props.currentUser)
        }
    }

    giftNFT = (e, token_id) => {
        e.preventDefault()
        const { currentUser, opts } = this.props
        this.setState({
            isSubmitting: true
        })
        this.props.giftNFT(currentUser, token_id, opts.author, opts.permlink, opts.is_comment, () => {
            this.props.onCancel()
        }, (err) => {
            console.error(err)
            const errorMessage = err.toString()
            this.setState({
                errorMessage: errorMessage !== 'Canceled' && errorMessage,
                isSubmitting: false
            })
        })
    }

    render() {
        const { nft_tokens, nft_assets, currentUser } = this.props

        const tokens = nft_tokens ? nft_tokens.toJS().data : []
        const assets = nft_assets ? nft_assets.toJS() : null

        const next_from = nft_tokens && nft_tokens.get('next_from')

        let items = []
        let count = 0
        for (const token of tokens) {
            const { json_metadata, image, token_id } = token

            let data
            if (json_metadata) {
                data = JSON.parse(json_metadata)
            }
            data = data || {} // node allows to use '', null, object, or array

            let last_price
            const last_buy_price = Asset(token.last_buy_price)
            if (last_buy_price.amount > 0) {
                const asset = assets[last_buy_price.symbol]
                let imageUrl
                if (asset) {
                    imageUrl = getAssetMeta(asset).image_url
                }
                last_price = <span title={last_buy_price.floatString}>
                    {imageUrl && <img className='price-icon' src={imageUrl} alt={''} />}
                    {last_buy_price.amountFloat}
                </span>
            }

            items.push(<tr key={count} title={tt('g.gift') + ' ' + data.title + ' (#' + token.token_id + ')'} className={count % 2 == 0 ? '' : 'zebra'} onClick={e => this.giftNFT(e, token_id)}>
                <td>
                    <NFTSmallIcon image={image} onClick={e => e.preventDefault()} />
                </td>
                <td>
                    {data.title}
                </td>
                <td>
                    {last_price}
                </td>
            </tr>)

            ++count
        }

        if (!nft_tokens) {
            items = <LoadingIndicator type='circle' />
        } else if (!items.length) {
            items = <div style={{ marginBottom: '1rem' }}>
                {tt('gift_nft.no_tokens')}
                {currentUser && <span>
                    <a href={walletUrl('/@' + currentUser.get('username') + '/nft-collections')} target='_blank' rel='noreferrer nofollow'>
                        {tt('gift_nft.issue')}
                    </a>
                    {tt('gift_nft.no_tokens2')}
                    <a href={walletUrl('/nft')} target='_blank' rel='noreferrer nofollow'>
                        {tt('gift_nft.buy')}
                    </a>
                    {tt('gift_nft.no_tokens3')}
                </span>}
            </div>
        } else {
            items = <table><tbody>
                {items}
            </tbody></table>
        }

        const { isSubmitting, errorMessage } = this.state

        return <div className='GiftNFT'>
            <div className='row'>
                <h3>{tt('transfer_jsx.gift_nft')}</h3>
            </div>
            {items}
            {next_from ? <div className='load-more' key='load_more'>
                <center><button className='button hollow small' onClick={
                    e => this.props.fetchNFTTokens(currentUser, next_from)
                }>{tt('g.load_more')}</button></center>
            </div> : null}
            {errorMessage && <div className='error'>
                {errorMessage}
            </div>}
            {isSubmitting ? <span><LoadingIndicator type='circle' /><br /></span>
            : <span>
                <button className='button hollow' onClick={this.props.onCancel}>
                    {tt('g.cancel')}
                </button>
            </span>}
        </div>
    }
}

export default connect(
    (state, ownProps) => {
        const opts = state.user.get('gift_nft_defaults', Map()).toJS()

        const currentUser = state.user.getIn(['current'])
        const currentAccount = currentUser && state.global.getIn(['accounts', currentUser.get('username')])

        return { ...ownProps,
            currentUser,
            currentAccount,
            opts,
            nft_tokens: state.global.get('nft_tokens'),
            nft_assets: state.global.get('nft_assets'),
        }
    },
    dispatch => ({
        fetchNFTTokens: (currentUser, start_token_id = 0) => {
            if (!currentUser) return
            const account = currentUser.get('username')
            dispatch(g.actions.fetchNftTokens({ account, start_token_id }))
        },
        giftNFT: (currentUser, token_id, to, permlink, is_comment, successCallback, errorCallback) => {
            const username = currentUser.get('username')
            const operation = {
                from: username,
                to,
                token_id,
                memo: (is_comment ? 'Comment' : 'Post') + ': @' + to + '/' + permlink
            }

            dispatch(transaction.actions.broadcastOperation({
                type: 'nft_transfer',
                username,
                operation,
                successCallback,
                errorCallback
            }))
        }
    })
)(GiftNFT)
