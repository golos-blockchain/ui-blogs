import React from 'react'
import tt from 'counterpart'
import { connect } from 'react-redux'

import user from 'app/redux/User'
import session from 'app/utils/session'
import Icon from 'app/components/elements/Icon'
import Userpic from 'app/components/elements/Userpic'

class ChangeAccount extends React.Component {
    constructor(props) {
        super(props)
        const data = session.load()
        this.state = {
            data
        }
        const usernames = []
        for (let [acc, obj] of Object.entries(data.accounts)) {
            usernames.push(acc)
        }
        this.props.fetchAccounts(usernames)
    }
    
    selectAccount = (e, username) => {
        e.preventDefault()
        const acc = session.load().accounts[username]
        if (acc && acc.posting) {
            this.props.changeAccount(username, acc.posting)
        }
    }

    logout = (e, username, current) => {
        e.preventDefault()
        this.props.logout(username, current, () => {
            this.setState({
                data: session.load()
            })
        })
    }

    logoutAll = (e) => {
        e.preventDefault()
        this.props.logoutAll()
    }
    
    onAdd = (e) => {
        e.preventDefault()
        this.props.showAddAccount()
    }
    
    _renderAcc = (username, current = false, key = undefined) => {
        return <div className={'row account ' + (current ? ' current' : '')} key={key} onClick={current ? undefined : e => this.selectAccount(e, username)}>
                <div className={'column small-6'}>
                    <Userpic account={username} width={40} height={40} />
                    <div className='account-name'>
                        {username}
                    </div>
                </div>
                <div className="column small-6">
                    <a href='#' style={{ float: 'right' }} onClick={e => this.logout(e, username, current)} title={tt('g.logout')}>
                        <Icon name='new/logout' />
                    </a>
                </div>
            </div>
    }
    
    _renderAnotherAccs = () => {
        const { data } = this.state
        const { currentName, accounts } = data
        let rows = []
        for (let [acc, data] of Object.entries(accounts)) {
            if (acc !== currentName)
                rows.push(this._renderAcc(acc, false, acc))
        }
        return rows
    }

    render() {
        const { data } = this.state
        const { currentName, accounts } = data
        if (!currentName || !accounts[currentName]) {
            return null
        }
        const anothers = this._renderAnotherAccs()
        return <div className='ChangeAccount'>
            <div className='row'>
                <h4>{tt('g.change_acc')}</h4>
            </div>
            {this._renderAcc(currentName, true)}
            {anothers}
            <div className='row'>
                <div className="column small-12">
                    <a href='#' onClick={this.onAdd}>
                        <Icon name='person' />
                        <span className='LinkLabel'>
                            {tt('change_account_jsx.add_account')}
                        </span>
                    </a>
                </div>
            </div>
            <div className='row'>
                <div className="column small-12">
                    <a href='#' onClick={this.logoutAll}>
                        <Icon name='new/logout' />
                        <span className='LinkLabel'>
                            {anothers.length ? tt('change_account_jsx.logout_all') : tt('g.logout')}
                        </span>
                    </a>
                </div>
            </div>
        </div>
    }
}

export default connect(
    (state, props) => {
        return {
            ...props,
        };
    },
    dispatch => ({
        fetchAccounts: (usernames) => {
            dispatch(user.actions.getAccount({ usernames, }))
        },
        changeAccount: (username, password) => {
            dispatch(user.actions.hideChangeAccount())
            dispatch(user.actions.changeAccount({username, password }))
        },
        logout: (username, current, successCallback) => {
            if (current) {
                dispatch(user.actions.logout())
            } else {
                session.load().logout(username).save()
                successCallback()
            }
        },
        logoutAll: () => {
            session.clear()
            dispatch(user.actions.logout())
        },
        showAddAccount: () => {
            dispatch(user.actions.hideChangeAccount())
            dispatch(user.actions.showAddAccount())
        }
    })
)(ChangeAccount)
