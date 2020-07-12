import React, {Component} from 'react'
import PropTypes from 'prop-types'
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate'
import g from 'app/redux/GlobalReducer'
import {connect} from 'react-redux';
import CreateInvite from 'app/components/elements/CreateInvite'
import ClaimInvite from 'app/components/elements/ClaimInvite'

class Invites extends Component {
    static propTypes = {
        // HTML
        account: PropTypes.object.isRequired,
    }

    constructor() {
        super()
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'Invites')
    }

    render() {
        const {account} = this.props

        return (<div>
            <CreateInvite account={account} />
            <ClaimInvite account={account} />
        </div>)
    }
}

export default connect(
    (state, ownProps) => {
        return {...ownProps}
    },
    dispatch => ({
    })
)(Invites)
