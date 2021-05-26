import React from 'react';
import PropTypes from 'prop-types'
import {connect} from 'react-redux';
import { getMetadataReliably, getMutedInNew } from 'app/utils/NormalizeProfile'
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate'
import transaction from 'app/redux/Transaction';
import user from 'app/redux/User';
import Icon from 'app/components/elements/Icon';
import tt from 'counterpart';


const {string, func, object} = PropTypes

export default class MuteAuthorInNew extends React.Component {
    static propTypes = {
        current_user: object,
        author: string,
        updateAccount: func,
    }
    constructor(props) {
        super(props)
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'MuteAuthorInNew')
        this.state = {loading: false}
    }

    block = (e) => {
      e.preventDefault()
      const { author, updateAccount, notify } = this.props

      if (!this.props.current_user) return;

      const current_user = this.props.current_user.toJS()
      let mutedInNew = getMutedInNew(current_user)

      let metadata = getMetadataReliably(current_user.json_metadata);

      if (!mutedInNew.includes(author))
        mutedInNew.push(author);
      else
        mutedInNew = mutedInNew.filter(val => val !== author);

      metadata.mutedInNew = mutedInNew;

      this.setState({loading: true})
      updateAccount({
        json_metadata: JSON.stringify(metadata),
        account: current_user.name,
        errorCallback: (err) => {
          this.setState({loading: false})
          if (e !== 'Canceled') {
              notify(tt('g.server_returned_error'), 10000);
              console.log('updateAccount ERROR', err);
          }
        },
        successCallback: () => {
          this.setState({ loading: false});
        },
      });
    }

    render() {
        const {current_user, author} = this.props

        if (!current_user) return null;
        if (!author) return null;

        //const isFirstTime = !current_user.toJS().json_metadata.includes('mutedInNew');
      
        let mutedInNew = getMutedInNew(current_user.toJS());

        const loading = this.state.loading ? ' loading' : ''
        return (
          <span className={'MuteAuthorInNew__button' + loading} onClick={this.block}><Icon name={mutedInNew.includes(author) ? 'eye_strike' : 'eye'} title={tt('postsummary_jsx.mute_in_new')} /></span>
        )
    }
}
module.exports = connect(
    (state, ownProps) => {
        const current_user = state.user.getIn(['current', 'username'])

        return {...ownProps, current_user: state.global.get('accounts').get(current_user) || null}
    },

    dispatch => ({
        updateAccount: ({ successCallback, errorCallback, ...operation }) => {
            dispatch(
                transaction.actions.broadcastOperation({
                    type: 'account_metadata',
                    operation,
                    successCallback() {
                        //do not reload posts because we should allow user select multiple authors
                        //dispatch({type: 'FETCH_STATE', payload: {pathname: `created`}})
                        dispatch(user.actions.getAccount());
                        successCallback();
                    },
                    errorCallback,
                })
            );
        },

        notify: (message, dismiss = 3000) => {
            dispatch({
                type: 'ADD_NOTIFICATION',
                payload: {
                    key: 'settings_' + Date.now(),
                    message,
                    dismissAfter: dismiss,
                },
            });
        }
    })
)(MuteAuthorInNew)
