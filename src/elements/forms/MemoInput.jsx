import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import tt from 'counterpart'

import user from 'app/redux/User'
import Icon from 'app/components/elements/Icon'

class MemoInput extends React.Component {
    static propTypes = {
        // redux
        loginMemo: PropTypes.func.isRequired,
        // formik
        name: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
        onChange: PropTypes.func.isRequired,
        onBlur: PropTypes.func.isRequired,
        // own
        isEncrypted: PropTypes.bool,
        currentUser: PropTypes.object.isRequired,
        initial: PropTypes.string,
        prefix: PropTypes.string,
        disabled: PropTypes.bool,
        onToggleEncrypted: PropTypes.func.isRequired,
        compact: PropTypes.bool,
    }

    _getProps() {
        const { initial, prefix, disabled, currentUser, loginMemo, isEncrypted, onToggleEncrypted, compact,
            ...rest } = this.props
        return {
            initial, prefix, disabled, currentUser, loginMemo, isEncrypted, onToggleEncrypted, compact,
            inputProps: {...rest} 
        }
    }

    state = {
    }

    componentDidUpdate(prevProps) {
        if (this.autoToggleEncrypt) {
            if (this.toggleMemoEncryption(true)) {
               this.autoToggleEncrypt = false
            }
        }
    }

    toggleMemoEncryption = (autoCall = false) => {
        const { currentUser, loginMemo, inputProps, isEncrypted, onToggleEncrypted } = this._getProps()
        let memo = inputProps.value
        if (!isEncrypted) {
            const memoPrivate = currentUser ?
                currentUser.getIn(['private_keys', 'memo_private']) : null
            if (!memoPrivate) {
                if (currentUser && (!this.autoToggleEncrypt || !autoCall)) {
                    loginMemo(currentUser)
                    this.autoToggleEncrypt = true
                }
                return false;
            }

            if (/^#/.test(memo)) {
                memo = memo.replace('#', '');
                if (memo[0]) memo = memo.substring(1)
            }
        }
        if (onToggleEncrypted) {
            onToggleEncrypted(!isEncrypted, memo)
        }
        return true
    }

    _renderLock() {
        const { isEncrypted } = this._getProps()
        return (<span class='input-group-label' style={{ cursor: 'pointer', }}
            title={isEncrypted ? tt('transfer_jsx.memo_unlock') : tt('transfer_jsx.memo_lock')}
            onClick={e => this.toggleMemoEncryption()}>
            <Icon name={isEncrypted ? 'ionicons/lock-closed-outline' : 'ionicons/lock-open-outline'} />
        </span>)
    }

    render() {
        const { initial, prefix, disabled, inputProps, isEncrypted, compact } = this._getProps()
        const isObsolete = /^#/.test(inputProps.value)

        const hint = isObsolete ?
            tt('transfer_jsx.public_obsolete') :
            (isEncrypted ?
            tt('transfer_jsx.memo_locked') :
            tt('transfer_jsx.public'))

        let input = (<input type="text"
            {...inputProps}
            placeholder={compact ? hint : (initial || tt('transfer_jsx.memo_placeholder'))}
            autoComplete="on" autoCorrect="off" autoCapitalize="off"
            spellCheck="false" disabled={disabled}
            className={(prefix ? 'input-group-field' : '') +
                    (!isObsolete ?
                        (isEncrypted ?
                        ' Transfer__encrypted' :
                        '')
                    : ' Transfer__wrong-encrypt')}
        />)

        const lock = this._renderLock()
        input = (<div className='input-group'>
                {prefix ? <span class='input-group-label'>
                    {prefix}
                </span> : null}
                {input}{lock}
            </div>)

        return (<div>
            {compact ? null : <small>
                {hint}
            </small>}
            {input}
        </div>)
    }
}

export default connect(
    (state, ownProps) => {
        return { ...ownProps }
    },
    dispatch => ({
        loginMemo: (currentUser) => {
            if (!currentUser) return;
            dispatch(user.actions.showLogin({
                loginDefault: { username: currentUser.get('username'), authType: 'memo', unclosable: false }
            }))
        },
    })
)(MemoInput)
