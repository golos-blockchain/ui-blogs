import { createSlice } from '@reduxjs/toolkit';
import cloneDeep from 'lodash/cloneDeep';
import getPath from 'lodash/get';
import mergeWith from 'lodash/mergeWith';
import setPath from 'lodash/set';
import unset from 'lodash/unset';

import { emptyContent } from 'app/redux/EmptyState';
import constants from './constants';
import { contentStats } from 'app/utils/StateFunctions';

const arrayReplace = (objValue, srcValue) =>
    Array.isArray(srcValue) ? srcValue : undefined;

const cloneEmptyContent = () => cloneDeep(emptyContent);

const mergePlain = (target, ...sources) =>
    mergeWith(target, ...sources, arrayReplace);

const postKey = ({ author, permlink }) => `${author}/${permlink}`;

function ensureObjectAt(state, key, fallback = {}) {
    const current = getPath(state, key);
    if (current === undefined || current === null) {
        setPath(state, key, cloneDeep(fallback));
        return getPath(state, key);
    }
    return current;
}

function ensureArrayAt(state, key) {
    const current = getPath(state, key);
    if (!Array.isArray(current)) {
        setPath(state, key, []);
        return getPath(state, key);
    }
    return current;
}

function updateAtPath(state, key, notSet, updater) {
    const path = Array.isArray(key) ? key : [key];
    const current = path.length ? getPath(state, path) : state;
    const source = current === undefined ? cloneDeep(notSet) : current;
    const next = updater(source);

    if (!path.length) {
        if (next && next !== state) {
            Object.keys(state).forEach(stateKey => delete state[stateKey]);
            Object.assign(state, next);
        }
        return;
    }

    setPath(state, path, next === undefined ? source : next);
}

function upsertNftAssets(state, nft_assets, start_token_id) {
    if (!start_token_id) {
        state.nft_assets = nft_assets;
    } else {
        state.nft_assets = mergePlain(state.nft_assets || {}, nft_assets);
    }
}

