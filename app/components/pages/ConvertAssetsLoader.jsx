import React from 'react'
import { connect, } from 'react-redux'
import tt from 'counterpart'

import ConvertAssets from 'app/components/modules/ConvertAssets'

class ConvertAssetsLoader extends React.Component {
    render() {
        const { currentAccount } = this.props
        if (!currentAccount) {
            return <div>{tt('convert_assets_jsx.please_authorize')}</div>
        }
        return (<div>
                <div style={{ padding: '1rem', maxWidth: '50rem', margin: 'auto' }}>
                    <ConvertAssets />
                </div>
            </div>)
    }
}

module.exports = {
    path: '/convert',
    component: connect(
        (state, ownProps) => {
            const currentUser = state.user.getIn(['current'])
            const currentAccount = currentUser && state.global.getIn(['accounts', currentUser.get('username')])

            return {
                currentAccount,
            }
        },
        dispatch => ({
        })
    )(ConvertAssetsLoader),
}
