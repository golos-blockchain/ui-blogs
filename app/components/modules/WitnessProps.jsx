import React from 'react';
import {connect} from 'react-redux';
import transaction from 'app/redux/Transaction'
import reactForm from 'app/utils/ReactForm';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import tt from 'counterpart';
import WitnessSettings from 'app/components/elements/WitnessSettings';

class WitnessProps extends React.Component {
    
    constructor(props) {
        super();
        this.initForm(props);
        //this.shouldComponentUpdate = shouldComponentUpdate(this, 'WitnessProps');
    }

    wprops_19 = [
        [
            ['account_creation_fee', 'golos'],
            ['create_account_min_golos_fee', 'golos'],
            ['create_account_min_delegation', 'golos'],
            ['create_account_delegation_time', 'raw'],
        ],
        [
            ['max_referral_interest_rate'],
            ['max_referral_term_sec', 'time'],
            ['min_referral_break_fee', 'golos'],
            ['max_referral_break_fee', 'golos'],
        ],
        [
            ['maximum_block_size', 'raw'],
            ['worker_emission_percent'],
            ['vesting_of_remain_percent'],
        ],
        [
            ['sbd_interest_rate'],
            ['convert_fee_percent'],
            ['sbd_debt_convert_rate'],
        ], 
        [
            ['asset_creation_fee', 'gbg'],
            ['min_delegation', 'golos'],
            ['max_delegated_vesting_interest_rate'],
        ],
        [
            ['posts_window', 'raw'],
            ['posts_per_window', 'raw'],
        ],
        [
            ['comments_window', 'raw'],
            ['comments_per_window', 'raw'],
        ],
        [
            ['votes_window', 'raw'],
            ['votes_per_window', 'raw'],
            ['vote_regeneration_per_day', 'raw'],           
        ],
        [
            ['negrep_posting_window', 'dropped', 0],
            ['negrep_posting_per_window', 'dropped', 0],
            ['custom_ops_bandwidth_multiplier', 'raw'],
            ['unwanted_operation_cost', 'golos'],
            ['unlimit_operation_cost', 'golos'],
        ],
        [
            ['min_golos_power_to_curate', 'golos'],
            ['curation_reward_curve', ['bounded','linear','square_root']],
            ['min_curation_percent'],
            ['max_curation_percent'],
        ],
        [
            ['min_invite_balance', 'golos'],
            ['invite_transfer_interval_sec', 'time'],
            ['worker_request_creation_fee', 'gbg'],
            ['worker_request_approve_min_percent'],
        ],
        [
            ['witness_skipping_reset_time', 'time'],
            ['witness_idleness_time', 'time'],
            ['account_idleness_time', 'time'],
            ['claim_idleness_time', 'dropped', 0],
        ],
        [
            ['worker_reward_percent', 'dropped', 0],
            ['witness_reward_percent', 'dropped', 0],
            ['vesting_reward_percent', 'dropped', 0],
        ],
        [
            ['auction_window_size', 'dropped', 0],
            ['allow_distribute_auction_reward', 'dropped', 'true'],
            ['allow_return_auction_reward_to_fund', 'dropped', 'true'],
        ],
    ];

    wprops_22 = [
    ];

    initForm(props) {
        this.wprops = [...this.wprops_19, ...this.wprops_22];
        this.wp_flat = this.wprops.flat();
        this.prop_names = this.wp_flat.map(p => p[0]);
        reactForm({
            instance: this,
            name: 'witnessProps',
            fields: this.prop_names,
            initialValues: props.witness_obj.toJS().props,
            validation: values => ({
            })
        });
        this.handleSubmitForm =
            this.state.witnessProps.handleSubmit(args => this.handleSubmit(args));
    }

