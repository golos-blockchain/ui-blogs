import React from 'react';
import { Link } from 'react-router-dom';
import Follow from 'app/components/elements/Follow';

class UserListRow extends React.Component {
    render() {
        const {user, loggedIn, muteOnlyNew} = this.props
        return(
            <tr>
                {loggedIn && <td width="250">
                    {muteOnlyNew ? <Follow following={user} showMuteInNew={true} showMute={false} showFollow={false} /> : <Follow following={user} />}
                </td>}
                <td>
                    <Link to={'/@' + user}><strong>{user}</strong></Link>
                </td>
            </tr>
        );
    }
}

import {connect} from 'react-redux'
export default connect(
    (state, ownProps) => {
        const loggedIn = state.user.hasIn(['current', 'username'])
        return {
            ...ownProps,
            loggedIn
        }
    },
)(UserListRow)
