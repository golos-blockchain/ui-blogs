import assert from 'assert';
import constants from 'app/redux/constants';
import {parsePayoutAmount, repFn} from 'app/utils/ParsersAndFormatters';
import {Long} from 'bytebuffer';
import {VEST_TICKER, LIQUID_TICKER} from 'app/client_config'
import {Map, Seq, fromJS} from 'immutable';

// '1000000' -> '1,000,000'
export const numberWithCommas = (x) => x.replace(/\B(?=(\d{3})+(?!\d))/g, ",")

export const toAsset = (value) => {
    const [ amount, symbol ] = value.split(' ')
    return { amount: parseFloat(amount), symbol }
}

export function vestsToSp(state, vesting_shares) {
    const {global} = state
    const vests = assetFloat(vesting_shares, VEST_TICKER)
    const total_vests = assetFloat(global.getIn(['props', 'total_vesting_shares']), VEST_TICKER)
    const total_vest_steem = assetFloat(global.getIn(['props', 'total_vesting_fund_steem']), LIQUID_TICKER)
    const vesting_steemf = total_vest_steem * (vests / total_vests);
    const steem_power = vesting_steemf.toFixed(3)
    return steem_power
}

export function vestsToSteem (vestingShares, gprops) {
    const { total_vesting_fund_steem, total_vesting_shares } = gprops
    const totalVestingFundSteem = toAsset(total_vesting_fund_steem).amount
    const totalVestingShares = toAsset(total_vesting_shares).amount
    const vesting_shares = toAsset(vestingShares).amount
    return (totalVestingFundSteem * (vesting_shares / totalVestingShares)).toFixed(3)
}

export function steemToVests(steem, gprops) {
    const { total_vesting_fund_steem, total_vesting_shares } = gprops
    const totalVestingFundSteem =  toAsset(total_vesting_fund_steem).amount
    const totalVestingShares =  toAsset(total_vesting_shares).amount
    const vests = steem / (totalVestingFundSteem / totalVestingShares)
    return vests.toFixed(6)
}

export function assetFloat(str, asset) {
    try {
        assert.equal(typeof str, 'string')
        assert.equal(typeof asset, 'string')
        assert(new RegExp(`^\\d+(\\.\\d+)? ${asset}$`).test(str), 'Asset should be formatted like 99.99 ' + asset + ': ' + str)
        return parseFloat(str.split(' ')[0])
    } catch(e) {
        console.log(e);
        return undefined
    }
}

export function isFetchingOrRecentlyUpdated(global_status, order, category) {
    const status = global_status ? global_status.getIn([category || '', order]) : null;
    if (!status) return false;
    if (status.fetching) return true;
    if (status.lastFetch) {
        return Date.now() - status.lastFetch < constants.FETCH_DATA_EXPIRE_SEC * 1000;
    }
    return false;
}

export function contentStats(content) {
    if(!content) return {}
    if(!(content instanceof Map)) content = fromJS(content);

    let net_rshares_adj = Long.ZERO
    let neg_rshares = Long.ZERO
    let total_votes = 0;
    let up_votes = 0;

    content.get('active_votes').forEach((v) => {
        const sign = Math.sign(v.get('percent'))
        if(sign === 0) return;
        total_votes += 1
        if(sign > 0) up_votes += 1

        const rshares = String(v.get('rshares'))

        // For flag weight: count total neg rshares
        if(sign < 0) {
            neg_rshares = neg_rshares.add(rshares)
        }

        // For graying: sum up total rshares from voters with non-neg reputation.
        if(String(v.get('reputation')).substring(0, 1) !== '-') {
            // And also ignore tiny downvotes (9 digits or less)
            if(!(rshares.substring(0, 1) === '-' && rshares.length < 11)) {
                net_rshares_adj = net_rshares_adj.add(rshares)
            }
        }
    });

    // take negative rshares, divide by 2, truncate 10 digits (plus neg sign), count digits
    // creates a cheap log10, stake-based flag weight
    const flagWeight = Math.max(String(neg_rshares.div(2)).length - 11, 0)

    // post must have non-trivial negative rshares to be grayed out

    const grayThreshold = -5000000000000 // dislikes ~100k Golos Power
    const meetsGrayThreshold = net_rshares_adj.compare(grayThreshold) < 0
    const grayThreshold2 = -50000000000000 // dislikes ~1kk Golos Power
    const meetsGrayThreshold2 = net_rshares_adj.compare(grayThreshold2) < 0
    const hideThreshold = -500000000000000 // dislikes ~10kk Golos Power
    const meetsHideThreshold = net_rshares_adj.compare(hideThreshold) < 0

    const hasPositiveRshares = Long.fromString(String(content.get('net_rshares'))).gt(Long.ZERO)
    const allowDelete = !hasPositiveRshares && content.get('children') === 0
    const authorRepFn = repFn(content.get('author_reputation'))

    const gray = authorRepFn < 0 || (authorRepFn < 70 && meetsGrayThreshold) || meetsGrayThreshold2
    const hide = authorRepFn < 0 || meetsHideThreshold
    const pictures = !gray

    // Combine tags+category to check nsfw status
    const json = content.get('json_metadata')
    let tags = []
    try {
        tags = (json && JSON.parse(json).tags) || [];
        if(typeof tags == 'string') {
            tags = [tags];
        } if(!Array.isArray(tags)) {
            tags = [];
        }
    } catch(e) {
        tags = []
    }
    tags.push(content.get('category'))
    
    tags = filterTags(tags)

    const isNsfw = tags.filter(tag => tag && tag.match(/^nsfw$|^ru--mat$|^18\+$/i)).length > 0;

    return {
        hide,
        gray,
        pictures,
        authorRepFn,
        allowDelete,
        isNsfw,
        flagWeight,
        total_votes,
        up_votes
    }
}

export function filterTags(tags) {
    return tags.filter(tag => typeof tag === 'string')
}

export function fromJSGreedy(js) {
  return typeof js !== 'object' || js === null ? js :
    Array.isArray(js) ?
      Seq(js).map(fromJSGreedy).toList() :
      Seq(js).map(fromJSGreedy).toMap();
}

export function processDatedGroup(group, messages, for_each) {
    if (group.nonce) {
        const idx = messages.findIndex(i => i.get('nonce') === group.nonce);
        if (idx !== -1) {
            messages = messages.update(idx, (msg) => {
                return for_each(msg, idx);
            });
        }
    } else {
        let inRange = false;
        for (let idx = 0; idx < messages.size; ++idx) {
            let msg = messages.get(idx);
            const date = msg.get('create_date');
            const rec_date = msg.get('receive_date');
            if (!inRange && date <= group.stop_date) {
                inRange = true;
            }
            if (date <= group.start_date && rec_date.startsWith('20')) {
                break;
            }
            if (inRange) {
                messages = messages.set(idx, for_each(msg, idx));
            }
        }
    }
    return messages;
}
