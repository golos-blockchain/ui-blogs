import React from 'react';
import {connect} from 'react-redux';
import transaction from 'app/redux/Transaction'
import reactForm from 'app/utils/ReactForm';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import tt from 'counterpart';
import { getMetadataReliably } from 'app/utils/NormalizeProfile';
import g from 'app/redux/GlobalReducer';

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
            fields: ['url', 'signing_key'],
            initialValues: {
                url: props.witness_obj.get('url'),
                signing_key: props.witness_obj.get('signing_key'),
            ...props.witness},
            validation: values => ({
                url: values.url && !/^https?:\/\//.test(values.url) ? tt('settings_jsx.invalid_url') : null,
            })
        });
        this.handleSubmitForm =
            this.state.witnessSettings.handleSubmit(args => this.handleSubmit(args));
    }

    handleSubmit = ({updateInitialValues}) => {
        const {url, signing_key} = this.state

        const {account, updateWitness} = this.props
        this.setState({loading: true})
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

    clearSigningKey = (e) => {
        e.preventDefault();
        this.state.signing_key.props.onChange('GLS1111111111111111111111111111111114T1Anm');
    }

    render() {
        const {
            props: {account},
        } = this;

        const {state} = this
        
        const {submitting, valid, touched} = this.state.witnessSettings
        const disabled = state.loading || submitting || !valid || !touched

        const {url, signing_key} = this.state

        const showFeedsNodes = (e) => {
            e.preventDefault()
            const name = account.name
            this.props.feedsNodes(name)
        }

        return (<div className="UserWallet">
            <form onSubmit={this.handleSubmitForm}>
                <div>
                    <h2 className="inline">Делегат {this.props.account.name}</h2>
                    &nbsp;&nbsp;

                    <span className="button" onClick={showFeedsNodes}>Фиды & Ноды</span>&nbsp;&nbsp;
                    {state.loading && <span><LoadingIndicator type="circle" /><br /></span>}
                    {!state.loading && <input type="submit" className="button margin-bottom" value="Сохранить" disabled={disabled} />}
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
                    <input type="text" {...url.props} title="Пост делегата" placeholder="https://пост-делегата" maxLength="2048" autoComplete="off" />
                    </td>

                    <td>&nbsp;</td><td title="Подписной ключ">
                        <div className="input-group no-margin-bottom">
                            <input type="text" className="input-group-field" {...signing_key.props} maxLength="256" autoComplete="off" />
                            <span className="input-group-label" onClick={this.clearSigningKey} style={{cursor: "pointer"}}>X</span>
                        </div>
                    </td>
                </tr>
                <tr>
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
        let metaData = account ? getMetadataReliably(account.json_metadata) : {}
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
        },
        feedsNodes: (username) => {
            dispatch(g.actions.showDialog({name: 'feeds_nodes', params: {username}}))
        }
    })
)(WitnessSettings)
