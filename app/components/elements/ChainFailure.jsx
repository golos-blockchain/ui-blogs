import React from 'react'
import { connect } from 'react-redux'
import tt from 'counterpart'

import { APP_ICON, } from 'app/client_config'
import Icon from 'app/components/elements/Icon'

class ChainFailure extends React.Component {
    render() {
        const { chain_failure } = this.props
        if (chain_failure) {
            return (
                <div className="App__announcement row">
                    <div className="column">
                        <div align="center" className="callout alert" style={{backgroundColor: 'rgb(217, 0, 0)', color: 'white'}}>
                            <Icon className="logo-icon" name={APP_ICON} /> {tt('chain_failure_jsx.title')}
                        </div>
                    </div>
                </div>
            )
        }
        return null
    }
}

export default connect(
    (state, ownProps) => {
        return {
            chain_failure: state.global.get('chain_failure'),
        }
    },
    dispatch => ({
    })
)(ChainFailure)
