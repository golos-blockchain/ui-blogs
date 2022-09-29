import React from 'react'
import tt from 'counterpart'

const AssetBalance = ({onClick, balanceValue, title}) => {
    let balance = (title || tt('transfer_jsx.balance')) + ': ' + balanceValue;
    if (onClick) {
        balance = (<a onClick={onClick} style={{
            borderBottom: '#A09F9F 1px dotted',
            cursor: 'pointer'
        }}>
            {balance}
        </a>);
    }
    return balance;
}

export default AssetBalance;
