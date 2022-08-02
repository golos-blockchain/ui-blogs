import { api, config } from 'golos-lib-js'
import { PUBLIC_API } from 'app/client_config'

export function getDynamicGlobalProperties() {
    return api.getDynamicGlobalPropertiesAsync()
}

export function getChainProperties() {
    return api.getChainPropertiesAsync()
}

export function getCurrentMedianHistoryPrice() {
    return api.getCurrentMedianHistoryPriceAsync()
}

export function getTrendingTags(afterTag, limit) {
    return api.getTrendingTagsAsync(afterTag, limit)
}

export function getTagsUsedByAuthor(author) {
    return api.getTagsUsedByAuthorAsync(author)
}

export function getAccounts(names) {
    return api.getAccountsAsync(names)
}

export function getAccountsBalances(names) {
    return api.getAccountsBalancesAsync(names)
}

export function getAssets(creator='', names=[], from='', limit=5000) {
    return api.getAssetsAsync(creator, names, from, limit)
}

export function getAccountHistory(account, from, limit, filter_ops, select_ops = undefined) {
    return api.getAccountHistoryAsync(account, from, limit, {filter_ops, select_ops})
}

export function getRepliesByLastUpdate(startAuthor, startPermlink, limit, voteLimit, prefs) {
    return api.getRepliesByLastUpdateAsync(startAuthor, startPermlink, limit, voteLimit, 0, ['fm-'], prefs)
}

export function getDiscussionsByComments(query) {
    return api.getDiscussionsByCommentsAsync(query)
}

export function getBlogAuthors(blogAccount) {
    return api.getBlogAuthorsAsync(blogAccount)
}

export function getBlogEntries(account, entryId, limit) {
    return api.getBlogEntriesAsync(account, entryId, limit, ['fm-'])
}

export function getFeedEntries(account, entryId, limit) {
    return api.getFeedEntriesAsync(account, entryId, limit, ['fm-'])
}

export function getAccountReputations(lowerBoundName, limit) {
    return {}
}

export function getWitnessByAccount(accountName) {
    return api.getWitnessByAccountAsync(accountName)
}

export function getWitnessesByVote(from, limit) {
    return api.getWitnessesByVoteAsync(from, limit)
}

export function getWitnessVotes(witnessIds) {
    return api.getWitnessVotesAsync(witnessIds, 21, 0, '1.000 GOLOS')
}

export function getContent(author, permlink, voteLimit) {
    return api.getContentAsync(author, permlink, voteLimit)
}

export function getContentReplies(author, permlink, voteLimit) {
    return api.getContentRepliesAsync(author, permlink, voteLimit)
}

export function getAllContentReplies(author, permlink, voteLimit, prefs) {
    if ($STM_Config.hide_comment_neg_rep) {
        return api.getAllContentRepliesAsync(author, permlink, voteLimit, 0, [], [], true, null, prefs)
    } else {
        return api.getAllContentRepliesAsync(author, permlink, voteLimit, 0, [], [], false, null, prefs)
    }
}

export function getDonates(uia, target, from, to, voteLimit, offset) {
    return api.getDonatesAsync(uia, target, from, to, voteLimit, offset, true)
}

export function gedDiscussionsBy(type, args) {
    if (type === 'forums')
        return api[PUBLIC_API[type]](...args)
    return api[PUBLIC_API[type]](args)
}

export function getActiveVotesAsync(account, permlink) {
    return api.getActiveVotesAsync(account, permlink)
}

export function getHardforkVersion() {
    return api.getHardforkVersionAsync()
}

export function getWorkerRequests(query, sort, fillPosts) {
    return api.getWorkerRequestsAsync(query, sort, fillPosts)
}

export function getWorkerRequestVotes(author, permlink, voter, limit) {
    return api.getWorkerRequestVotesAsync(author, permlink, voter, limit)
}

export function getFollowing(follower, startFollowing, followType, limit) {
    return api.getFollowingAsync(follower, startFollowing, followType, limit)
}
