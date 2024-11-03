import React from 'react'
import {connect} from 'react-redux';
import { withRouter } from 'react-router'

import constants from 'app/redux/constants';
import Topics from 'app/components/modules/Topics'

class MiniTopics extends React.Component {
    loadSelected = (keys) => {
        let { router } = this.props
        let { accountname,
            category,
            order = constants.DEFAULT_SORT_ORDER,
        } = router.params
        if (category === 'feed') {
            accountname = order.slice(1);
            order = 'by_feed';
        }
        // if (isFetchingOrRecentlyUpdated(this.props.status, order, category)) return;
        this.props.requestData({ order, keys, });
    };

    render() {
        let { loggedIn, categories, router } = this.props
        let {category, order = constants.DEFAULT_SORT_ORDER} = router.params
        if (category === 'feed') {
            order = loggedIn ? 'created' : 'trending'
        }
        return <div className='MiniTopics_in-header' style={{ float: 'left' }}>
            <Topics
                categories={categories}
                order={order}
                current={category}
                loadSelected={this.loadSelected}
                compact
            />
        </div>
    }
}

module.exports = withRouter(connect(
    (state) => {
        return {
            categories: state.global.get('tag_idx'),
            loggedIn: !!state.user.get('current'),
        };
    },
    (dispatch) => {
        return {
            requestData: (args) => dispatch({ type: 'REQUEST_DATA', payload: args, }),
        };
    }
)(MiniTopics))
