import React from 'react'
import tt from 'counterpart'
import { connect } from 'react-redux'

import g from 'app/redux/GlobalReducer'
import DropdownMenu from 'app/components/elements/DropdownMenu'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper'
import { getVersion } from 'app/utils/SearchClient'

const makeURL = (link) => {
    let hash = link.split('#')[1]
    link = hash ? ('/' + hash) : link
    return link
}

class TimeVersions extends React.Component {
    onClick = (e) => {
        const { content } = this.props
        const { num_changes, versions } = content
        if (num_changes && (!versions || !versions.items || versions.items.length < num_changes)) {
            this.props.fetchVersions(content)
        }
    }

    changeVersion = async (ver) => {
        const { content } = this.props
        this.props.showVersion(content, ver)
    }

    render() {
        const { content, className } = this.props
        let rev
        let menuItems = []
        const versions = content.versions || {}
        let changes = content.num_changes
        if (changes) {
            const latest = changes + 1
            const curr = versions.current || latest
            rev = ' (' + tt('time_versions_jsx.rev') + ' ' + curr + ')'
            if (curr !== latest) {
                rev = <b style={{ color: 'red' }}>{rev}</b>
            }
        }
        if (versions.loading || !versions.items) {
            menuItems.push({
                value: <span>
                    <LoadingIndicator type='circle' />
                </span>
            })
        } else {
            const formatTime = (time) => {
                let str = new Date(time + 'Z').toLocaleString([], {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: 'numeric', minute: '2-digit',
                    hour12: false
                })
                return str.split(',').join('')
            }
            menuItems = versions.items.reverse().map(item => {
                const onClick = (e) => {
                    let link = content.url
                    link = makeURL(link)
                    if (!window.location.pathname.endsWith(link)) {
                        e.preventDefault()
                        this.changeVersion(item.v)
                    }
                }
                let link = content.url
                link = makeURL(link)
                if (!item.latest) {
                    link += '?version=' + item.v
                }
                return {
                    key: item.v,
                    value: <span className='val'>{formatTime(item.time)}</span>,
                    link,
                    data: <span className='data'>
                            {tt('time_versions_jsx.version_NUM', { NUM: item.v })}
                        </span>,
                    onClick
                }
            })
        }
        let el = <TimeAgoWrapper
            date={content.created}
        />
        if (rev) {
            el = <DropdownMenu items={menuItems} el='div' className='TimeVersions'>
                {el}
                {rev}
            </DropdownMenu>
        }
        return <span className={'updated ' + className} onClick={this.onClick}>
                {el}
            </span>
    }
}

export default connect(
    (state, props) => {
        return props
    },
    dispatch => ({
        fetchVersions: (content) => {
            const { author, permlink, last_update, num_changes } = content
            dispatch(g.actions.fetchVersions({ author, permlink, lastUpdate: last_update, numChanges: num_changes }))
        },
        showVersion: (content, v) => {
            const { author, permlink } = content
            dispatch(g.actions.showVersion({ author, permlink, v }))
        }
    })
)(TimeVersions)
