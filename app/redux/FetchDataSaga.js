import { call, put, select, fork, cancelled, takeLatest, takeEvery } from 'redux-saga/effects';
import cookie from "react-cookie";
import {config, api} from 'golos-lib-js';
import { Asset } from 'golos-lib-js/lib/utils'

import { getPinnedPosts, getMutedInNew } from 'app/utils/NormalizeProfile';
import {loadFollows, fetchFollowCount} from 'app/redux/FollowSaga';
import { getBlockings, listBlockings } from 'app/redux/BlockingSaga'
import { contentPrefs as prefs } from 'app/utils/Allowance'
import { applyEventHighlight, getContent } from 'app/redux/SagaShared'
import user from 'app/redux/User'
import GlobalReducer from './GlobalReducer';
import constants from './constants';
import session from 'app/utils/session'
import { getFilterApps, } from 'app/utils/ContentAccess';
import { reveseTag, getFilterTags, isNsfwMeta, nsfwTags } from 'app/utils/tags';
import { PUBLIC_API, CATEGORIES, SELECT_TAGS_KEY, DEBT_TOKEN_SHORT, LIQUID_TICKER } from 'app/client_config';
import { parseNFTImage, NFTImageStub } from 'app/utils/NFTUtils'
import { getSubs, notifyGetViews, } from 'app/utils/NotifyApiClient'
import { SearchRequest, searchData, stateSetVersion } from 'app/utils/SearchClient'
import { hashPermlink, } from 'app/utils/StateFunctions'
import { makeOid, tryDecryptContents, SPONSORS_PER_PAGE } from 'app/utils/sponsors'

export function* fetchDataWatches () {
    yield fork(watchLocationChange);
    yield fork(watchDataRequests);
    yield fork(watchFetchJsonRequests);
    yield fork(watchFetchState);
    yield fork(watchGetContent);
    yield fork(watchFetchExchangeRates);
    yield fork(watchFetchVestingDelegations);
    yield fork(watchFetchUiaBalances);
    yield fork(watchFetchNftTokens)
    yield fork(watchFetchReferrals)
    yield fork(watchFetchReferrers)
}

export function* watchGetContent() {
    yield takeEvery('GET_CONTENT', getContentCaller);
}

export function* getContentCaller(action) {
    yield getContent(action.payload);
}

export function* watchLocationChange() {
    yield takeLatest('@@router/LOCATION_CHANGE', fetchState);
}

export function* watchFetchState() {
    yield takeLatest('FETCH_STATE', fetchState);
}