    handleSubmit = ({updateInitialValues}) => {
        const {account, updateChainProperties} = this.props;
        this.setState({loading: true});

        let props = {};
        for (let prop of this.wp_flat) {
            if (prop.length === 1 || prop[1] == 'raw' || prop[1] == 'time') {
                props[prop[0]] = parseInt(this.state[prop[0]].value);
            } else if (prop[1] === 'dropped') {
                props[prop[0]] = prop[2];
            } else {
                props[prop[0]] = this.state[prop[0]].value;
            }
        }
        if (props.curation_reward_curve == 'bounded') {
            props.curation_reward_curve = 0;
        } else if (props.curation_reward_curve == 'linear') {
            props.curation_reward_curve = 1;
        } else if (props.curation_reward_curve == 'square_root') {
            props.curation_reward_curve = 2;
        }
        props.create_account_delegation_time = parseInt(props.create_account_delegation_time);
        props.custom_ops_bandwidth_multiplier = parseInt(props.custom_ops_bandwidth_multiplier);
        props.maximum_block_size = parseInt(props.maximum_block_size);
        props.sbd_interest_rate = parseInt(props.sbd_interest_rate);
        props.sbd_debt_convert_rate = parseInt(props.sbd_debt_convert_rate);
        props.max_delegated_vesting_interest_rate = parseInt(props.max_delegated_vesting_interest_rate);
        props.max_referral_term_sec = parseInt(props.max_referral_term_sec);
        props.max_referral_interest_rate = parseInt(props.max_referral_interest_rate);
        props.posts_window = parseInt(props.posts_window);
        props.comments_window = parseInt(props.comments_window);
        props.posts_per_window = parseInt(props.posts_per_window);
        props.comments_per_window = parseInt(props.comments_per_window);
        updateChainProperties({
            owner: account.name,
            props: [7, props],
            errorCallback: (e) => {
                if (e === 'Canceled') {
                    this.setState({
                        loading: false,
                        errorMessage: ''
                    })
                } else {
                    console.error('updateChainProperties ERROR', e)
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

    render() {
        const {
            props: {current_user, json_metadata},
        } = this;
        //const username = current_user ? current_user.get('username') : null

        const {state} = this
        
        const {submitting, valid, touched} = this.state.witnessProps;
        const disabled = state.loading || submitting || !valid || !touched

        let groups = this.wprops.map((wp) => {
            let fields = wp.map((f) => {
                const field = this.state[f[0]];

                let input = null;
                if (f[1] === 'bool') {
                    input = <input type='checkbox' {...field.props} />
                } else if (f[1] === 'raw') {
                    input = <input type='text' {...field.props} />
                } else if (f[1] === 'dropped') {
                    return null;
                } else {
                    input = <input type='text' {...field.props} />
                }

                return (<td key={f[0]}>
                    <label title={tt('g.'+f[0])}>{f[0]}
                    {input}</label>
                    <div className='error'>{field.touched && field.error}</div>
                </td>);
            });
            return (<tr>{fields}</tr>);
        });

        return (<div className='UserWallet'>
            <WitnessSettings 
                account={this.props.account} />
            <form onSubmit={this.handleSubmitForm} className='small-12 medium-8 large-6 columns'>
                    <div>
                    <h3 className='inline'>Параметры сети</h3>&nbsp;&nbsp;

                    {state.loading && <span><LoadingIndicator type='circle' /><br /></span>}
                    {!state.loading && <input type='submit' className='button' value='Сохранить' disabled={disabled} />}
                    {' '}{
                            state.errorMessage
                                ? <small className='error'>{state.errorMessage}</small>
                                : state.successMessage
                                ? <small className='success uppercase'>{state.successMessage}</small>
                                : null
                        }
                    </div>
                    <table className='WitnessPropsTable'>
                        {groups}
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

        return {
                witness_obj: state.global.getIn(['witnesses', account.name])
            };
    },
    // mapDispatchToProps
    dispatch => ({
        updateChainProperties: ({successCallback, errorCallback, ...operation}) => {
            const success = () => {
                //dispatch(user.actions.getAccount())
                successCallback()
            }

            const options = {type: 'chain_properties_update', operation, successCallback: success, errorCallback}
            dispatch(transaction.actions.broadcastOperation(options))
        }
    })
)(WitnessProps)
