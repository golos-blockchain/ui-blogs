import React, { Component } from 'react';
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import transaction from 'app/redux/Transaction'
import tt from 'counterpart';

class ConfirmTransactionForm extends Component {

    static propTypes = {
        //Steemit
        onCancel: PropTypes.func,
        warning: PropTypes.string,
        // form
        confirm: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
        confirmBroadcastOperation: PropTypes.object,
        confirmErrorCallback: PropTypes.func,
        okClick: PropTypes.func,
    };
    onCancel = () => {
        const {confirmErrorCallback, onCancel} = this.props;
        if(confirmErrorCallback) confirmErrorCallback();
        if(onCancel) onCancel()
    }
    okClick = () => {
        const {okClick, confirmBroadcastOperation} = this.props
        okClick(confirmBroadcastOperation)
    }
    render() {
        const {onCancel, okClick} = this
        const {confirm, confirmBroadcastOperation, warning} = this.props
        const conf = typeof confirm === 'function' ? confirm() : confirm
        return (
           <div className="ConfirmTransactionForm">
               <h4>{typeName(confirmBroadcastOperation)}</h4>
               <hr />
               <div>{conf}</div>
               {warning ? <div style={{paddingTop: 10}} className="error">{warning}</div> : null}
               <br />
               <button className="button" onClick={okClick}>{tt('g.ok')}</button>
               <button type="button hollow" className="button hollow" onClick={onCancel}>{tt('g.cancel')}</button>
           </div>
       )
    }
}
const typeName = confirmBroadcastOperation => {
    const title = confirmBroadcastOperation.operation &&
        confirmBroadcastOperation.operation.__config &&
        confirmBroadcastOperation.operation.__config.title
    if(title) return title
    const type = confirmBroadcastOperation.type
    return tt('confirmtransactionform_jsx.confirm') + ' ' + (type.split('_').map(n => n.charAt(0).toUpperCase() + n.substring(1))).join(' ')
}

export default connect(
    // mapStateToProps
    (state) => {
        const confirmBroadcastOperation = state.transaction.confirmBroadcastOperation
        const confirmErrorCallback = state.transaction.confirmErrorCallback
        const confirm = state.transaction.confirm
        const warning = state.transaction.warning
        return {
            confirmBroadcastOperation,
            confirmErrorCallback,
            confirm,
            warning
        }
    },
    // mapDispatchToProps
    dispatch => ({
        okClick: (confirmBroadcastOperation) => {
            dispatch(transaction.actions.hideConfirm())
            dispatch(transaction.actions.broadcastOperation({...confirmBroadcastOperation}))
        }
    })
)(ConfirmTransactionForm)