let is_initial_state = true;
export function* fetchState(location_change_action) {
    const curUser = localStorage.getItem('invite')
    const {pathname} = location_change_action.payload;
    const m = pathname.match(/^\/@([a-z0-9\.-]+)/)
    if(m && m.length === 2) {
        const username = m[1]
        yield fork(fetchFollowCount, username)
        yield fork(loadFollows, "getFollowersAsync", username, 'blog')
        yield fork(loadFollows, "getFollowingAsync", username, 'blog')
        if (curUser) {
            yield fork(getBlockings, curUser, [username])
        }
    }

    // `ignore_fetch` case should only trigger on initial page load. No need to call
    // fetchState immediately after loading fresh state from the server. Details: #593
    const server_location = yield select(state => state.offchain.get('server_location'))
    //const ignore_fetch = (pathname === server_location && is_initial_state)
    is_initial_state = false
    //if(ignore_fetch) return

    let url = `${pathname}`
    url = url.split('?')[0]
    if (url === '/') url = 'trending'

    yield put({type: 'FETCH_DATA_BEGIN'})
    try {
        if (!url || typeof url !== 'string' || !url.length || url === '/') url = 'trending'
        if (url[0] === '/') url = url.substr(1)
        const parts = url.split('/')
        const tag = typeof parts[1] !== "undefined" ? parts[1] : ''

        const state = {}
        state.current_route = location
        state.content = {}
        state.decrypting = false
        state.prev_posts = []
        state.assets = {} // account balances
        state.tokens = []
        state.sponsors = { data: [] }
        state.sponsoreds = { data: [] }
        state.minused_accounts = []
        state.accounts = {}
        state.confetti_nft_active = false

        const authorsForCheck = new Set() // if not blocked by current user
        const checkAuthor = (author) => authorsForCheck.add(author)

        let accounts = new Set()

        const getPost = () => {
            const check = parts.length === 3 && parts[1] && parts[1][0] == '@';
            if (!check) return false;
            const [category, account, permlink] = parts;
            return {category, account: account.substr(1), permlink};
        }
        const getComment = () => {
            const checkParent = parts.length === 4 && parts[1] && parts[1][0] == '@';
            if (!checkParent) return false;
            let [parent_permlink, account] = parts[2].split('#');
            const checkComment = account.length && account[0] == '@';
            if (!checkComment) return false;
            return {category: parts[0], account: account.substr(1), permlink: parts[3]};
        }

        if (parts[0][0] === '@') {
            const uname = parts[0].substr(1)
            const [ account ] = yield call([api, api.getAccountsAsync], [uname])
            state.accounts[uname] = account
            delete state.accounts[uname].discussions

            if (account) {
                state.accounts[uname].tags_usage = yield call([api, api.getTagsUsedByAuthorAsync], uname)
                state.accounts[uname].guest_bloggers = yield call([api, api.getBlogAuthorsAsync], uname)

                const filter_apps = getFilterApps()

                switch (parts[1]) {

                    case 'recent-replies':
                        const replies = yield call([api, api.getRepliesByLastUpdateAsync], uname, '', 50, constants.DEFAULT_VOTE_LIMIT, 0, ['fm-'],
                            { ...prefs(uname, curUser), })
                        state.accounts[uname].recent_replies = []

                        replies.forEach(reply => {
                            const link = `${reply.author}/${reply.permlink}`
                            state.content[link] = reply
                            checkAuthor(reply.author)
                            state.accounts[uname].recent_replies.push(link)
                        })
                    break

                    case 'discussions':
                        state.accounts[uname].discussions = []
                        const accName = session.load().currentName
                        if (accName && uname === accName) {
                            let res, subs
                            try {
                                res = yield getSubs(accName)
                            } catch (err) {
                            }
                            const ids = []
                            if (res && res.result) {
                                subs = res.result.subs
                                for (let sub of subs) {
                                    const [ author, permlink ] = sub.entityId.split('|')
                                    ids.push({
                                        author,
                                        hashlink: sub.hashlink
                                    })
                                }
                            }
                            if (ids.length) {
                                const previews = yield call([api, api.getContentPreviewsAsync], ids, 500, 'false')

                                yield tryDecryptContents(previews)

                                for (const i in previews) {
                                    const { author, permlink } = previews[i]
                                    checkAuthor(author)
                                    const link = `${author}/${permlink}`
                                    state.accounts[uname].discussions.push(link)
                                    state.content[link] = previews[i]
                                    state.content[link].event_count = subs[i] ? subs[i].eventCount : 0
                                }
                            }
                        }
                    break

                    case 'posts':
                    case 'comments':
                        const filter_tags = curUser ? ['test'] : getFilterTags()
                        const comments = yield call([api, api.getDiscussionsByCommentsAsync], { start_author: uname, limit: 20, filter_tag_masks: ['fm-'], filter_tags,
                            prefs: {
                                filter_apps
                            }
                        })
                        state.accounts[uname].comments = []

                        comments.forEach(comment => {
                            const link = `${comment.author}/${comment.permlink}`
                            state.content[link] = comment
                            state.accounts[uname].comments.push(link)
                        })
                    break

                    case 'feed': {
                        const feedEntries = yield call([api, api.getFeedEntriesAsync], uname, 0, 20, ['fm-'])
                        state.accounts[uname].feed = []

                        const ids = []

                        for (const i in feedEntries) {
                            const { author, hashlink } = feedEntries[i]

                            ids.push({ author, hashlink })
                        }

                        const previews = yield call([api, api.getContentPreviewsAsync], ids, 10000, 'false')

                        yield tryDecryptContents(previews)

                        for (const i in previews) {
                            const { author, permlink } = previews[i]
                            const link = `${author}/${permlink}`
                            state.accounts[uname].feed.push(link)
                            state.content[link] = previews[i]

                            checkAuthor(author)

                            if (feedEntries[i].reblog_by.length > 0) {
                                state.content[link].first_reblogged_by = feedEntries[i].reblog_by[0]
                                state.content[link].reblogged_by = feedEntries[i].reblog_by
                                state.content[link].first_reblogged_on = feedEntries[i].reblog_on
                            }
                        }
                    } break

                    case 'reputation':
                        const rhistory = yield call([api, api.getAccountHistoryAsync], uname, -1, 1000, {select_ops: ['account_reputation']});
                        account.reputation_history = [];
                        rhistory.forEach(operation => {
                            const op = operation[1].op;
                            if (op[0] === 'account_reputation' && op[1].author === uname) {
                                state.accounts[uname].reputation_history.push(operation);
                            }
                        });
                    break

                    case 'mentions':
                        const mhistory = yield call([api, api.getAccountHistoryAsync], uname, -1, 1000, {select_ops: ['comment_mention']});
                        account.mentions = [];
                        mhistory.forEach(operation => {
                            const op = operation[1].op;
                            if (op[0] === 'comment_mention' && op[1].mentioned === uname) {
                                state.accounts[uname].mentions.push(operation);
                            }
                        });
                    break

                    case 'settings':
                        yield fork(listBlockings, uname)
                    break

                    case 'sponsors':
                        const oid = makeOid()
                        state.pso = yield call([api, api.getPaidSubscriptionOptionsAsync], {
                            author: uname,
                            oid
                        })
                        if (!state.pso.author) {
                            state.pso.oid = oid
                        }
                        const tokens = yield call([api, api.getAssetsAsync], '', [], '', 5000, 'by_marketed')
                        state.tokens = tokens.filter(t => !t.allow_override_transfer)
                        state.sponsors = {
                            data: yield call([api, api.getPaidSubscribersAsync], {
                                author: uname,
                                oid,
                                sort: 'by_date',
                                from: '', limit: SPONSORS_PER_PAGE + 1
                            })
                        }
                        state.sponsoreds = {
                            data: yield call([api, api.getPaidSubscriptionsAsync], {
                                subscriber: uname,
                                select_oid: oid,
                                start_author: '',
                                sort: 'by_date',
                                limit: SPONSORS_PER_PAGE + 1
                            })
                        }
                    break

                    case 'referrals':
                        state.referrals = { data: [] }
                        state.props = yield call([api, api.getDynamicGlobalProperties])
                    break

                    case 'blog':
                    default:
                        const blogEntries = yield call([api, api.getBlogEntriesAsync], uname, 0, 20, ['fm-'], {})
                        state.accounts[uname].blog = []

                        let pinnedPosts = getPinnedPosts(account)
                        for (const pp of pinnedPosts){
                            const hashlink = hashPermlink(pp.permlink)
                            blogEntries.unshift({
                                author: pp.author, hashlink, reblog_on: pp.reblog_on
                            })
                        }

                        const ids = []

                        for (const i in blogEntries) {
                            const { author, hashlink } = blogEntries[i]

                            ids.push({ author, hashlink })
                        }

                        const previews = yield call([api, api.getContentPreviewsAsync], ids, 10000, 'false')

                        yield tryDecryptContents(previews)

                        for (const i in previews) {
                            const { author, permlink } = previews[i]

                            const link = `${author}/${permlink}`

                            state.content[link] = previews[i]
                            state.accounts[uname].blog.push(link)

                            if (blogEntries[i].reblog_on !== '1970-01-01T00:00:00') {
                                state.content[link].first_reblogged_on = blogEntries[i].reblog_on
                            }
                        }
                    break
                }
            }

        } else if (getPost() || getComment()) {
            const {account, category, permlink} = getPost() || getComment();

            const curl = `${account}/${permlink}`
            state.content[curl] = yield call([api, api.getContentAsync], account, permlink, constants.DEFAULT_VOTE_LIMIT)
            const search = window.location.search
            if (search) {
                yield stateSetVersion(state.content[curl], search)
            }
            accounts.add(account)
            checkAuthor(account)

            try {
                const views =  yield notifyGetViews([state.content[curl].id])
                state.content[curl].views = views.result[0].views || 0
            } catch (err) {
                console.error(err)
                state.content[curl].views = 0
            }

            yield tryDecryptContents([state.content[curl]])

            state.content[curl].donate_list = [];
            if (state.content[curl].donates != '0.000 GOLOS') {
                const donates = yield call([api, api.getDonatesAsync], false, {author: account, permlink: permlink}, '', '', 20, 0, true)
                state.content[curl].donate_list = donates;
            }
            state.content[curl].donate_uia_list = [];
            if (state.content[curl].donates_uia != 0) {
                state.content[curl].donate_uia_list = yield call([api, api.getDonatesAsync], true, {author: account, permlink: permlink}, '', '', 20, 0, true)
            }
            state.content[curl].confetti_active = false

            if (curUser) {
                const ps = yield call([api, api.getPaidSubscribeAsync], {
                    author: account,
                    oid: makeOid(),
                    subscriber: curUser
                })
                if (ps.subscription.author && !ps.subscribe.subscriber) {
                    state.pso = ps.subscription
                }
            }

            yield put(GlobalReducer.actions.receiveState(state))

            const replies =  yield call([api, api.getAllContentRepliesAsync], account, permlink, constants.DEFAULT_VOTE_LIMIT, 0, [], [], false, null, prefs([], [account, curUser]))

            for (let key in replies) {
                let reply = replies[key]
                const link = `${reply.author}/${reply.permlink}`

                accounts.add(reply.author)
                checkAuthor(reply.author)
 
                state.content[link] = reply
                if (reply.parent_permlink === permlink) {
                    state.content[curl].replies.push(link)
                }
                state.content[link].donate_list = [];
                if (state.content[link].donates != '0.000 GOLOS') {
                    const donates =  yield call([api, api.getDonatesAsync], false, {author: reply.author, permlink: reply.permlink}, '', '', 20, 0, true)
                    state.content[link].donate_list = donates;
                }
                state.content[link].donate_uia_list = [];
                if (state.content[link].donates_uia != 0) {
                    state.content[link].donate_uia_list = yield call([api, api.getDonatesAsync], true, {author: reply.author, permlink: reply.permlink}, '', '', 20, 0, true)
                }
                state.content[link].confetti_active = false
                state.content[link].sub_event = false
            }

            yield applyEventHighlight(state.content, account, permlink, curUser)

            const ppFilterTags = isNsfwMeta(state.content[curl].json_metadata) ? [] : nsfwTags()
            const filter_apps = getFilterApps()
            let args = { truncate_body: 128, select_categories: [category], filter_tag_masks: ['fm-'],
                filter_tags: [...getFilterTags(), ...ppFilterTags],
                prefs: { ...prefs(curUser), filter_apps } };
            let prev_posts = yield call([api, api[PUBLIC_API.created]], {limit: 4, start_author: account, start_permlink: permlink, select_authors: [account], ...args});
            prev_posts = prev_posts.slice(1);
            let p_ids = [];
            for (let p of prev_posts) {
                p_ids.push(p.author + p.permlink);
            }
            if (prev_posts.length < 3) {
                let trend_posts = yield call([api, api[PUBLIC_API.trending]], {limit: 4, ...args});
                for (let p of trend_posts) {
                    if (p.author === account && p.permlink === permlink) continue;
                    if (p_ids.includes(p.author + p.permlink)) continue;
                    prev_posts.push(p);
                    p_ids.push(p.author + p.permlink);
                }
            }
            if (prev_posts.length < 3) {
                delete args.select_categories;
                let author_posts = yield call([api, api[PUBLIC_API.author]], {limit: 4, select_authors: [account], ...args});
                for (let p of author_posts) {
                    if (p.author === account && p.permlink === permlink) continue;
                    if (p_ids.includes(p.author + p.permlink)) continue;
                    prev_posts.push(p);
                }
            }
            state.prev_posts = prev_posts.slice(0, 3);

            if (curUser) {
                state.assets = (yield call([api, api.getAccountsBalancesAsync], [curUser]))[0]
            }

            console.log('Full post load');
        } else if (parts[0] === 'minused_accounts') {
            const mhistory = yield call([api, api.getAccountHistoryAsync], 'null', -1, 1000, {select_ops: ['minus_reputation']});
            state.minused_accounts = [];
            mhistory.forEach(operation => {
                const op = operation[1].op;
                if (op[0] === 'minus_reputation' && op[1].author !== 'null') {
                    state.minused_accounts.push(operation);
                }
            });
        } else if (parts[0] === 'referrers') {
            state.referrers = { data: [] }
            state.props = yield call([api, api.getDynamicGlobalProperties])
        } else if (Object.keys(PUBLIC_API).includes(parts[0])) {

            yield call(fetchData, {payload: { order: parts[0], category : tag }})

        } else if (parts[0] == 'tags') {
            const tags = {}
            const trending_tags = yield call([api, api.getTrendingTagsAsync], '', 250)
            trending_tags.forEach (tag => tags[tag.name] = tag)
            state.tags = tags
        }

        if (accounts.size > 0) {
            const acc = yield call([api, api.getAccountsAsync], Array.from(accounts))
            for (let i in acc) {
                state.accounts[ acc[i].name ] = acc[i]
            }
        }
    
        if (curUser && authorsForCheck.size) {
            yield fork(getBlockings, curUser, [...authorsForCheck])
        }

        yield put(GlobalReducer.actions.receiveState(state))
        yield put({type: 'FETCH_DATA_END'})
    } catch (error) {
        console.error('~~ Saga fetchState error ~~>', url, error);
        yield put({type: 'global/FETCHING_STATE', payload: false});
        yield put({type: 'global/CHAIN_API_ERROR', error: error.message});

        if (!(yield cancelled())) {
            yield put({type: 'FETCH_DATA_END'})
        }
    }
}

