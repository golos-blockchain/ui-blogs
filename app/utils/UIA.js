
const stKey = 'withdrawal.ways';

const memoLifetimeSec = 60*24*60*60;

function localStorageAvailable() {
    return typeof(localStorage) !== 'undefined';
}

function getMemos() {
    let memos = {};
    try {
        memos = localStorage.getItem(stKey);
        memos = JSON.parse(memos);
    } catch (err) {
        memos = {};
    }
    if (!memos || typeof(memos) !== 'object' || Array.isArray(memos)) {
        memos = {};
    }
    return memos;
}

function setMemos(memos) {
    localStorage.setItem(stKey, JSON.stringify(memos));
}

function _key(sym, id) {
    return sym.toUpperCase().trim() + '|' + id;
}

export function saveMemo(sym, id, memo, prefix) {
    try {
        if (!localStorageAvailable()) return;
        let memos = getMemos();
        memos[_key(sym, id)] = { memo, prefix, time: Date.now(), };
        setMemos(memos);
    } catch (err0) {
        console.error('saveMemo', err0);
    }
}

export function loadMemo(sym, id, prefix) {
    let res = null;
    try {
        if (!localStorageAvailable()) return res;
        let memos = getMemos();
        const i = _key(sym, id);
        if (!memos[i]) {
            console.warn('loadMemo', 'no memo');
            return res;
        }
        if (!memos[i].memo || memos[i].prefix !== prefix) {
            console.warn('loadMemo', 'wrong memo');
            return res;
        }
        return memos[i].memo;
    } catch (err0) {
        console.error('loadMemo', err0);
        return res;
    }
}

export function clearOldMemos() {
    try {
        if (!localStorageAvailable()) return;
        let memos = getMemos();
        const now = Date.now();
        for (let [key, value] of Object.entries(memos)) {
            const lifetime = (now - value.time) / 1000;
            if (lifetime > memoLifetimeSec) {
                delete memos[key];
            }
        }
        setMemos(memos);
    } catch (err0) {
        console.error('clearOldMemos', err0);
    }
}
