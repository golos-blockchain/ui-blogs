function roundUp(num, precision) {
    let satoshis = parseFloat(num) * Math.pow(10, precision);

    // Attempt to correct floating point: 1.0001 satoshis should not round up.
    satoshis = satoshis - 0.0001;

    // Round up, restore precision
    return Math.ceil(satoshis) / Math.pow(10, precision);
}

function roundDown(num, precision) {
    let satoshis = parseFloat(num) * Math.pow(10, precision);

    // Attempt to correct floating point: 1.9999 satoshis should not round down.
    satoshis = satoshis + 0.0001;

    // Round down, restore precision
    return Math.floor(satoshis) / Math.pow(10, precision);
}

// without exponential notation (try (0.0000001).toString())
function float2str(f) {
    let str = f.toFixed(8)
    if (isNaN(f) || !str.includes('.')) {
        return str
    }
    let str2 = ''
    let i = str.length - 1
    for (; i >= 0; --i) {
        if (str[i] !== '0' && str[i] !== '.') {
            break;
        }
    }
    for (; i >= 0; --i) {
        str2 = str[i] + str2
    }
    if (!str2) str2 = '0'
    return str2
}

function normalizeAssets(assets) {
    let assetsNorm = {}
    assetsNorm['GOLOS'] = {
        supply: '0.000 GOLOS', precision: 3, symbols_whitelist: [], fee_percent: 0,
        json_metadata: '{"image_url": "/images/golos.png"}'
    }
    assetsNorm['GBG'] = {
        supply: '0.000 GBG', precision: 3, symbols_whitelist: [], fee_percent: 0,
        json_metadata: '{"image_url": "/images/gold-golos.png"}'
    }
    for (let [key, value] of Object.entries(assets)) {
        assetsNorm[key] = value
    }
    return assetsNorm
}

function getAssetMeta(asset) {
    try {
        let obj = JSON.parse(asset.json_metadata)
        if (typeof(obj) !== 'object' || !obj || Array.isArray(obj)) {
            return {}
        }
        return obj
    } catch (err) {
        return {}
    }
}

function getTradablesFor(assets, syms, onlyFirst = false) {
    let tradableLists = syms.map(sym => [])

    const forbids = (whitelist, sym) => {
        return whitelist.length && !whitelist.includes(sym)
    }

    for (let [key, value] of Object.entries(assets)) {
        let image_url = getAssetMeta(value).image_url || ''

        if (syms.includes(key)) {
            continue
        }

        for (const i in syms) {
            const sym = syms[i]

            if (forbids(value.symbols_whitelist, sym)) {
                continue
            }

            if (forbids(assets[sym].symbols_whitelist, key)) {
                continue
            }

            tradableLists[i].push({
                symbol: key, image_url
            })

            if (onlyFirst) {
                return tradableLists
            }
        }
    }

    return tradableLists
}

function generateOrderID() {
    return Math.floor(Date.now() / 1000)
}

const calcFeeForBuy = (buyAmount, fee_percent) => {
    let fee = buyAmount.clone()
    let buyWF = buyAmount.mul(10000).div(10000 - fee_percent)
    if (buyWF.amount > buyAmount.amount) {
        fee = buyWF.minus(buyAmount)
    } else if (fee_percent) {
        buyWF = buyWF.plus(1)
        fee.amount = 1
    } else {
        fee.amount = 0
    }
    return { fee, buyWF }
}

const calcFeeForSell = (buyAmount, fee_percent) => {
    let fee = buyAmount.mul(fee_percent).div(10000)
    if (fee.amount === 0 && fee_percent !== 0) fee.amount = 1
    let clearBuy = buyAmount.minus(fee)
    return { fee, clearBuy }
}

const DEFAULT_EXPIRE = 0xffffffff

module.exports = {
    roundUp,
    roundDown,
    float2str,
    normalizeAssets,
    getAssetMeta,
    getTradablesFor,
    generateOrderID,
    calcFeeForBuy,
    calcFeeForSell,
    DEFAULT_EXPIRE
}
