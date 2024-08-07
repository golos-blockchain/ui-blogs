import { PUBLIC_API, CATEGORIES } from 'app/client_config';
import { contentPrefs as prefs } from 'app/utils/Allowance'
import { getFilterApps, } from 'app/utils/ContentAccess'
import { getPinnedPosts, getMutedInNew } from 'app/utils/NormalizeProfile';
import { reveseTag, prepareTrendingTags, getFilterTags, isNsfwMeta, nsfwTags } from 'app/utils/tags'
import { stateSetVersion } from 'app/utils/SearchClient'
import { makeOid, markEncryptedContent, SPONSORS_PER_PAGE } from 'app/utils/sponsors'

const DEFAULT_VOTE_LIMIT = 10000

const isHardfork = (v) => v.split('.')[1] === '18'

export default async function getState(api, url, offchain = {}) {
    const curUser = offchain.account

    if (!url || typeof url !== 'string' || !url.length || url === '/') url = 'trending'
    const urlParts = url.split('?')
    url = urlParts[0]
    if (url[0] === '/') url = url.substr(1)
    
    const parts = url.split('/')
    // decode tag for cyrillic symbols
    const tag = typeof parts[1] !== 'undefined' ? decodeURIComponent(parts[1]) : ''

    let has_encrypted = false

    const state = {}
    state.current_route = `/${url}`
    state.props = await api.getDynamicGlobalProperties()
    state.chain_failure = state.props.chain_status === false
    state.categories = {}
    state.tags = {}
    state.content = {}
    state.decrypting = false
    state.prev_posts = []
    state.assets = {} // account balances
    state.tokens = []
    state.sponsors = { data: [] }
    state.sponsoreds = { data: [] }
    state.minused_accounts = []
    state.accounts = {}
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

            const filter_apps = getFilterApps()

            switch (parts[1]) {
                case 'recent-replies':
                    const replies = await api.getRepliesByLastUpdate(uname, '', 50, DEFAULT_VOTE_LIMIT,
                        { ...prefs(curUser, uname), })
                    state.accounts[uname].recent_replies = []

                    replies.forEach(reply => {
                        const link = `${reply.author}/${reply.permlink}`
                        state.content[link] = reply
                        state.accounts[uname].recent_replies.push(link)
                    })
                break

                case 'posts':
                case 'comments':
                    const filter_tags = curUser ? [] : getFilterTags()
                    const comments = await api.getDiscussionsByComments({ start_author: uname, limit: 20, filter_tag_masks: ['fm-'],
                         filter_tags, prefs: {
                            filter_apps
                         } })
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

                        markEncryptedContent(state.content[link], state)
                    }
                break

                case 'reputation':
                    const rhistory = await api.getAccountHistory(uname, -1, 1000, [], ['account_reputation']);
                    account.reputation_history = [];

                    rhistory.forEach(operation => {
                        const op = operation[1].op;
                        if (op[0] === 'account_reputation' && op[1].author === uname) {
                            state.accounts[uname].reputation_history.push(operation);
                        }
                    });
                break

                case 'mentions':
                    const mhistory = await api.getAccountHistory(uname, -1, 1000, [], ['comment_mention']);
                    account.mentions = [];

                    mhistory.forEach(operation => {
                        const op = operation[1].op;
                        if (op[0] === 'comment_mention' && op[1].mentioned === uname) {
                            state.accounts[uname].mentions.push(operation);
                        }
                    });
                break

                case 'sponsors':
                    const oid = makeOid()
                    state.pso = await api.getPaidSubscriptionOptions({
                        author: uname,
                        oid
                    })
                    if (!state.pso.author) {
                        state.pso.oid = oid
                    }
                    const tokens = await api.getAssets('', [], '', 5000, 'by_marketed')
                    state.tokens = tokens.filter(t => !t.allow_override_transfer)
                    state.sponsors = {
                        data: await api.getPaidSubscribers({
                            author: uname,
                            oid,
                            sort: 'by_date',
                            from: '', limit: SPONSORS_PER_PAGE + 1
                        })
                    }
                    state.sponsoreds = {
                        data: await api.getPaidSubscriptions({
                            subscriber: uname,
                            select_oid: oid,
                            start_author: '',
                            sort: 'by_date',
                            limit: SPONSORS_PER_PAGE + 1
                        })
                    }
                break

                case 'blog':
                default:
                    const blogEntries = await api.getBlogEntries(uname, 0, 20, ['fm-'], {})
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

                        markEncryptedContent(state.content[link], state)
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
        if (urlParts[1]) {
            await stateSetVersion(state.content[curl], urlParts[1])
        }
        accounts.add(account)

        markEncryptedContent(state.content[curl])

        const replies = await api.getAllContentReplies(account, permlink, DEFAULT_VOTE_LIMIT, prefs([], [account, curUser]))

       for (let key in replies) {
            let reply = replies[key]
            const link = `${reply.author}/${reply.permlink}`

            state.content[link] = reply
            accounts.add(reply.author)
            if (reply.parent_permlink === permlink) {
                state.content[curl].replies.push(link)
            }
            state.content[link].donate_list = [];
            if (state.content[link].donates != '0.000 GOLOS') {
                const donates = await api.getDonates(false, {author: reply.account, permlink: reply.permlink}, '', '', 20, 0);
                state.content[link].donate_list = donates;
            }
            state.content[link].donate_uia_list = [];
            if (state.content[link].donates_uia != 0) {
                state.content[link].donate_uia_list = await api.getDonates(true, {author: reply.account, permlink: reply.permlink}, '', '', 20, 0);
            }
            state.content[link].confetti_active = false;
        }

        state.content[curl].donate_list = [];
        if (state.content[curl].donates != '0.000 GOLOS') {
            const donates = await api.getDonates(false, {author: account, permlink: permlink}, '', '', 20, 0);
            state.content[curl].donate_list = donates;
        }
        state.content[curl].donate_uia_list = [];
        if (state.content[curl].donates_uia != 0) {
            state.content[curl].donate_uia_list = await api.getDonates(true, {author: account, permlink: permlink}, '', '', 20, 0);
        }
        state.content[curl].confetti_active = false;

        const ppFilterTags = isNsfwMeta(state.content[curl].json_metadata) ? [] : nsfwTags()
        const filter_apps = getFilterApps()
        let args = { truncate_body: 1024, select_categories: [category], filter_tag_masks: ['fm-'],
            filter_tags: [...getFilterTags(), ...ppFilterTags],
            prefs: { ...prefs(curUser), filter_apps, } };
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

        if (curUser) {
            state.assets = (await api.getAccountsBalances([curUser]))[0]

            const ps = await api.getPaidSubscribe({
                author: account,
                oid: makeOid(),
                subscriber: curUser
            })
            if (ps.subscription.author && !ps.subscribe.subscriber) {
                state.pso = ps.subscription
            }
        }
    } else if (parts[0] === 'minused_accounts') {
        const mhistory = await api.getAccountHistory('null', -1, 1000, [], ['minus_reputation']);
        state.minused_accounts = [];
        mhistory.forEach(operation => {
            const op = operation[1].op;
            if (op[0] === 'minus_reputation' && op[1].author !== 'null') {
                state.minused_accounts.push(operation);
            }
        });
    } else if (Object.keys(PUBLIC_API).includes(parts[0])) {
        const filter_apps = getFilterApps()
        let args = { limit: 20, truncate_body: 0,
            prefs: { ...prefs(curUser), filter_apps, filter_special: true } }
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
            }
        }
        args.filter_tags = getFilterTags()
        if (args.select_tags) {
            args.select_tags = args.select_tags.filter(tag => !args.filter_tags.includes(tag))
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

        if (discussionsType == 'created' && curUser) {
            const [ loader ] = await api.getAccounts([curUser]);
            const mutedInNew = getMutedInNew(loader);
            args.filter_authors = mutedInNew;
        }
        if (discussionsType == 'allposts') {
            args.comments_only = false;
            delete args.select_tags;
            delete args.select_categories;
            delete args.filter_tag_masks; // do not exclude forum posts
            delete args.filter_tags;
            delete args.prefs
        }
        if (discussionsType == 'allcomments') {
            args.comments_only = true;
            delete args.select_tags;
            delete args.select_categories;
            delete args.filter_tag_masks; // do not exclude forum comments
            delete args.filter_tags;
            delete args.prefs
        }
        if (discussionsType == 'forums') {
            args = ['', '', 0, args.limit, $STM_Config.forums.white_list, 0, 0, [], [], 'fm-',
                prefs(curUser)];
        }
        requests.push(api.gedDiscussionsBy(discussionsType, args))
        let responses = await Promise.all(requests)

        // Warning! Should be updated if changing requests.push order
        if (discussionsType == 'forums') {
            responses[responses.length - 1] = responses[responses.length - 1]['fm-'];
        }

        const discussions = [].concat(...responses)

        discussions.forEach(discussion => {
            const link = `${discussion.author}/${discussion.permlink}`
            if (!discussion_idxes[discussionsType].includes(link)) {
              discussion_idxes[discussionsType].push(link)
            }
            state.content[link] = discussion

            markEncryptedContent(state.content[link], state)
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
