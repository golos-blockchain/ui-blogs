import React from 'react'
import tt from 'counterpart'
import { connect } from 'react-redux'
import { api } from 'golos-lib-js'

import CloseButton from 'react-foundation-components/lib/global/close-button'

import user from 'app/redux/User'

const APP_REMINDER_INTERVAL = 30*24*60*60*1000

class NewsPopups extends React.Component {
    state = {
        hidden: false,
        hiddenNews: []
    }

    checkNews = async () => {
        if (typeof(localStorage) === 'undefined') {
            this.setState({ news: [] })
            return
        }
        try {
            let news_read = localStorage.getItem('news_read') || ''
            news_read = news_read.split(',')
            if ($STM_Config.golos_news && $STM_Config.golos_news.account) {
                const acc = $STM_Config.golos_news.account
                const entries = await api.getBlogEntriesAsync(acc, 0, 5, ['fm-'], {})
                const news_to_load = []
                for (const post of entries) {
                    const { author, hashlink } = post
                    if (news_read.includes(hashlink)) {
                        continue
                    }
                    news_to_load.push({
                        author,
                        hashlink
                    })
                }
                if (news_to_load.length) {
                    const news = await api.getContentPreviewsAsync(news_to_load)
                    this.setState({
                        news
                    })
                } else {
                    this.setState({
                        news: []
                    })
                }
            }
        } catch (err) {
            console.error('NewsPopups', err)
            this.setState({
                news: []
            })
        }
    }

    componentDidMount() {
        this.checkNews()
    }

    hideMe = (i) => {
        if (i) {
            let { hiddenNews } = this.state
            hiddenNews = [...hiddenNews]
            hiddenNews.push(i)
            this.setState({
                hiddenNews
            })
            let news_read = localStorage.getItem('news_read') || ''
            news_read = news_read.split(',')
            news_read.push(i)
            localStorage.setItem('news_read', news_read.join(','))
            return
        }
        const now = Date.now()
        localStorage.setItem('app_reminder', now)
        this.setState({
            hidden: true
        })
    }

    openNew = (e, i, url) => {
        e.preventDefault()
        this.hideMe(i)
        window.open(url, '_blank')
    }

    showModal = (e) => {
        e.preventDefault()
        this.props.showModal()
        this.hideMe()
    }

    showAppReminder = () => {
        if (process.env.IS_APP || typeof(localStorage) === 'undefined'
            || location.pathname.startsWith('/submit')) {
            return false
        }
        const now = Date.now()
        let reminded = localStorage.getItem('app_reminder') || 0
        reminded = parseInt(reminded)
        return !reminded || (now - reminded > APP_REMINDER_INTERVAL)
    }

    render() {
        const { news,hiddenNews } = this.state

        let appReminder = null
        if (news && this.showAppReminder() && !this.state.hidden) {
            appReminder = <span className='NewsPopups callout primary' onClick={this.showModal}>
                <CloseButton
                    onClick={(e) => {
                        e.stopPropagation()
                        this.hideMe()
                    }}
                />
                {tt('app_reminder.text')}
            </span>
        }

        let newItems = []
        if (news) {
            let newCount = 0
            for (const ne of news) {
                if (hiddenNews.includes(ne.hashlink)) {
                    continue
                }
                newCount++
            }
            newCount -= 1
            for (const ne of news) {
                if (hiddenNews.includes(ne.hashlink)) {
                    continue
                }
                let title = ne.title
                if (title.length > 100) {
                    title = title.substring(0, 100) + '...'
                }
                let bottom = newCount * 65
                if (appReminder) {
                    bottom += 65
                } else {
                    bottom += 2
                }
                newItems.push(<a key={ne.hashlink} href={ne.url} onClick={e => this.openNew(e, ne.hashlink, ne.url)} target='_blank' rel='noopener noreferrer nofollow'>
                    <span style={{ bottom: bottom + 'px' }} className='NewsPopups callout primary'>
                        <CloseButton
                            onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                this.hideMe(ne.hashlink)
                            }}
                        />
                        {title}
                    </span>
                </a>)
                --newCount
            }
        }

        return <div>
            {appReminder}
            {newItems}
        </div>
    }
}

export default connect(
    state => {
        return {}
    },
    dispatch => ({
        showModal: () => {
            dispatch(user.actions.showAppDownload())
        }
    })
)(NewsPopups)
