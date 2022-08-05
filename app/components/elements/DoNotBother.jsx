import React from 'react'
import { connect } from 'react-redux'
import tt from 'counterpart'

import transaction from 'app/redux/Transaction'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'

class DoNotBother extends React.Component {
    state = {
        checked: false,
        submitting: false
    }

    componentDidMount() {
        const { account } = this.props
        if (account)
            this.setState({
                checked: account.do_not_bother
            })
    }

    onChange = (e) => {
        this.setState({ submitting: true })

        const checked = e.target.checked
        const { account, updateBlock } = this.props
        updateBlock(account.name, checked, () => {
            this.setState({ submitting: false, checked })
        }, (err) => {
            console.error(err)
            alert(err.message || err)
            this.setState({ submitting: false })
        })
    }

    render() {
        const { account } = this.props
        const { checked, submitting } = this.state
        return <div className="row">
            <div className="small-12 medium-8 large-6 columns">
                <br /><br />
                {submitting ? 
                <LoadingIndicator type='circle' /> :
                <div>
                    <h3>{tt('do_not_bother.title')}</h3>
                    <label>
                    <input type='checkbox' checked={checked} onChange={this.onChange} />
                        {tt('do_not_bother.desc')}
                    </label>
                </div>}
            </div>
        </div>
    }
}

export default DoNotBother

module.exports = connect(
    (state, ownProps) => ({
    }),
    dispatch => ({
        updateBlock: (blocker, do_not_bother, done, errorCallback) => {
            dispatch(transaction.actions.broadcastOperation({
                type: 'account_setup',
                operation: {
                    account: blocker,
                    settings: [
                        [1, {
                            do_not_bother
                        }]
                    ],
                    extensions: []
                },
                successCallback: done,
                errorCallback,
            }))
        },
    })
)(DoNotBother);
