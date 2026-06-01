import { Long } from 'bytebuffer';
import { parsePayoutAmount } from './ParsersAndFormatters';

export function sortComments(cont, comments, sortOrder) {
    let sortFunc = null;

    if (sortOrder === 'votes') {
        comments.sort((a, b) => {
            const aactive = countUpvotes(cont[a]);
            const bactive = countUpvotes(cont[b]);

            return bactive - aactive;
        });
    } else if (sortOrder === 'new') {
        comments.sort((a, b) => {
            const acontent = cont[a];
            const bcontent = cont[b];

            if (netNegative(acontent)) {
                return 1;
            } else if (netNegative(bcontent)) {
                return -1;
            }
            const aactive = Date.parse(acontent.created);
            const bactive = Date.parse(bcontent.created);
            return bactive - aactive;
        });
    } else if (sortOrder === 'trending') {
        comments.sort((a, b) => {
            const acontent = cont[a];
            const bcontent = cont[b];

            if (netNegative(acontent)) {
                return 1;
            } else if (netNegative(bcontent)) {
                return -1;
            }

            const apayout = totalPayout(acontent);
            const bpayout = totalPayout(bcontent);

            if (apayout !== bpayout) {
                return bpayout - apayout;
            }

            // If SBD payouts were equal, fall back to rshares sorting
            return netRshares(bcontent).compare(netRshares(acontent));
        });
    } else if (sortOrder === 'old') {
        comments.sort((a, b) => {
            const acontent = cont[a];
            const bcontent = cont[b];

            if (netNegative(acontent)) {
                return 1;
            } else if (netNegative(bcontent)) {
                return -1;
            }

            const aactive = Date.parse(acontent.created);
            const bactive = Date.parse(bcontent.created);

            return aactive - bactive;
        });
    }
}

function netRshares(a) {
    return Long.fromString(String(a.net_rshares));
}

function totalPayout(a) {
    return (
        parsePayoutAmount(a.pending_payout_value) +
        parsePayoutAmount(a.total_payout_value) +
        parsePayoutAmount(a.curator_payout_value)
    );
}

function countUpvotes(a) {
    return (a.active_votes || []).filter(vote => vote.percent > 0).length;
}

function netNegative(a) {
    return a.net_rshares < 0;
}
