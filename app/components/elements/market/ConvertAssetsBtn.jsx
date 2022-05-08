import React from 'react'
import PropTypes from 'prop-types'
import tt from 'counterpart'
import { connect } from 'react-redux'

import Icon from 'app/components/elements/Icon'
import user from 'app/redux/User'

class ConvertAssetsBtn extends React.Component {
    static propTypes = {
        sym: PropTypes.string.isRequired,
        disabled: PropTypes.bool,
        direction: PropTypes.string,
    }

    static defaultProps = {
        direction: 'sell',
    }

    onClick = (e) => {
        e.preventDefault()
        const { direction, disabled, showModal, sym } = this.props
        if (!disabled) {
            let opts = { direction }
            if (direction === 'sell') {
                opts.sellSym = sym
            } else {
                opts.buySym = sym
            }
            showModal(opts)
        }
    }

    render() {
        const { disabled } = this.props
        const title = disabled ? tt('convert_assets_jsx.no_tradables') : tt('g.convert_assets')
        return (<span className={'ConvertAssetsBtn' + (disabled ? ' disabled' : '')}
                    title={title} onClick={this.onClick}>
                <Icon name='sorting' />
            </span>)
    }
}

export default connect(
    (state, ownProps) => {
        return {
            ...ownProps,
        }
    },

    (dispatch) => ({
        showModal: (opts) => {
            dispatch(user.actions.setConvertAssetsDefaults(opts))
            dispatch(user.actions.showConvertAssets())
        },
    })
)(ConvertAssetsBtn)
