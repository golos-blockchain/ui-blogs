import React from 'react';
import {connect} from 'react-redux';
import transaction from 'app/redux/Transaction'
import reactForm from 'app/utils/ReactForm';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import tt from 'counterpart';
import { getMetadataReliably } from 'app/utils/NormalizeProfile';

class FeedNodes extends React.Component {
    
    constructor(props) {
        super();
        this.initForm(props);
        //this.shouldComponentUpdate = shouldComponentUpdate(this, 'FeedNodes');
    }

    initForm(props) {
        reactForm({
            instance: this,
            name: 'feedNodes',
            fields: ['api_node', 'seed_node', 'sbd_exchange_rate_base', 'sbd_exchange_rate_quote'],
            initialValues: {
                sbd_exchange_rate_base: props.witness_obj.get('sbd_exchange_rate').get('base').split(' ')[0],
                sbd_exchange_rate_quote: props.witness_obj.get('sbd_exchange_rate').get('quote').split(' ')[0],
            ...props.witness},
            validation: values => ({
                api_node: values.api_node && !/^wss?:\/\//.test(values.api_node) && !/^https?:\/\//.test(values.api_node) ? tt('settings_jsx.invalid_ws') : null,
                seed_node: values.seed_node && !/^[\w.-]+(?:\.[\w\.-]+)+:\d*/.test(values.seed_node) ? tt('settings_jsx.invalid_ip_port') : null,
            })
        });
        this.handleSubmitForm =
            this.state.feedNodes.handleSubmit(args => this.handleSubmit(args));
    }

    handleSubmit = ({updateInitialValues}) => {
        let {metaData} = this.props
        if (!metaData) metaData = {}

        //fix https://github.com/GolosChain/tolstoy/issues/450
        if (typeof metaData === 'string' && metaData.localeCompare("{created_at: 'GENESIS'}") == 0) {
            metaData = {}
            metaData.created_at = 'GENESIS'
        }

        if(!metaData.witness) metaData.witness = {}

        const {api_node, seed_node, sbd_exchange_rate_base, sbd_exchange_rate_quote} = this.state

        // Update relevant fields
        metaData.witness.api_node = api_node.value
        metaData.witness.seed_node = seed_node.value

        // Remove empty keys
        if(!metaData.witness.api_node) delete metaData.witness.api_node;
        if(!metaData.witness.seed_node) delete metaData.witness.seed_node;

        const {account, updateAccount, publishFeed} = this.props
        this.setState({loading: true})
        updateAccount({
            json_metadata: JSON.stringify(metaData),
            account: account.name,
            memo_key: account.memo_key,
            errorCallback: (e) => {
                if (e === 'Canceled') {
                    this.setState({
                        loading: false,
                        errorMessage: ''
                    })
                } else {
                    console.log('updateAccount ERROR', e)
                    this.setState({
                        loading: false,
                        changed: false,
                        errorMessage: tt('g.server_returned_error')
                    })
                }
            },
            successCallback: () => {
                publishFeed({
                    publisher: account.name,
                    exchange_rate: {base: sbd_exchange_rate_base.value + ' GBG', quote: sbd_exchange_rate_quote.value + ' GOLOS'},
                    errorCallback: (e) => {
                        if (e === 'Canceled') {
                            this.setState({
                                loading: false,
                                errorMessage: ''
                            })
                        } else {
                            console.log('publishFeed ERROR', e)
                            this.setState({
                                loading: false,
                                changed: false,
                                errorMessage: tt('g.server_returned_error')
                            })
                        }
                    },
                    successCallback: () => {
                        this.setState({
                            loading: false,
                            changed: false,
                            errorMessage: '',
                            successMessage: tt('g.saved') + '!',
                        })
                        // remove successMessage after a while
                        setTimeout(() => this.setState({successMessage: ''}), 4000)
                        updateInitialValues()
                    }
                });
            }
        });
    }

    render() {
        const {
            props: {current_user, json_metadata},
        } = this;

        const {state} = this
        
        const {submitting, valid, touched} = this.state.feedNodes
        const disabled = state.loading || submitting || !valid || !touched

        const {api_node, seed_node, sbd_exchange_rate_base, sbd_exchange_rate_quote} = this.state

        return (<div className="UserWallet">
            <form onSubmit={this.handleSubmitForm}>
                <div>
                    <h2 className="inline">Делегат {this.props.account.name}</h2>
                </div>
                
                <label>API-нода:</label>
                <input type="text" {...api_node.props} title="API-нода" placeholder="API-ноды нет" maxLength="256" autoComplete="off" />
                <div className="error">{api_node.touched && api_node.error}</div>

                <label>SEED-нода:</label>
                <input type="text" {...seed_node.props} title="SEED-нода" placeholder="SEED-ноды нет" maxLength="256" autoComplete="off" />
                <div className="error">{seed_node.touched && seed_node.error}</div>

                <label>Прайс-фид:</label>
                <div className="input-group no-margin-bottom" title="Прайс-фид">
                    <input type="text" className="input-group-field" {...sbd_exchange_rate_quote.props} size="1" maxLength="256" autoComplete="off" />
                    <span className="input-group-label">GOLOS</span>
                </div>
                <div className="error">{sbd_exchange_rate_quote.touched && sbd_exchange_rate_quote.error}</div>

                <div className="input-group no-margin-bottom" title="Прайс-фид">
                    <input type="text" className="input-group-field" {...sbd_exchange_rate_base.props} size="1" maxLength="256" autoComplete="off" />
                    <span className="input-group-label">GBG</span>
                </div>
                <div className="error">{sbd_exchange_rate_base.touched && sbd_exchange_rate_base.error}</div>

                {state.loading && <span><LoadingIndicator type="circle" /><br /></span>}
                {!state.loading && <input type="submit" className="button" value="Сохранить" disabled={disabled} />}
                {' '}{
                        state.errorMessage
                            ? <small className="error">{state.errorMessage}</small>
                            : state.successMessage
                            ? <small className="success uppercase">{state.successMessage}</small>
                            : null
                    }
            </form>
        </div>);
    }
    componentDidMount() {
    }
}

export default connect(
    // mapStateToProps
    (state, props) => {
        const { username } = props;
        let account = state.global.getIn(['accounts', username]).toJS();
        let metaData = account ? getMetadataReliably(account.json_metadata) : {}
        const witness = metaData && metaData.witness ? metaData.witness : {}

        return {
                account,
                metaData,
                witness,
                witness_obj: state.global.getIn(['witnesses', account.name])
            };
    },
    // mapDispatchToProps
    dispatch => ({
        updateAccount: ({successCallback, errorCallback, ...operation}) => {
            const success = () => {
                //dispatch(user.actions.getAccount())
                successCallback()
            }

            const options = {type: 'account_metadata', operation, successCallback: success, errorCallback}
            dispatch(transaction.actions.broadcastOperation(options))
        },
        publishFeed: ({successCallback, errorCallback, ...operation}) => {
            const success = () => {
                //dispatch(user.actions.getAccount())
                successCallback()
            }

            const options = {type: 'feed_publish', operation, successCallback: success, errorCallback}
            dispatch(transaction.actions.broadcastOperation(options))
        },
    })
)(FeedNodes)