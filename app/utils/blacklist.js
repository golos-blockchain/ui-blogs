import ByteBuffer from 'bytebuffer'

function toHex(str) {
    return '3'+ByteBuffer.fromUTF8(str).toHex()+'a'
}

function fromHex(str) {
    return ByteBuffer.fromHex(str).toUTF8()
}

export function packBlacklist(arr) {
    return arr.map(item => toHex(item))
}

export function isBlocked(who, where) {
    const hex = toHex(who)
    return where.includes(hex)
}