const globalSlice = createSlice({
    name: 'global',
    initialState: { status: {} },
    reducers: {
        setCollapsed(state, action) {
            const content = ensureObjectAt(state, [
                'content',
                action.payload.post,
            ]);
            content.collapsed = action.payload.collapsed;
        },
        fetchingState(state, { payload: fetching }) {
            state.fetching = fetching;
        },
        fetchingJson(state, { payload: fetchingJson }) {
            state.fetchingJson = fetchingJson;
        },
        fetchingXchange(state, { payload: fetchingXchange }) {
            state.fetchingXchange = fetchingXchange;
        },
        receiveState(state, action) {
            const payload = cloneDeep(action.payload || {});
            if (payload.content) {
                Object.keys(payload.content).forEach(key => {
                    const content = mergePlain(
                        cloneEmptyContent(),
                        payload.content[key]
                    );
                    content.stats = contentStats(content);
                    payload.content[key] = content;
                });
            }

            state.sponsors = state.sponsors || {};
            state.sponsors.data = [];
            if (!Object.prototype.hasOwnProperty.call(payload, 'pso')) {
                delete state.pso;
            }

            state.sponsoreds = state.sponsoreds || {};
            state.sponsoreds.data = [];
            if (!Object.prototype.hasOwnProperty.call(payload, 'referrals')) {
                delete state.referrals;
            }
            if (!Object.prototype.hasOwnProperty.call(payload, 'referrers')) {
                delete state.referrers;
            }
            delete state.nft_tokens;

            mergePlain(state, payload);

            if (state.content && payload.content) {
                Object.keys(state.content).forEach(key => {
                    if (
                        !getPath(payload, ['content', key, 'versions']) &&
                        state.content[key]
                    ) {
                        delete state.content[key].versions;
                    }
                });
            }
        },
        receiveAccount(state, { payload: { account } }) {
            if (!account) return;
            state.accounts = state.accounts || {};
            state.accounts[account.name] = mergePlain(
                {},
                state.accounts[account.name] || {},
                cloneDeep(account)
            );
        },
        receiveComment(state, { payload: op }) {
            const {
                author,
                permlink,
                parent_author = '',
                parent_permlink = '',
                title = '',
                body,
            } = op;
            const key = `${author}/${permlink}`;
            const content = ensureObjectAt(state, ['content', key], cloneEmptyContent());

            Object.assign(content, {
                author,
                permlink,
                parent_author,
                parent_permlink,
                title: title.toString('utf-8'),
                body: body.toString('utf-8'),
            });

            if (parent_author !== '' && parent_permlink !== '') {
                const parent_key = `${parent_author}/${parent_permlink}`;
                const replies = ensureArrayAt(state, [
                    'content',
                    parent_key,
                    'replies',
                ]);
                replies.unshift(key);
                setPath(
                    state,
                    ['content', parent_key, 'children'],
                    replies.length
                );
            }
        },
        receiveContent(state, { payload: { content } }) {
            const key = postKey(content);
            const nextContent = mergePlain(
                cloneEmptyContent(),
                cloneDeep(state.content && state.content[key] ? state.content[key] : {})
            );
            delete nextContent.active_votes;
            mergePlain(nextContent, cloneDeep(content));
            nextContent.stats = contentStats(nextContent);
            setPath(state, ['content', key], nextContent);
        },
        markSubRead(state, { payload: { author, permlink } }) {
            const key = `${author}/${permlink}`;
            const content = ensureObjectAt(state, ['content', key], {});
            content.highlighted = false;
            content.event_count = 0;
        },
        receiveWorkerRequest(state, { payload: { wr } }) {
            const url = postKey(wr.post);
            const request = cloneDeep(wr);
            delete request.votes;
            state.worker_requests = state.worker_requests || {};
            state.worker_requests[url] = mergePlain(
                {},
                state.worker_requests[url] || {},
                request
            );
        },
        fetchUiaBalances() {
            // Saga-only action.
        },
        receiveUiaBalances(state, { payload: { assets } }) {
            state.assets = assets;
        },
        fetchNftTokens() {
            // Saga-only action.
        },
        receiveNftTokens(
            state,
            { payload: { nft_tokens, start_token_id, next_from, nft_assets } }
        ) {
            if (!state.nft_tokens) {
                state.nft_tokens = {
                    data: nft_tokens,
                    next_from,
                };
            } else {
                state.nft_tokens.data = state.nft_tokens.data || [];
                state.nft_tokens.data.push(...nft_tokens);
                state.nft_tokens.next_from = next_from;
            }
            if (nft_assets) {
                upsertNftAssets(state, nft_assets, start_token_id);
            }
        },
        fetchReferrals() {
            // Saga-only action.
        },
        receiveReferrals(
            state,
            { payload: { referrals, start_name, next_start_name } }
        ) {
            if (!start_name) {
                state.referrals = {
                    data: referrals,
                    next_start_name,
                    loaded: true,
                };
            } else {
                state.referrals = state.referrals || { data: [] };
                state.referrals.data = state.referrals.data || [];
                state.referrals.data.push(...referrals);
                state.referrals.next_start_name = next_start_name;
            }
        },
        fetchReferrers() {
            // Saga-only action.
        },
        receiveReferrers(
            state,
            { payload: { referrers, start_name, next_start_name } }
        ) {
            if (!start_name) {
                state.referrers = {
                    data: referrers,
                    next_start_name,
                    loaded: true,
                };
            } else {
                state.referrers = state.referrers || { data: [] };
                state.referrers.data = state.referrers.data || [];
                state.referrers.data.push(...referrers);
                state.referrers.next_start_name = next_start_name;
            }
        },
        linkReply(state, { payload: op }) {
            const {
                author,
                permlink,
                parent_author = '',
                parent_permlink = '',
            } = op;

            if (parent_author === '' || parent_permlink === '') return;

            const key = `${author}/${permlink}`;
            const parent_key = `${parent_author}/${parent_permlink}`;
            const replies = ensureArrayAt(state, [
                'content',
                parent_key,
                'replies',
            ]);
            if (!replies.includes(key)) replies.push(key);
            setPath(state, ['content', parent_key, 'children'], replies.length);
        },
        updateAccountWitnessVote(
            state,
            { payload: { account, witness, approve } }
        ) {
            const votes = ensureArrayAt(state, [
                'accounts',
                account,
                'witness_votes',
            ]);
            const idx = votes.indexOf(witness);
            if (approve && idx === -1) {
                votes.push(witness);
            } else if (!approve && idx !== -1) {
                votes.splice(idx, 1);
            }
        },
        updateAccountWitnessProxy(state, { payload: { account, proxy } }) {
            setPath(state, ['accounts', account, 'proxy'], proxy);
        },
        deleteContent(state, { payload: { author, permlink } }) {
            const key = `${author}/${permlink}`;
            const content = getPath(state, ['content', key]);
            const parentAuthor = (content && content.parent_author) || '';
            const parentPermlink = (content && content.parent_permlink) || '';
            unset(state, ['content', key]);

            if (parentAuthor !== '' && parentPermlink !== '') {
                const parent_key = `${parentAuthor}/${parentPermlink}`;
                const replies = getPath(state, [
                    'content',
                    parent_key,
                    'replies',
                ]);
                if (Array.isArray(replies)) {
                    setPath(
                        state,
                        ['content', parent_key, 'replies'],
                        replies.filter(item => item !== key)
                    );
                }
            }
        },
        voted(state, { payload: { username, author, permlink, weight } }) {
            const votes = ensureArrayAt(state, [
                'content',
                `${author}/${permlink}`,
                'active_votes',
            ]);
            const vote = { voter: username, percent: weight };
            const idx = votes.findIndex(v => v.voter === username);

            if (idx === -1) {
                votes.push(vote);
            } else {
                votes[idx] = vote;
            }
        },
        donated(state, { payload: { username, author, permlink, amount } }) {
            const contentPath = ['content', `${author}/${permlink}`];
            setPath(state, [...contentPath, 'confetti_active'], true);
            const donateListKey = amount.endsWith('GOLOS')
                ? 'donate_list'
                : 'donate_uia_list';
            const donateList = ensureArrayAt(state, [
                ...contentPath,
                donateListKey,
            ]);
            const idx = donateList.findIndex(
                v =>
                    v.from === username &&
                    v.amount.split(' ')[1] === amount.split(' ')[1]
            );

            if (idx === -1) {
                donateList.push({ from: username, amount });
            } else {
                const oldAmount = parseInt(
                    donateList[idx].amount.split('.')[0],
                    10
                );
                const newAmount = parseInt(amount.split('.')[0], 10);
                donateList[idx] = {
                    from: username,
                    amount:
                        (oldAmount + newAmount).toString() +
                        '.000 ' +
                        amount.split(' ')[1],
                };
            }
        },
        fetchingData(state, { payload: { order, category } }) {
            setPath(state, ['status', category || '', order], {
                fetching: true,
            });
        },
        receiveData(state, { payload }) {
            const {
                data,
                order,
                category,
                permlink: startPermLink,
                accountname,
                has_from_search,
                next_from,
            } = payload;

            const dataPath =
                order === 'by_author' ||
                order === 'by_feed' ||
                order === 'by_comments' ||
                order === 'by_replies'
                    ? ['accounts', accountname, category]
                    : ['discussion_idx', category || '', order];

            const links = [];
            data.forEach(v => {
                const link = `${v.author}/${v.permlink}`;
                if (!links.includes(link)) links.push(link);
            });

            if (startPermLink) {
                const posts = ensureArrayAt(state, dataPath);
                links.forEach(id => {
                    if (!posts.includes(id)) posts.push(id);
                });
            } else {
                setPath(state, dataPath, links);
            }

            state.content = state.content || {};
            data.forEach(value => {
                state.content[`${value.author}/${value.permlink}`] = {
                    ...value,
                    stats: contentStats(value),
                };
            });

            setPath(
                state,
                ['status', category || '', order],
                data.length < constants.FETCH_DATA_BATCH_SIZE
                    ? { fetching: false, lastFetch: Date.now() }
                    : { fetching: false }
            );

            state.has_from_search = has_from_search;
            state.next_from = next_from;
        },
        receiveRecentPosts(state, { payload: { data } }) {
            const posts = ensureArrayAt(state, [
                'discussion_idx',
                '',
                'created',
            ]);
            data.forEach(({ author, permlink }) => {
                const entry = `${author}/${permlink}`;
                if (!posts.includes(entry)) posts.unshift(entry);
            });

            state.content = state.content || {};
            data.forEach(value => {
                const key = `${value.author}/${value.permlink}`;
                if (!state.content[key]) {
                    state.content[key] = {
                        ...value,
                        stats: contentStats(value),
                    };
                }
            });
        },
        unsubscribePost(state, { payload: { account, author, permlink } }) {
            const link = `${author}/${permlink}`;
            const data = getPath(state, ['accounts', account, 'discussions']);
            if (Array.isArray(data)) {
                setPath(
                    state,
                    ['accounts', account, 'discussions'],
                    data.filter(v => v !== link)
                );
            }
        },
        requestMeta(state, { payload: { id, link } }) {
            setPath(state, ['metaLinkData', id], { link });
        },
        receiveMeta(state, { payload: { id, meta } }) {
            const data = ensureObjectAt(state, ['metaLinkData', id], {});
            Object.assign(data, meta);
        },
        set(state, { payload: { key, value } }) {
            setPath(state, Array.isArray(key) ? key : [key], value);
        },
        remove(state, { payload: { key } }) {
            unset(state, Array.isArray(key) ? key : [key]);
        },
        update(state, { payload: { key, notSet = {}, updater } }) {
            updateAtPath(state, key, notSet, updater);
        },
        setMetaData(state, { payload: { id, meta } }) {
            setPath(state, ['metaLinkData', id], meta);
        },
        clearMeta(state, { payload: { id } }) {
            unset(state, ['metaLinkData', id]);
        },
        clearMetaElement(state, { payload: { formId, element } }) {
            unset(state, ['metaLinkData', formId, element]);
        },
        fetchJson() {
            // Saga-only action.
        },
        fetchExchangeRates() {
            // Saga-only action.
        },
        fetchJsonResult(state, { payload: { id, result, error } }) {
            state[id] = { result, error };
        },
        showDialog(state, { payload: { name, params = {} } }) {
            state.active_dialogs = state.active_dialogs || {};
            state.active_dialogs[name] = { params };
        },
        hideDialog(state, { payload: { name } }) {
            if (state.active_dialogs) delete state.active_dialogs[name];
        },
        receiveAccountVestingDelegations(
            state,
            { payload: { account, type, vesting_delegations } }
        ) {
            setPath(
                state,
                ['accounts', account, `${type}_vesting`],
                vesting_delegations
            );
        },
        fetchVestingDelegations() {
            // Saga-only action.
        },
        fetchVersions() {
            // Saga-only action.
        },
        showVersion() {
            // Saga-only action.
        },
        fetchSponsors() {
            // Saga-only action.
        },
        fetchSponsoreds() {
            // Saga-only action.
        },
    },
    extraReducers: builder => {
        builder.addCase('@@router/LOCATION_CHANGE', (state, action) => {
            state.pathname = action.payload.pathname;
        });
    },
});

export default globalSlice;
