/* eslint react/prop-types: 0 */
import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import user from 'app/redux/User'
import g from 'app/redux/GlobalReducer'
import ShowKey from 'app/components/elements/ShowKey'
import tt from 'counterpart';

class Keys extends Component {
    static propTypes = {
        // HTML
        account: PropTypes.object.isRequired,
        authType: PropTypes.oneOf(['posting', 'active', 'owner', 'memo']),
    }
    constructor() {
        super()
        this.state = {}
    }
    shouldComponentUpdate(nextProps, nextState) {
        return this.props.auth !== nextProps.auth ||
            this.props.authType !== nextProps.authType ||
            this.props.authLogin !== nextProps.authLogin ||
            this.props.account !== nextProps.account ||
            this.state !== nextState
    }
    showChangePassword = (pubkey) => {
        const {account, authType} = this.props
        this.props.showChangePassword(account.name, authType, pubkey)
    }
    render() {
        const {
            props: {account, authType, privateKeys, onKey},
        } = this
        let pubkeys
        if (authType === 'memo') {
            pubkeys = [account.memo_key]
        } else {
            const authority = account[authType]
            const authorities = authority.key_auths
            pubkeys = authorities.map(a => a[0])
        }
        const rowClass = 'hoverBackground'
        let idx = 0
        const auths = pubkeys.map(pubkey => (
            <div key={idx++}>
                <div className="row">
                    <div className="column small-12">
                        <span className={rowClass}>
                            <ShowKey pubkey={pubkey}
                                privateKey={privateKeys[authType + '_private']}
                                cmpProps={{className: rowClass}} authType={authType} accountName={account.name}
                                onKey={onKey}>
                                {/*<span onClick={() => this.showChangePassword(pubkey)}>&nbsp;{edit}</span>*/}
                            </ShowKey>
                        </span>
                    </div>
                </div>
            </div>
        ))
        return (
            <span>
                <div className="row">
                    <div className="column small-12">
                        <label>{tt('g.' + authType.toLowerCase())}</label>
                        {auths}
                    </div>
                </div>
            </span>
        )
    }
}

const emptyKeys = {}

export default connect(
    (state, ownProps) => {
        const {account} = ownProps
        const accountName = account.name
        const current = state.user.current
        const username = current && current.username
        const isMyAccount = username === accountName
        const authLogin = isMyAccount ? {username, password: current.password} : null
        let privateKeys
        if (current)
            privateKeys = current.private_keys // not bound to one account

        if(!privateKeys)
            privateKeys = emptyKeys

        const auth = state.user.authority && state.user.authority[accountName]
        return {...ownProps, auth, authLogin, privateKeys}
    },
    dispatch => ({
        showChangePassword: (username, authType, priorAuthKey) => {
            const name = 'changePassword'
            dispatch(g.actions.remove({key: name}))
            dispatch(g.actions.showDialog({name, params: {username, authType, priorAuthKey}}))
        },
    })
)(Keys)
