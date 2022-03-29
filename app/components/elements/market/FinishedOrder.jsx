import React from 'react'
import tt from 'counterpart'
import { connect, } from 'react-redux'

import user from 'app/redux/User'

class FinishedOrder extends React.Component {
    render() {
        const { finished, finishedAcc, buyAmount, sellAmount, remainToReceive } = this.props
        const path = buyAmount.isUIA ? 'assets' : 'transfers'
        const link = <a href={`/@${finishedAcc}/${path}`}>
            {tt('convert_assets_jsx.finished_balance')}
        </a>
        const goCancel = (e) => {
            e.preventDefault()
            this.props.showOpenOrders({ sym: sellAmount.symbol })
        }
        const cancelLink = <a href='#' onClick={goCancel}>{tt('convert_assets_jsx.partly_link')}</a>

        if (finished === 'full') {
            return (<div className='ConvertAssets'>
                    <h3>{tt('convert_assets_jsx.finished')}</h3>
                    <div>
                        {tt('convert_assets_jsx.finished_desc')}
                        {link}.
                    </div>
                </div>)
        } else if (finished === 'not') {
            return (<div className='ConvertAssets'>
                    <h3>{tt('convert_assets_jsx.not')}</h3>
                    <div>
                        {tt('convert_assets_jsx.not_desc')}
                        {cancelLink}.
                    </div>
                </div>)
        } else {
            return (<div className='ConvertAssets'>
                    <h3>{tt('convert_assets_jsx.partly')}</h3>
                    <div>
                        {tt('convert_assets_jsx.partly_desc')}
                        {remainToReceive.floatString}
                        {tt('convert_assets_jsx.partly_desc2')}
                        {cancelLink}.
                        {tt('convert_assets_jsx.partly_desc3')}
                        {link}.
                    </div>
                </div>)
        }
    }
}

export default connect(
    null,
    dispatch => ({
        showOpenOrders: defaults => {
            dispatch(user.actions.setOpenOrdersDefaults(defaults))
            dispatch(user.actions.showOpenOrders())
            dispatch(user.actions.hideConvertAssets())
        },
    })
)(FinishedOrder)