export function* watchDataRequests() {
    yield takeLatest('REQUEST_DATA', fetchData);
}

export function* fetchData(action) {
    const {
        order,
        author,
        permlink,
        accountname,
        keys,
        from,
    } = action.payload;

    const curUser = localStorage.getItem('invite')

    let ignore_tags = getFilterTags()
    let filter_apps = getFilterApps()

    let { category } = action.payload;

    if( !category ) category = "";
    category = category.toLowerCase();

    let call_name, args;
    args = [
        {
            limit: constants.FETCH_DATA_BATCH_SIZE,
            truncate_body: constants.FETCH_DATA_TRUNCATE_BODY,
            start_author: author,
            start_permlink: permlink,
            filter_tag_masks: ['fm-'],
            prefs: { ...prefs(curUser), filter_apps, filter_special: true }
        }
    ];
    if (category.length && (!category.startsWith('tag-') || category.length > 4)) {
        if (category.startsWith('tag-')) {
            let tag_raw = category.slice(4);
            const reversed = reveseTag(tag_raw)
            reversed
                ? args[0].select_tags = [tag_raw, reversed]
                : args[0].select_tags = [tag_raw]
        } else {
            const reversed = reveseTag(category)
            reversed
                ? args[0].select_categories = [category, reversed]
                : args[0].select_categories = [category]
        }
    } else {
        let select_tags = cookie.load(SELECT_TAGS_KEY);
        if (select_tags && select_tags.length) {
            let selectTags = []
            
            select_tags.forEach( t => {
                const reversed = reveseTag(t)
                reversed
                ? selectTags = [ ...selectTags, t, reversed ]
                : selectTags = [ ...selectTags, t, ] 
                
            })
            args[0].select_categories = selectTags;
            category = select_tags.sort().join('/')
        } else {
            let selectTags = []
            
            CATEGORIES.forEach( t => {
                const reversed = reveseTag(t)
                reversed
                ? selectTags = [ ...selectTags, t, reversed ]
                : selectTags = [ ...selectTags, t, ] 
                
            })
            args[0].select_categories = selectTags;
        }
    }

    args[0].filter_tags = ignore_tags

    if (order == 'created' && curUser) {
        const [ loader ] = yield call([api, api.getAccountsAsync], [curUser])
        const mutedInNew = getMutedInNew(loader);
        args[0].filter_authors = mutedInNew;
    }

    yield put({ type: 'global/FETCHING_DATA', payload: { order, category } });

    if (order === 'trending') {
        call_name = PUBLIC_API.trending;
    } else if (order === 'promoted') {
        call_name = PUBLIC_API.promoted;
    } else if( order === 'active' ) {
        call_name = PUBLIC_API.active;
    } else if( order === 'allposts' ) {
        call_name = PUBLIC_API.allposts;
        args[0].comments_only = false;
        delete args[0].select_tags;
        delete args[0].select_categories;
        delete args[0].filter_tag_masks; // do not exclude forum posts
        delete args[0].filter_tags;
        delete args[0].prefs
    } else if( order === 'allcomments' ) {
        call_name = PUBLIC_API.allcomments;
        args[0].comments_only = true;
        delete args[0].select_tags;
        delete args[0].select_categories;
        delete args[0].filter_tag_masks; // do not exclude forum comments
        delete args[0].filter_tags;
        delete args[0].prefs
    } else if( order === 'created' ) {
        call_name = PUBLIC_API.created;
    } else if( order === 'responses' ) {
        call_name = PUBLIC_API.responses;
    } else if( order === 'donates' ) {
        call_name = PUBLIC_API.donates;
    } else if( order === 'hot' ) {
        call_name = PUBLIC_API.hot;
    } else if( order === 'by_feed' ) {
        args[0].filter_tags = args[0].filter_tags.filter(tag => tag !== 'onlyblog')
        call_name = 'getDiscussionsByFeedAsync';
        delete args[0].select_tags;
        delete args[0].select_categories;
        args[0].select_authors = [accountname];
    } else if (order === 'by_author') {
        call_name = 'getDiscussionsByBlogAsync';
        args[0].filter_tags = args[0].filter_tags.filter(tag => tag !== 'onlyblog')
        delete args[0].select_tags;
        delete args[0].select_categories;
        delete args[0].prefs
        args[0].select_authors = [accountname];
    } else if (order === 'by_comments') {
        delete args[0].select_tags;
        delete args[0].select_categories;
        delete args[0].prefs
        if (curUser) {
            args[0].filter_tags = ['test'] // remove onlyapp and onlyblog, because it is only inside profile
        }
        call_name = 'getDiscussionsByCommentsAsync';
    } else if( order === 'by_replies' ) {
        call_name = 'getRepliesByLastUpdateAsync';
        args = [author, permlink, constants.FETCH_DATA_BATCH_SIZE, constants.DEFAULT_VOTE_LIMIT, 0, ['fm-'],
            prefs(author, curUser)]
    } else if (order === 'forums') {
        call_name = PUBLIC_API.forums;
        args = [author, permlink, 0, constants.FETCH_DATA_BATCH_SIZE, $STM_Config.forums.white_list, 0, 0, [], [], 'fm-',
            prefs(curUser)]
    } else {
        call_name = PUBLIC_API.active;
    }
    yield put({ type: 'FETCH_DATA_BEGIN' });

    try {
        let data = []

        if (!from) {
            data =yield call([api, api[call_name]], ...args);

            if (order === 'forums') {
                data = data['fm-'];
            }

            if (['created', 'responses', 'donates', 'trending'].includes(order) && !args[0].start_author) {
              // Add top 3 from promo to tranding and 1 to hot, created
              args[0].limit = order == 'trending' ? 3 : 1
              const promo_posts = yield call([api, api[PUBLIC_API.promoted]], ...args);
              data = promo_posts.concat(data)
            }
        }

        let has_from_search = false
        let next_from = 0

        if (['created', 'responses', 'donates', 'trending'].includes(order) && data.length < constants.FETCH_DATA_BATCH_SIZE) {
            let odt = new Date()
            odt.setDate(odt.getDate() - 7)
            let req = new SearchRequest()
                .setLimit(50)
                .setFrom(from)
                .onlyPosts()
                .olderThan(odt)
                .filterTags(ignore_tags)
            if (args[0].select_categories) {
                req = req.byOneOfCategories(args[0].select_categories)
            } else if (args[0].select_tags) {
                req = req.byOneOfTags(args[0].select_tags)
            }
            const firstPage = !author && !permlink
            let searchRes = null
            try {
                searchRes = yield searchData(req, firstPage ? 0 : 3, 2, 10000, curUser)
            } catch (searchErr) {
            }
            if (searchRes) {
                let { results, total } = searchRes
                let sepAdded = !!from
                results.forEach(post => {
                    post.from_search = true
                    if (!post.net_rshares && !post.net_votes && !post.children) {
                        post.force_hide = true
                    }
                    if (!sepAdded) {
                        post.total_search = total
                        sepAdded = true
                    }
                    data.push(post)
                })
                if (firstPage) {
                    has_from_search = true
                }
                next_from = (from || 0) + results.length
            }
        }

        yield tryDecryptContents(data)

        yield put(
            GlobalReducer.actions.receiveData({
                data,
                order,
                category,
                author,
                permlink,
                accountname,
                keys,
                has_from_search,
                next_from,
            })
        );


        yield put({ type: 'FETCH_DATA_END' });
    } catch (error) {
        console.error('~~ Saga fetchData error ~~>', call_name, args, error);
        yield put({ type: 'global/CHAIN_API_ERROR', error: error.message });

        if (!(yield cancelled())) {
            yield put({ type: 'FETCH_DATA_END' });
        }
    }
}

