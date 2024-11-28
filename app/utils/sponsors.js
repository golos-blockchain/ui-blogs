import crypto from 'browserify-aes'
import golos from 'golos-lib-js'
import { hash } from 'golos-lib-js/lib/auth/ecc'
import forIn from 'lodash/forIn'

import { authSession, cryptostoreEncrypt, cryptostoreDecrypt } from 'app/utils/AuthApiClient'
import session from 'app/utils/session'

const ourOid = {
    app: 'golos-blog',
    name: 'blog',
    version: 1
}

export const makeOid = () => {
    return { ...ourOid }
}

export async function encryptPost(commentOp) {
    const { author, body } = commentOp

    if (!window._cryptostore) {
        const res = await golos.api.encryptBodyAsync({ author, body })
        console.log(res)
        if (res.error) {
            throw new Error(res.error)
        }
        let newBody = {}
        newBody.t = 'e'
        newBody.v = 2
        newBody.c = res.encrypted
        newBody = JSON.stringify(newBody)
        return newBody
    }

    let data
    try {
        data = await cryptostoreEncrypt()
    } catch (err) {
        if (err.message && err.message.startsWith('not authorized')) {
            console.log('Cannot authorize in cryptostore, waiting (maybe page not yet init...)')
            await new Promise(resolve => setTimeout(resolve, 3000))

            data = await cryptostoreEncrypt()
        }
        throw err
    }

    const { key } = data

    const buff = new Buffer(body, 'utf-8')
    const keySha = hash.sha512(key)
    const cKey = keySha.slice(0, 32)
    const iv = keySha.slice(32, 48)
    const cipher = crypto.createCipheriv('aes-256-cbc', cKey, iv)
    let encrypted = Buffer.concat([cipher.update(buff), cipher.final()])
    encrypted = encrypted.toString('base64')

    let newBody = {}
    newBody.t = 'e'
    newBody.c = encrypted
    newBody = JSON.stringify(newBody)
    return newBody
}

export const EncryptedStates = {
    loading: 1,
    no_sponsor: 2,
    inactive: 3,
    no_sub: 4,
    no_key: 5,
    unknown: 6,
    wrong_format: 7,
    decrypted: 8,
    no_auth: 9,
}

function isEncrypted(content) {
    const { body } = content
    return body.startsWith('{"t":"e"')
}

export function markEncryptedContent(content, state = null) {
    if (isEncrypted(content)) {
        content.encrypted = EncryptedStates.loading
        if (state) state.decrypting = true
    }
}

export async function tryDecryptContents(contents) {
    const entriesCS = []
    const entries = []
    forIn(contents, (content, i) => {
        if (isEncrypted(content)) {
            let data
            try {
                data = JSON.parse(content.body)
            } catch (err) {
                console.error('tryDecryptContent - wrong JSON:', err)
                content.encrypted = EncryptedStates.wrong_format
                return
            }
            if (data.v && data.v >= 2) {
                entries.push({
                    author: content.author,
                    permlink: content.permlink,
                    hashlink: content.hashlink,
                    _i: i
                })
            } else {
                entriesCS.push({
                    author: content.author,
                    permlink: content.permlink,
                    hashlink: content.hashlink,
                    body: data.c, _i: i
                })
            }
        }
    })

    const convertRes = (content, res) => {
        const { body, err, sub, decrypt_fee } = res
        if (body) {
            content.body = body
            content.encrypted = EncryptedStates.decrypted
        } else if (err === 'no_sponsor' || err === 'no_auth') {
            content.encrypted = EncryptedStates.no_sponsor
        } else if (err === 'no_sub') {
            content.encrypted = EncryptedStates.no_sub
        } else if (err === 'inactive') {
            content.encrypted = EncryptedStates.inactive
        } else if (err === 'no_key') {
            content.encrypted = EncryptedStates.no_key
        } else {
            content.encrypted = EncryptedStates.unknown
        }
        content.encrypted_sub = sub
        content.encrypted_decrypt_fee = decrypt_fee
    }
    if (entries.length) {
        try {
            const { head_block_number, witness } = await golos.api.getDynamicGlobalPropertiesAsync()

            const sess = session.load()
            const accName = sess.currentName
            const posting = sess.currentName && sess.accounts[sess.currentName].posting

            if (!accName || !posting) {
                try {
                    forIn(entries, (entry, i) => {
                        const content = contents[entry._i]
                        content.encrypted = EncryptedStates.no_auth
                    })
                } catch (err) {
                    console.error('tryDecryptContents - decryptComments', err)
                }
                return
            }

            const signed = golos.auth.signData(head_block_number.toString(), {
                posting
            })

            const res = await golos.api.decryptCommentsAsync({
                account: accName,
                entries,
                oid: ourOid,
                signed_data:  {
                    head_block_number,
                    witness,
                },
                signature: signed.posting
            })
            if (res.error) {
                throw new Error(res.error)
            }
            forIn(res.results, (res, i) => {
                const content = contents[entries[i]._i]

                convertRes(content, res)
            })
        } catch (err) {
            console.error('tryDecryptContents - decryptComments', err)
            try {
                forIn(entries, (entry, i) => {
                    const content = contents[entry._i]
                    content.encrypted = EncryptedStates.unknown
                })
            } catch (err) {
                console.error('tryDecryptContents - decryptComments', err)
            }
        }
    }

    if (entriesCS.length) {
        try {
            const result = await cryptostoreDecrypt(entriesCS, makeOid())
            forIn(result.result, (res, i) => {
                const content = contents[entriesCS[i]._i]

                convertRes(content, res)
            })
        } catch (err) {
            console.error('tryDecryptContents - cryptostore', err)
            try {
                forIn(entriesCS, (entry, i) => {
                    const content = contents[entry._i]
                    content.encrypted = EncryptedStates.unknown
                })
            } catch (err) {
                console.error('tryDecryptContents - cryptostore', err)
            }
        }
    }
}

export const SPONSORS_PER_PAGE = 20
