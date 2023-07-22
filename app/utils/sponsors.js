
import { cryptostoreEncrypt } from 'app/utils/AuthApiClient'

export const oid = {
    app: 'golos-blog', // For blog posts
    name: '', // Account name
    version: 1
}

export const makeOid = (author) => {
    return { ...oid, name: author }
}

export async function encryptPost(commentOp) {
    const { author, body } = commentOp
    const enc = await cryptostoreEncrypt()
    console.log(enc)
}
