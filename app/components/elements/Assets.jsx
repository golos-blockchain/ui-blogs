import React, {Component} from 'react'
import PropTypes from 'prop-types'
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate'
import g from 'app/redux/GlobalReducer'
import {connect} from 'react-redux';
import { Link } from 'react-router';
import Icon from 'app/components/elements/Icon';
import Author from 'app/components/elements/Author';
import Button from 'app/components/elements/Button';
import FoundationDropdownMenu from 'app/components/elements/FoundationDropdownMenu';
import tt from 'counterpart';

class Assets extends Component {
    static propTypes = {
        // HTML
        account: PropTypes.object.isRequired,
    }

    constructor() {
        super()
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'Assets')
    }

    state = {
      show_full_list: false
    }

    loadMore = async () => {
      this.setState({
        show_full_list: !this.state.show_full_list
      });
    }

    render() {
        const {account, isMyAccount} = this.props
        const account_name = account.get('name');


        const showTransfer = (to, asset, precision, transferType, e) => {
            e.preventDefault();
            this.props.showTransfer({
                to,
                asset, precision, transferType
            });
        };

        let show_load_more = false;
        let my_assets = [];
        for (const [sym, item] of Object.entries(this.props.assets.toJS())) {
            if (!item.my) {
                show_load_more = true;
                if (!this.state.show_full_list) continue;
            }

            let balance_menu = [
                { value: tt('g.transfer'), link: '#', onClick: showTransfer.bind( this, '', sym, item.precision, 'Transfer to Account' ) },
            ]

            if (!item.allow_override_transfer) {
                balance_menu.push({ value: tt('userwallet_jsx.transfer_to_tip'), link: '#', onClick: showTransfer.bind( this, account_name, sym, item.precision, 'Transfer to TIP' ) })
            }

            let tip_menu = [
                { value: tt('g.transfer'), link: '#', onClick: showTransfer.bind( this, '', sym, item.precision, 'TIP to Account' ) },
                { value: tt('userwallet_jsx.transfer_to_liquid'), link: '#', onClick: showTransfer.bind( this, account_name, sym, item.precision, 'TIP to Vesting' ) },
            ]

            let description = ""
            let image_url = ""
            if (item.json_metadata.startsWith('{')) {
                let json_metadata = JSON.parse(item.json_metadata)
                description = json_metadata.description
                image_url = json_metadata.image_url
            }

            const tradable_with_golos = !item.symbols_whitelist.length || item.symbols_whitelist.includes('GOLOS')

            my_assets.push(<tr key={sym}>
                <td>
                {description.length ? (<a target="_blank" href={description}>
                {image_url.length ? (<img width="48" height="48" src={image_url}/>) : null}{sym}</a>) : null}
                {!description.length ? (<span><img width="48" height="48" src={image_url}/>{sym}</span>) : null}
                &nbsp;{tradable_with_golos ? <Link to={"/market/GOLOS/"+sym}><Icon name="trade"/></Link> : null}
                    <div>
                    {(isMyAccount && item.creator == account_name) && <Link to={`/@${account_name}/assets/${sym}/update`} className="button tiny">
                        {tt('assets_jsx.update_btn')}
                    </Link>}
                    &nbsp;&nbsp;
                    {(isMyAccount && item.creator == account_name) ? <button
                        className="button tiny"
                        onClick={showTransfer.bind(this, account_name, sym, item.precision, 'Issue UIA')}
                    >
                        {tt('assets_jsx.issue_btn')}
                    </button> : null}</div>
                </td>
                <td>
                    {isMyAccount ? <FoundationDropdownMenu
                            dropdownPosition="bottom"
                            dropdownAlignment="right"
                            label={item.balance}
                            menu={balance_menu}
                        /> : item.balance}
                    <br/>{tt('assets_jsx.balance')}
                </td>
                <td title={item.allow_override_transfer ? tt('assets_jsx.overridable_no_tip') : ''} className={item.allow_override_transfer ? 'Assets__disabled' : ''}>

                    {(isMyAccount && !item.allow_override_transfer) ? <FoundationDropdownMenu
                            dropdownPosition="bottom"
                            dropdownAlignment="right"
                            label={item.tip_balance}
                            menu={tip_menu}
                        /> : item.tip_balance}
                <br/>{tt('assets_jsx.tip_balance')}</td>
                <td>
                    {tt('assets_jsx.creator')}: <Author author={item.creator} follow={false} /><br/>
                    {tt('assets_jsx.supply_count')}:<br/>
                    {item.supply}
                </td>
            </tr>);
        }
        return (<div>
            <div className="row">
                <div className="column small-10">
                    <h4 className="Assets__header">{this.state.show_full_list ? tt('assets_jsx.all_assets') : tt('assets_jsx.my_assets')}</h4>
                    {isMyAccount && <Link to={`/@${account_name}/create-asset`} className="button float-right">
                        {tt('assets_jsx.create_btn')}
                    </Link>}
                </div>
            </div>
            <div className="row">
                <div className="column small-10">
                <table>
                <tbody>
                {my_assets}
                </tbody>
                </table>
                </div>
            </div>
            <div className="row">
                <div className="column small-10 Assets__center">
              {show_load_more && <Button onClick={this.loadMore} round="true" type="secondary">{this.state.show_full_list ? tt('assets_jsx.anti_load_more') : tt('g.load_more')}</Button>}
                </div>
            </div>

        </div>)
    }
}

export default connect(
    (state, ownProps) => {
        return {...ownProps,
            assets: state.global.get('assets')
        }
    },
    dispatch => ({
    })
)(Assets)
