import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import tt from 'counterpart'

import user from 'app/redux/User'
import Icon from 'app/components/elements/Icon'

const MemoInput = (props) => {
    const {
        loginMemo,
        name,
        value,
        onChange,
        onBlur,
        isEncrypted,
        currentUser,
        initial,
        prefix,
        disabled,
        onToggleEncrypted,
        compact,
        ...rest
    } = props

    const [autoToggleEncrypt, setAutoToggleEncrypt] = useState(false)

    useEffect(() => {
        if (autoToggleEncrypt) {
            if (toggleMemoEncryption(true)) {
                setAutoToggleEncrypt(false)
            }
        }
    }, [autoToggleEncrypt])

    const toggleMemoEncryption = (autoCall = false) => {
        let memo = value
        if (!isEncrypted) {
            const memoPrivate = currentUser ?
                currentUser.private_keys && currentUser.private_keys.memo_private : null
            if (!memoPrivate) {
                if (currentUser && (!autoToggleEncrypt || !autoCall)) {
                    loginMemo(currentUser)
                    setAutoToggleEncrypt(true)
                }
                return false
            }

            if (/^#/.test(memo)) {
                memo = memo.replace('#', '')
                if (memo[0]) memo = memo.substring(1)
            }
        }
        if (onToggleEncrypted) {
            onToggleEncrypted(!isEncrypted, memo)
        }
        return true
    }

    const renderLock = () => {
        return (
            <span
                class='input-group-label'
                style={{ cursor: 'pointer' }}
                title={isEncrypted ? tt('transfer_jsx.memo_unlock') : tt('transfer_jsx.memo_lock')}
                onClick={() => toggleMemoEncryption()}
            >
                <Icon name={isEncrypted ? 'ionicons/lock-closed-outline' : 'ionicons/lock-open-outline'} />
            </span>
        )
    }

    const isObsolete = /^#/.test(value)
    const hint = isObsolete ?
        tt('transfer_jsx.public_obsolete') :
        (isEncrypted ?
            tt('transfer_jsx.memo_locked') :
            tt('transfer_jsx.public'))

    let input = (
        <input
            type="text"
            {...rest}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={compact ? hint : (initial || tt('transfer_jsx.memo_placeholder'))}
            autoComplete="on"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            disabled={disabled}
            className={(prefix ? 'input-group-field' : '') +
                (!isObsolete ?
                    (isEncrypted ?
                        ' Transfer__encrypted' :
                        '')
                    : ' Transfer__wrong-encrypt')}
        />
    )

    const lock = renderLock()
    input = (
        <div className='input-group'>
            {prefix ? <span class='input-group-label'>{prefix}</span> : null}
            {input}
            {lock}
        </div>
    )

    return (
        <div>
            {compact ? null : <small>{hint}</small>}
            {input}
        </div>
    )
}

MemoInput.propTypes = {
    loginMemo: PropTypes.func.isRequired,
    name: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    onBlur: PropTypes.func.isRequired,
    isEncrypted: PropTypes.bool,
    currentUser: PropTypes.object.isRequired,
    initial: PropTypes.string,
    prefix: PropTypes.string,
    disabled: PropTypes.bool,
    onToggleEncrypted: PropTypes.func.isRequired,
    compact: PropTypes.bool,
}

export default connect(
    (state, ownProps) => {
        return { ...ownProps }
    },
    (dispatch) => ({
        loginMemo: (currentUser) => {
            if (!currentUser) return
            dispatch(user.actions.showLogin({
                loginDefault: { username: currentUser.username, authType: 'memo', unclosable: false }
            }))
        },
    })
)(MemoInput)
