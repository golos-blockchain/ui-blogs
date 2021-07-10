import React from 'react';
import PropTypes from 'prop-types'
import {connect} from 'react-redux';
import { markNotificationRead } from 'app/utils/NotifyApiClient';

class MarkNotificationRead extends React.Component {

    static propTypes = {
        fields: PropTypes.string,
        account: PropTypes.string,
        update: PropTypes.func,
        interval: PropTypes.number,
    };

    shouldComponentUpdate() {
        return false;
    }

    _activateInterval(interval) {
        if (!this.interval) {
            const { account, update } = this.props;
            this.interval = setInterval(() => {
                markNotificationRead(account, this.fields_array).then(nc => update(nc));
            }, interval);
        }
    }

    componentDidMount() {
        const { account, fields, update, interval } = this.props;
        this.fields_array = fields.replace(/\s/g,'').split(',');
        if (interval)
            this._activateInterval(interval);
        else
            markNotificationRead(account, this.fields_array).then(nc => update(nc));
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        if (nextProps.interval) {
            this._activateInterval(nextProps.interval);
        } else {
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = undefined;
            }
        }
    }

    render() {
        return null;
    }

}

export default connect(null, dispatch => ({
    update: (payload) => { dispatch({type: 'UPDATE_NOTIFICOUNTERS', payload})},
}))(MarkNotificationRead);
