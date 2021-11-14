
const wwKey = 'withdrawal.ways';
const memoLifetimeSec = 30*24*60*60;

const daKey = 'deposit.addresses';
const addressLifetimeSec = 30*24*60*60;

function localStorageAvailable() {
    return typeof(localStorage) !== 'undefined';
}

function getMemos() {
    let memos = {};
    try {
        memos = localStorage.getItem(wwKey);
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
    localStorage.setItem(wwKey, JSON.stringify(memos));
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
            console.warn('loadMemo', 'no memo', i);
            return res;
        }
        if (!memos[i].memo || memos[i].prefix !== prefix) {
            console.warn('loadMemo', 'wrong memo', i);
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

function getAddresses() {
    let addresses = {};
    try {
        addresses = localStorage.getItem(daKey);
        addresses = JSON.parse(addresses);
    } catch (err) {
        addresses = {};
    }
    if (!addresses || typeof(addresses) !== 'object' || Array.isArray(addresses)) {
        addresses = {};
    }
    return addresses;
}

function setAddresses(addresses) {
    localStorage.setItem(daKey, JSON.stringify(addresses));
}

export function saveAddress(sym, creator, address) {
    try {
        if (!localStorageAvailable()) return;
        let addresses = getAddresses();
        addresses[_key(sym, creator)] = { address, time: Date.now(), };
        setAddresses(addresses);
    } catch (err0) {
        console.error('saveAddress', err0);
    }
}

export function loadAddress(sym, creator) {
    let res = null;
    try {
        if (!localStorageAvailable()) return res;
        let addresses = getAddresses();
        const i = _key(sym, creator);
        if (!addresses[i]) {
            console.warn('loadAddress', 'no address', i);
            return res;
        }
        if (!addresses[i].address) {
            console.warn('loadAddress', 'wrong address', i);
            return res;
        }
        return addresses[i].address;
    } catch (err0) {
        console.error('loadAddress', err0);
        return res;
    }
}

export function clearOldAddresses() {
    try {
        if (!localStorageAvailable()) return;
        let addresses = getAddresses();
        const now = Date.now();
        for (let [key, value] of Object.entries(addresses)) {
            const lifetime = (now - value.time) / 1000;
            if (lifetime > addressLifetimeSec) {
                delete addresses[key];
            }
        }
        setAddresses(addresses);
    } catch (err0) {
        console.error('clearOldAddresses', err0);
    }
}