export function* watchFetchJsonRequests() {
    yield takeEvery('global/FETCH_JSON', fetchJson);
}

/**
    @arg {string} id unique key for result global['fetchJson_' + id]
    @arg {string} url
    @arg {object} body (for JSON.stringify)
*/
function* fetchJson({payload: {id, url, body, successCallback, skipLoading = false}}) {
    try {
        const payload = {
            method: body ? 'POST' : 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: body ? JSON.stringify(body) : undefined
        }
        yield put({type: 'global/FETCHING_JSON', payload: true});
        let result = yield skipLoading ? fetch(url, payload) : call(fetch, url, payload)
        result = yield result.json()
        if (successCallback) result = successCallback(result)
        yield put({type: 'global/FETCHING_JSON', payload: false});
        yield put(GlobalReducer.actions.fetchJsonResult({id, result}))
    } catch(error) {
        console.error('fetchJson', error)
        yield put({type: 'global/FETCHING_JSON', payload: false});
        yield put(GlobalReducer.actions.fetchJsonResult({id, error}))
    }
}

export function* watchFetchExchangeRates() {
    yield takeEvery('global/FETCH_EXCHANGE_RATES', fetchExchangeRates);
}

export function* fetchExchangeRates() {
  const fourHours = 1000 * 60 * 60 * 4;

  try {
    const created = 0;
    let pickedCurrency = 'GOLOS';
    if (pickedCurrency.localeCompare(DEBT_TOKEN_SHORT) == 0) {
        storeExchangeValues(1, 1, 1, DEBT_TOKEN_SHORT); // For GBG currency on site #687
        return;
    }
    if (pickedCurrency.localeCompare(LIQUID_TICKER) == 0) { // For Golos currency on site #687
        const feedPrice = yield call([api, api.getCurrentMedianHistoryPriceAsync]);
        let pricePerGolos = feedPrice.base.split(' ')[0] / parseFloat(parseFloat(feedPrice.quote.split(' ')[0] ));
        storeExchangeValues(1, 1, pricePerGolos, pickedCurrency);
        return;
    }
    if (Date.now() - created < fourHours) {
      return;
    }
    // xchange rates are outdated or not exists
    console.log('xChange rates are outdated or not exists, fetching...')

    yield put({type: 'global/FETCHING_JSON', payload: true});

    let result = yield call(fetch, '/api/v1/rates/');
    result = yield result.json();

    if (result.error) {
      console.log('~~ Saga fetchExchangeRates error ~~>', '[0] The result is undefined.');
      storeExchangeValues();
      yield put({type: 'global/FETCHING_XCHANGE', payload: false});
      return;
    }
    if (
      typeof result === 'object' &&
      typeof result.rates === 'object' &&
      typeof result.rates.XAU === 'number' &&
      typeof result.rates[pickedCurrency] === 'number'
    ) {
      // store result into localstorage
      storeExchangeValues(Date.now(), 1/result.rates.XAU, result.rates[pickedCurrency], pickedCurrency);
    }
    else {
      console.log('~~ Saga fetchExchangeRates error ~~>', 'The result is undefined.');
      storeExchangeValues();
    }
    yield put({type: 'global/FETCHING_XCHANGE', payload: false});
  }
  catch(error) {
    // set default values
    storeExchangeValues();
    console.error('~~ Saga fetchExchangeRates error ~~>', error);
    yield put({type: 'global/FETCHING_XCHANGE', payload: false});
  }
}

