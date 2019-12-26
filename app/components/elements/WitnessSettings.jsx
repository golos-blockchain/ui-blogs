import React from 'react';
import {connect} from 'react-redux';
import transaction from 'app/redux/Transaction'
import reactForm from 'app/utils/ReactForm';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import tt from 'counterpart';
import o2j from 'shared/clash/object2json'

class WitnessSettings extends React.Component {
    
    constructor(props) {
        super();
        this.initForm(props);
        //this.shouldComponentUpdate = shouldComponentUpdate(this, 'WitnessSettings');
    }

    initForm(props) {
        reactForm({
            instance: this,
            name: 'witnessSettings',
            fields: ['url', 'api_node', 'seed_node', 'sbd_exchange_rate_base', 'sbd_exchange_rate_quote', 'signing_key'],
            initialValues: {
                url: props.witness_obj.get('url'),
                sbd_exchange_rate_base: props.witness_obj.get('sbd_exchange_rate').get('base').split(' ')[0],
                sbd_exchange_rate_quote: props.witness_obj.get('sbd_exchange_rate').get('quote').split(' ')[0],
                signing_key: props.witness_obj.get('signing_key'),
            ...props.witness},
            validation: values => ({
                url: values.url && !/^https?:\/\//.test(values.url) ? tt('settings_jsx.invalid_url') : null,
                api_node: values.api_node && !/^wss?:\/\//.test(values.api_node) ? tt('settings_jsx.invalid_ws') : null,
                seed_node: values.seed_node && !/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?):[0-9]{1,5}$/.test(values.seed_node) ? tt('settings_jsx.invalid_ip_port') : null,
            })
        });
        this.handleSubmitForm =
            this.state.witnessSettings.handleSubmit(args => this.handleSubmit(args));
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

        const {api_node, seed_node, url, sbd_exchange_rate_base, sbd_exchange_rate_quote, signing_key} = this.state

        // Update relevant fields
        metaData.witness.api_node = api_node.value
        metaData.witness.seed_node = seed_node.value

        // Remove empty keys
        if(!metaData.witness.api_node) delete metaData.witness.api_node;
        if(!metaData.witness.seed_node) delete metaData.witness.seed_node;

        const {account, updateAccount, publishFeed, updateWitness} = this.props
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
                    exchange_rate: {base: sbd_exchange_rate_base.value + ' GOLOS', quote: sbd_exchange_rate_quote.value + ' GBG'},
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
                        updateWitness({
                            owner: account.name,
                            url: url.value,
                            fee: '1.000 GOLOS',
                            block_signing_key: signing_key.value,
                            props: {
                                account_creation_fee: this.props.witness_obj.get('props').get('account_creation_fee'),
                                maximum_block_size: this.props.witness_obj.get('props').get('maximum_block_size'),
                                sbd_interest_rate: this.props.witness_obj.get('props').get('sbd_interest_rate')
                            },
                            errorCallback: (e) => {
                                if (e === 'Canceled') {
                                    this.setState({
                                        loading: false,
                                        errorMessage: ''
                                    })
                                } else {
                                    console.log('updateWitness ERROR', e)
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
        });
    }

    render() {
        const {
            props: {current_user, json_metadata},
        } = this;

        const {state} = this
        
        const {submitting, valid, touched} = this.state.witnessSettings
        const disabled = state.loading || submitting || !valid || !touched

        const {url, api_node, seed_node, sbd_exchange_rate_base, sbd_exchange_rate_quote, signing_key} = this.state

        return (<div className="UserWallet">
            <form onSubmit={this.handleSubmitForm}>
                <div>
                    <h2 className="inline">Делегат {this.props.account.name}</h2>
                    &nbsp;&nbsp;

                    <input type="text" {...url.props} title="Пост делегата" placeholder="https://пост-делегата" maxLength="2048" autoComplete="off" />
                    &nbsp;&nbsp;
                    
                    {state.loading && <span><LoadingIndicator type="circle" /><br /></span>}
                    {!state.loading && <input type="submit" className="button" value="Сохранить" disabled={disabled} />}
                    {' '}{
                            state.errorMessage
                                ? <small className="error">{state.errorMessage}</small>
                                : state.successMessage
                                ? <small className="success uppercase">{state.successMessage}</small>
                                : null
                        }
                </div>
                <table className="clear-table">
                <tbody>
                <tr>
                    <td>
                    <input type="text" {...api_node.props} title="API-нода" placeholder="API-ноды нет" maxLength="256" autoComplete="off" />
                    </td>

                    <td>&nbsp;</td><td style={{width: "200px"}}>
                    <input type="text" {...seed_node.props} title="SEED-нода" placeholder="SEED-ноды нет" maxLength="256" autoComplete="off" />
                    </td>

                    <td>&nbsp;</td><td title="Прайс-фид">
                        <div className="input-group no-margin-bottom">
                            <input type="text" className="input-group-field" {...sbd_exchange_rate_quote.props} size="1" maxLength="256" autoComplete="off" />
                            <span className="input-group-label">GOLOS</span>
                        </div>
                    </td>

                    <td title="Прайс-фид">
                        <div className="input-group no-margin-bottom">
                            <input type="text" className="input-group-field" {...sbd_exchange_rate_base.props} size="1" maxLength="256" autoComplete="off" />
                            <span className="input-group-label">GBG</span>
                        </div>
                    </td>

                    <td>&nbsp;</td><td title="Подписной ключ">
                        <div className="input-group no-margin-bottom">
                            <input type="text" className="input-group-field" {...signing_key.props} maxLength="256" autoComplete="off" />
                            <span className="input-group-label" style={{cursor: "pointer"}}>X</span>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td><span className="error">{api_node.touched && api_node.error}</span></td>
                    <td></td>
                    <td><div className="error">{seed_node.touched && seed_node.error}</div></td>
                    <td></td>
                    <td><div className="error">{sbd_exchange_rate_quote.touched && sbd_exchange_rate_quote.error}</div></td>
                    <td><div className="error">{sbd_exchange_rate_base.touched && sbd_exchange_rate_base.error}</div></td>
                    <td></td>
                    <td><div className="error">{signing_key.touched && signing_key.error}</div></td>
                </tr>
                </tbody>
                </table>
            </form>
        </div>);
    }
    componentDidMount() {
    }
}

export default connect(
    // mapStateToProps
    (state, props) => {
        const { account } = props;
        let metaData = account ? o2j.ifStringParseJSON(account.json_metadata) : {}
        if (typeof metaData === 'string') metaData = o2j.ifStringParseJSON(metaData); // issue #1237
        const witness = metaData && metaData.witness ? metaData.witness : {}

        return {
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
        updateWitness: ({successCallback, errorCallback, ...operation}) => {
            const success = () => {
                //dispatch(user.actions.getAccount())
                successCallback()
            }

            const options = {type: 'witness_update', operation, successCallback: success, errorCallback}
            dispatch(transaction.actions.broadcastOperation(options))
        }
    })
)(WitnessSettings)
