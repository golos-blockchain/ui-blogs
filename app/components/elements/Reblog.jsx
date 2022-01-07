import React from 'react';
import PropTypes from 'prop-types'
import {connect} from 'react-redux';
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate'
import transaction from 'app/redux/Transaction';
import Icon from 'app/components/elements/Icon';
import tt from 'counterpart';

const {string, func} = PropTypes

export default class Reblog extends React.Component {
    static propTypes = {
        account: string,
        author: string,
        permlink: string,
        reblog: func,
    }
    constructor(props) {
        super(props)
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'Reblog')
        this.state = {active: false, loading: false}
    }

    componentDidMount() {
        const {account} = this.props
        if(account) {
            this.setState({active: this.isReblogged(account)})
        }
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        if(nextProps.account) {
            this.setState({active: this.isReblogged(nextProps.account)})
        }
    }

    reblog = e => {
        e.preventDefault()
        this.setState({loading: true})
        const {reblog, account, author, permlink} = this.props
        const { active } = this.state
        reblog(account, author, permlink, active,
            () => {this.setState({active: !active, loading: false})
                   this.setReblogged(account, !active)},
            () => {this.setState({loading: false})},
        )
    }

    isReblogged(account) {
        const {author, permlink} = this.props
        return getRebloggedList(account).includes(author + '/' + permlink)
    }

    setReblogged(account, val) {
        const {author, permlink} = this.props
        clearRebloggedCache()
        const id = author + '/' + permlink
        let posts = getRebloggedList(account)

        if (val) {
            posts.push(id)
            if (posts.length > 200)
                posts.shift(1)
        } else {
            posts = posts.filter(p => p !== id)
        }
        localStorage.setItem("reblogged_" + account, JSON.stringify(posts))
    }

    render() {
        const { active } = this.state
        if(this.props.author == this.props.account) return null;

        const state = this.state.active ? 'active' : 'inactive'
        const loading = this.state.loading ? ' loading' : ''
        return <span className={'Reblog__button Reblog__button-'+state + loading}>
            <a href="#" onClick={this.reblog} title={tt(active ? 'g.delete_reblog' : 'g.reblog')}><Icon name="reblog" /></a>
        </span>
    }
}
module.exports = connect(
    (state, ownProps) => {
        const account = state.user.getIn(['current', 'username']) || state.offchain.get('account')
        return {...ownProps, account}
    },
    dispatch => ({
        reblog: (account, author, permlink, cancel, successCallback, errorCallback) => {
            const json = [cancel ? 'delete_reblog' : 'reblog',
                {account, author, permlink}]
            const title = cancel ? tt('g.delete_reblog') : tt('g.resteem_this_post')
            dispatch(transaction.actions.broadcastOperation({
                type: 'custom_json',
                confirm: tt('g.are_you_sure'),
                operation: {
                    id: 'follow',
                    required_posting_auths: [account],
                    json: JSON.stringify(json),
                    __config: {title}
                },
                successCallback, errorCallback,
            }))
        },
    })
)(Reblog)

let lastAccount
let cachedPosts

function getRebloggedList(account) {
    if(!process.env.BROWSER)
        return []

    if(lastAccount === account)
        return cachedPosts

    lastAccount = account
    const posts = localStorage.getItem("reblogged_" + account)
    try {
        cachedPosts = JSON.parse(posts) || []
    } catch(e) {
        cachedPosts = []
    }
    return cachedPosts
}

function clearRebloggedCache() {
    lastAccount = null
}