function storeExchangeValues(created, gold, pair, picked) {
  localStorage.setItem('xchange.created', created || 0);
  localStorage.setItem('xchange.gold', gold || 1);
  localStorage.setItem('xchange.pair', pair || 1);
  localStorage.setItem('xchange.picked', picked || DEBT_TOKEN_SHORT);
}

export function* watchFetchVestingDelegations() {
    yield takeLatest('global/FETCH_VESTING_DELEGATIONS', fetchVestingDelegations)
}

export function* fetchVestingDelegations({ payload: { account, type } }) {
    const r = yield call([ api, api.getVestingDelegationsAsync ], account, '', 100, type)

    const vesting_delegations = {}
    for (let v in r) {
        vesting_delegations[ type === 'delegated' ? r[v].delegatee : r[v].delegator ] = r[v]
    }

    yield put(GlobalReducer.actions.receiveAccountVestingDelegations({ account, type, vesting_delegations }))
}

export function* watchFetchUiaBalances() {
    yield takeLatest('global/FETCH_UIA_BALANCES', fetchUiaBalances)
}

export function* fetchUiaBalances({ payload: { account } }) {
    try {
        let assets = yield call([api, api.getAccountsBalancesAsync], [account])
        assets = assets && assets[0]
        if (assets) {
            yield put(GlobalReducer.actions.receiveUiaBalances({assets}))
        }
    } catch (err) {
        console.error('fetchUiaBalances', err)
    }
}

