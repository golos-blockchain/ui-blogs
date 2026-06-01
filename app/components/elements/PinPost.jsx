import React from 'react';
import PropTypes from 'prop-types'
import {connect} from 'react-redux';
import { getMetadataReliably, getPinnedPosts } from 'app/utils/NormalizeProfile'
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate'
import transaction from 'app/redux/Transaction';
import user from 'app/redux/User';
import app from 'app/redux/AppReducer';
import Icon from 'app/components/elements/Icon';
import tt from 'counterpart';


const {string, func, object} = PropTypes

export default class PinPost extends React.Component {
    static propTypes = {
        account: object,
        current_user: object,
        author: string,
        permlink: string,
        pinned: func,
        updateAccount: func,
        notify: PropTypes.func,
    }
    constructor(props) {
        super(props)
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'PinPost')
        this.state = {active: false, loading: false}
    }

    pin = (e) => {
      e.preventDefault()
      const { permlink, current_user, author, updateAccount, notify } = this.props

      if (!current_user || author !== current_user.name) return;

      const account = this.props.account
      let pinnedPosts = getPinnedPosts(account, true)
      const link = author + '/' + permlink

      let metadata = getMetadataReliably(account.json_metadata);

      if(this.state.active) {
        pinnedPosts = pinnedPosts.filter(pinnedLink => pinnedLink !== link);
      } else {
        pinnedPosts.push(link);
      }

      metadata.pinnedPosts = pinnedPosts;

      this.setState({ loading: true, })
      updateAccount({
          json_metadata: JSON.stringify(metadata),
          account: account.name,
          errorCallback: (err) => {
              this.setState({ loading: false, });
              if (e !== 'Canceled') {
                  notify(tt('g.server_returned_error'), 10000);
                  console.log('updateAccount ERROR', err);
              }
          },
          successCallback: () => {
              this.setState({ active: !this.state.active, loading: false, });

              //this.props.pinned(this.props.author + '/' + this.props.permlink);
              notify(tt('g.saved') + '!', 10000);
          },
      });
    }

    render() {
        const {account, current_user, permlink, author} = this.props

        if(!author || !account) return null;

        if(account) {
          const pinnedPosts = getPinnedPosts(account, true)

          const link = author + '/' + permlink

          this.setState({active: pinnedPosts.includes(link)})
        }

        if (!current_user && !this.state.active) return null;

        if (!this.state.active && author !== current_user.name) return null;

        const state = this.state.active ? 'active' : 'inactive'

        const loading = this.state.loading ? ' loading' : ''
        return (
          <span className={'Reblog__button PinPost__button-'+ state + loading}>
            <a href="#" onClick={this.pin} title={this.state.active ? 'Пост закреплён в блоге автора' : 'Закрепить пост в блоге'}>
              <Icon name="pin" />
            </a>
          </span>
        )
    }
}
module.exports = connect(
    (state, ownProps) => {
        const current_user = state.user.current && state.user.current.username
        const accounts = state.global.accounts || {}
        const account = accounts[ownProps.author] || null

        return {...ownProps, account, current_user: accounts[current_user] || null}
    },

    dispatch => ({
        updateAccount: ({ successCallback, errorCallback, ...operation }) => {
            dispatch(
                transaction.actions.broadcastOperation({
                    type: 'account_metadata',
                    operation,
                    successCallback() {
                        dispatch({type: 'FETCH_STATE', payload: {pathname: `@${operation.account}/blog`}})
                        dispatch(user.actions.getAccount());
                        successCallback();
                    },
                    errorCallback,
                })
            );
        },

        notify: (message, dismiss = 3000) => {
            dispatch(app.actions.addNotification({
                    key: 'settings_' + Date.now(),
                    message,
                    dismissAfter: dismiss,
            }));
        },
    })
)(PinPost)
