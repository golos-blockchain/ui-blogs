import { PUBLIC_API } from 'app/client_config'
import { getPinnedPosts, getMutedInNew } from 'app/utils/NormalizeProfile'
import { CATEGORIES } from 'app/client_config'


import { reveseTag, prepareTrendingTags } from 'app/utils/tags'

const DEFAULT_VOTE_LIMIT = 10000

const isHardfork = (v) => v.split('.')[1] === '18'

export default async function getState(api, url, options, offchain = {}) {
    if (!url || typeof url !== 'string' || !url.length || url === '/') url = 'trending'
    url = url.split('?')[0]
    if (url[0] === '/') url = url.substr(1)
    
    const parts = url.split('/')
    // decode tag for cyrillic symbols
    const tag = typeof parts[1] !== 'undefined' ? decodeURIComponent(parts[1]) : ''

    const state = {}
    state.current_route = `/${url}`
    state.props = await api.getDynamicGlobalProperties()
    state.categories = {}
    state.tags = {}
    state.content = {}
    state.prev_posts = []
    state.accounts = {}
    state.witnesses = {}
    state.discussion_idx = {}
    state.feed_price = await api.getCurrentMedianHistoryPrice()
    state.select_tags = []

    // const hardfork_version = await api.getHardforkVersion()
    // state.is_hardfork = isHardfork(hardfork_version)
    
    let accounts = new Set()

    // by default trending tags limit=50, but if we in '/tags/' path then limit = 250
    const trending_tags = await api.getTrendingTags('', parts[0] == 'tags' ? '250' : '50')

    state.tag_idx = {
        'trending': prepareTrendingTags(trending_tags),
        'categories': CATEGORIES
    }

    if (parts[0][0] === '@') {
        const uname = parts[0].substr(1)
        const [ account ] = await api.getAccounts([uname])
        state.accounts[uname] = account
        
        if (account) {
            state.accounts[uname].tags_usage = await api.getTagsUsedByAuthor(uname)
            state.accounts[uname].guest_bloggers = await api.getBlogAuthors(uname)

            switch (parts[1]) {
                case 'transfers':
                    const history = await api.getAccountHistory(uname, -1, 1000, ['producer_reward'])
                    account.transfer_history = []
                    account.other_history = []

                    state.cprops = await api.getChainProperties();
                    history.forEach(operation => {
                        switch (operation[1].op[0]) {
                            case 'transfer_to_vesting':
                            case 'withdraw_vesting':
                            case 'interest':
                            case 'transfer':
                            case 'liquidity_reward':
                            case 'author_reward':
                            case 'curation_reward':
                            case 'worker_reward':
                            case 'transfer_to_tip':
                            case 'transfer_from_tip':
                            case 'claim':
                            case 'transfer_to_savings':
                            case 'transfer_from_savings':
                            case 'cancel_transfer_from_savings':
                            case 'escrow_transfer':
                            case 'escrow_approve':
                            case 'escrow_dispute':
                            case 'escrow_release':
                            case 'donate':
                            case 'invite':
                            case 'invite_claim':
                                state.accounts[uname].transfer_history.push(operation)
                            break

                            default:
                                state.accounts[uname].other_history.push(operation)
                        }
                    })
                break

                case 'invites':
                    state.cprops = await api.getChainProperties();
                break

                case 'recent-replies':
                    const replies = await api.getRepliesByLastUpdate(uname, '', 50, DEFAULT_VOTE_LIMIT)
                    state.accounts[uname].recent_replies = []

                    replies.forEach(reply => {
                        const link = `${reply.author}/${reply.permlink}`
                        state.content[link] = reply
                        state.accounts[uname].recent_replies.push(link)
                    })
                break

                case 'witness':
                    state.witnesses[uname] = await api.getWitnessByAccount(uname)
                break

                case 'posts':
                case 'comments':
                    const comments = await api.getDiscussionsByComments({ start_author: uname, limit: 20 })
                    state.accounts[uname].comments = []

                    comments.forEach(comment => {
                        const link = `${comment.author}/${comment.permlink}`
                        state.content[link] = comment
                        state.accounts[uname].comments.push(link)
                    })
                break

                case 'feed':
                    const feedEntries = await api.getFeedEntries(uname, 0, 20)
                    state.accounts[uname].feed = []

                    for (let key in feedEntries) {
                        const { author, permlink } = feedEntries[key]
                        const link = `${author}/${permlink}`
                        state.accounts[uname].feed.push(link)
                        state.content[link] = await api.getContent(author, permlink, DEFAULT_VOTE_LIMIT)
                        
                        if (feedEntries[key].reblog_by.length > 0) {
                            state.content[link].first_reblogged_by = feedEntries[key].reblog_by[0]
                            state.content[link].reblogged_by = feedEntries[key].reblog_by
                            state.content[link].first_reblogged_on = feedEntries[key].reblog_on
                        }
                    }
                break

                case 'blog':
                default:
                    const blogEntries = await api.getBlogEntries(uname, 0, 20)
                    state.accounts[uname].blog = []

                  let pinnedPosts = getPinnedPosts(account)
                  blogEntries.unshift(...pinnedPosts)

                    for (let key in blogEntries) {
                        const { author, permlink } = blogEntries[key]
                        const link = `${author}/${permlink}`

                        state.content[link] = await api.getContent(author, permlink, DEFAULT_VOTE_LIMIT)
                        state.accounts[uname].blog.push(link)
                    
                        if (blogEntries[key].reblog_on !== '1970-01-01T00:00:00') {
                            state.content[link].first_reblogged_on = blogEntries[key].reblog_on
                        }
                    }
                break
            }
        }

    } else if (parts.length === 3 && parts[1].length > 0 && parts[1][0] == '@') {
        const account = parts[1].substr(1)
        const category = parts[0]
        const permlink = parts[2]

        const curl = `${account}/${permlink}`
        state.content[curl] = await api.getContent(account, permlink, DEFAULT_VOTE_LIMIT)
        accounts.add(account)

        const replies = await api.getAllContentReplies(account, permlink, DEFAULT_VOTE_LIMIT)

       for (let key in replies) {
            let reply = replies[key]
            const link = `${reply.author}/${reply.permlink}`

            state.content[link] = reply
            accounts.add(reply.author)
            if (reply.parent_permlink === permlink) {
                state.content[curl].replies.push(link)
            }
            const donates = await api.getDonates({author: reply.account, permlink: reply.permlink}, '', '', 20, 0);
            state.content[link].donate_list = donates;
            state.content[link].confetti_active = false;
        }

        const donates = await api.getDonates({author: account, permlink: permlink}, '', '', 20, 0);
        state.content[curl].donate_list = donates;
        state.content[curl].confetti_active = false;

        let args = { truncate_body: 1024, select_categories: [category] };
        let prev_posts = await api.gedDiscussionsBy('created', {limit: 4, start_author: account, start_permlink: permlink, select_authors: [account], ...args});
        prev_posts = prev_posts.slice(1);
        let p_ids = [];
        for (let p of prev_posts) {
            p_ids.push(p.author + p.permlink);
        }
        if (prev_posts.length < 3) {
            let trend_posts = await api.gedDiscussionsBy('trending', {limit: 4, ...args});
            for (let p of trend_posts) {
                if (p.author === account && p.permlink === permlink) continue;
                if (p_ids.includes(p.author + p.permlink)) continue;
                prev_posts.push(p);
                p_ids.push(p.author + p.permlink);
            }
        }
        if (prev_posts.length < 3) {
            delete args.select_categories;
            let author_posts = await api.gedDiscussionsBy('author', {limit: 4, select_authors: [account], ...args});
            for (let p of author_posts) {
                if (p.author === account && p.permlink === permlink) continue;
                if (p_ids.includes(p.author + p.permlink)) continue;
                prev_posts.push(p);
            }
        }
        state.prev_posts = prev_posts.slice(0, 3);
    } else if (parts[0] === 'witnesses' || parts[0] === '~witnesses') {
        const witnesses = await api.getWitnessesByVote('', 100)
        witnesses.forEach( witness => {
            state.witnesses[witness.owner] = witness;
            accounts.add(witness.owner);
        })
  
    }  else if (parts[0] === 'nodes') {
        const witnesses = await api.getWitnessesByVote('', 100)
        witnesses.forEach( witness => {
            state.witnesses[witness.owner] = witness;
            accounts.add(witness.owner);
        })
  
  
    }  else if (parts[0] === 'workers') {
        accounts.add('workers');
        state.cprops = await api.getChainProperties();
  
    } else if (Object.keys(PUBLIC_API).includes(parts[0])) {
        let args = { limit: 20, truncate_body: 1024 }
        const discussionsType = parts[0]
        if (typeof tag === 'string' && tag.length && (!tag.startsWith('tag-') || tag.length > 4)) {
            if (tag.startsWith('tag-')) {
                let tag_raw = tag.slice(4);
                const reversed = reveseTag(tag_raw)
                reversed
                    ? args.select_tags = [tag_raw, reversed]
                    : args.select_tags = [tag_raw]
            } else {
                const reversed = reveseTag(tag)
                reversed
                    ? args.select_categories = [tag, reversed]
                    : args.select_categories = [tag]
            }
        } else {
            if (typeof offchain.select_tags === "object" && offchain.select_tags.length) {
                let selectTags = []
                
                offchain.select_tags.forEach( t => {
                    const reversed = reveseTag(t)
                    reversed
                        ? selectTags = [ ...selectTags, t, reversed ]
                        : selectTags = [ ...selectTags, t, ] 

                })
                args.select_categories = state.select_tags = selectTags;
            } else {
                let selectTags = [];
                state.tag_idx['categories'].forEach( t => {
                    const reversed = reveseTag(t)
                    reversed
                        ? selectTags = [ ...selectTags, t, reversed ]
                        : selectTags = [ ...selectTags, t, ] 

                })
                args.select_categories = selectTags;
                args.filter_tags = state.filter_tags = options.IGNORE_TAGS
            }
        }
        
        const requests = []
        const discussion_idxes = {}
        discussion_idxes[discussionsType] = []

        // Load 3 top from promo for trending
        if (discussionsType == 'trending') {
          requests.push(api.gedDiscussionsBy('promoted', {...args, limit: 3}))
        } else if (['created', 'hot'].includes(discussionsType)) {
          requests.push(api.gedDiscussionsBy('promoted', {...args, limit: 1}))
        }

        if (discussionsType == 'created' && offchain.account) {
            const [ loader ] = await api.getAccounts([offchain.account]);
            const mutedInNew = getMutedInNew(loader);
            args.filter_authors = mutedInNew;
        }
        requests.push(api.gedDiscussionsBy(discussionsType, args))
        const responses = await Promise.all(requests)

        const discussions = [].concat(...responses)

        discussions.forEach(discussion => {
            const link = `${discussion.author}/${discussion.permlink}`
            if (!discussion_idxes[discussionsType].includes(link)) {
              discussion_idxes[discussionsType].push(link)
            }
            state.content[link] = discussion
        })
        
        const discussions_key = typeof tag === 'string' && tag.length 
            ? tag 
            : state.select_tags.sort().filter(t => !t.startsWith('ru--')).join('/')

        state.discussion_idx[discussions_key] = discussion_idxes

    } else if (parts[0] == 'tags') {
        const tags = {}
        trending_tags.forEach (tag => tags[tag.name] = tag)
        state.tags = tags
    }

    if (accounts.size > 0) {
        const acc = await api.getAccounts(Array.from(accounts))
        acc.forEach(account =>  state.accounts[ account.name ] = account)
    }

    return Promise.resolve(state)
}