export function* watchFetchNftTokens() {
    yield takeLatest('global/FETCH_NFT_TOKENS', fetchNftTokens)
}

export function* fetchNftTokens({ payload: { account, start_token_id } }) {
    try {
        const limit = 10

        const nft_tokens = yield call([api, api.getNftTokensAsync], {
            owner: account,
            state: 'not_selling_only',
            start_token_id,
            limit: limit + 1
        })

        let next_from
        if (nft_tokens.length > limit) {
            next_from = nft_tokens.pop().token_id
        }

        const syms = new Set()

        let nft_assets

        try {
            for (const no of nft_tokens) {
                no.image = parseNFTImage(no.json_metadata) || NFTImageStub()

                const price = Asset(no.last_buy_price)
                syms.add(price.symbol)
            }

            nft_assets = {}
            if (syms.size) {
                const assets = yield call([api, api.getAssets], '', [...syms])
                for (const a of assets) {
                    const supply = Asset(a.supply)
                    nft_assets[supply.symbol] = a
                }
            }
        } catch (err) {
            console.error(err)
        }

        yield put(GlobalReducer.actions.receiveNftTokens({nft_tokens, start_token_id, next_from, nft_assets}))
    } catch (err) {
        console.error('fetchNftTokens', err)
    }
}

export function* watchFetchReferrals() {
    yield takeLatest('global/FETCH_REFERRALS', fetchReferrals)
}

export function* fetchReferrals({ payload: { referrer, start_name, sort } }) {
    try {
        const limit = 20

        const referrals = yield call([api, api.getReferralsAsync], {
            referrer,
            start_name,
            limit: limit + 1,
            sort: sort || 'by_joined',
        })

        const usernames = new Set()
        for (const referral of referrals) {
            usernames.add(referral.account)
        }

        yield put(user.actions.getAccount({ usernames: [...usernames], }))

        let next_start_name
        if (referrals.length > limit) {
            next_start_name = referrals.pop().account
        }

        yield put(GlobalReducer.actions.receiveReferrals({ referrals, start_name, next_start_name }))
    } catch (err) {
        console.error('fetchReferrals', err)
    }
}

export function* watchFetchReferrers() {
    yield takeLatest('global/FETCH_REFERRERS', fetchReferrers)
}

export function* fetchReferrers({ payload: { start_name, sort } }) {
    try {
        const limit = 20

        const referrers = yield call([api, api.getReferrersAsync], {
            start_name,
            limit: limit + 1,
            sort: sort || 'by_referral_count',
        })

        let next_start_name
        if (referrers.length > limit) {
            next_start_name = referrers.pop().account
        }

        yield put(GlobalReducer.actions.receiveReferrers({ referrers, start_name, next_start_name }))
    } catch (err) {
        console.error('fetchReferrers', err)
    }
}
