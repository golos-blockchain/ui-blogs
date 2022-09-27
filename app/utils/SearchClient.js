import { Headers } from 'cross-fetch'
import diff_match_patch from 'diff-match-patch'
import {config, api} from 'golos-lib-js';

import { detransliterate } from 'app/utils/ParsersAndFormatters'
import fetchWithTimeout from 'shared/fetchWithTimeout'

const dmp = new diff_match_patch()

const makeTag = (text) => {
    return /^[а-яё]/.test(text)
        ? '' + detransliterate(text, true)
        : text
}

export class SearchRequest {
    constructor() {
        this.page = 1
        this.limit = 20
        this.sort = {
            "sort": {
                "created": {
                    "order": "desc"
                }
            }
        }
        this.filters = []
        this.mustNotFilters = []
    }

    setFrom(from) {
        this.from = from
        return this
    }

    setPage(page) {
        this.page = page
        return this
    }

    setLimit(limit) {
        this.limit = limit
        return this
    }

    paginate(limit, page = 1) {
        return this.setLimit(limit).setPage(page)
    }

    byOneOfTags(tags) {
        for (let i in tags) {
            tags[i] = makeTag(tags[i])
        }
        this.filters.push({
            "terms": {
                "tags": tags
            }
        })
        return this
    }

    byOneOfCategories(categories) {
        for (let i in categories) {
            categories[i] = makeTag(categories[i])
        }
        this.filters.push({
            "terms": {
                "category": categories
            }
        })
        return this
    }

    filterTags(tags) {
        for (let i in tags) {
            tags[i] = makeTag(tags[i])
        }
        this.mustNotFilters.push({
            "terms": {
                "tags": tags
            }
        })
        return this
    }

    olderThan(dt) {
        let range = {
            "range": {
                "created": {
                }
            }
        };
        range.range.created.lte = dt.toISOString().split('.')[0]
        this.filters.push(range)
        return this
    }

    onlyPosts() {
        this.filters.push({
            "term": {
                "depth": 0
            }
        })
        return this
    }

    build() {
        return {
            "_source": false,
            "from": this.from || ((this.page - 1) * this.limit),
            "size": this.limit,
            "query": {
                "bool": {
                    "must": [
                        ...this.filters
                    ],
                    "must_not": [
                        {
                            "match_phrase_prefix": {
                                "category": "fm-"
                            },
                        },
                        ...this.mustNotFilters
                    ]
                }
            },
            ...this.sort,
            /*"highlight": {
                "fragment_size" : 400,
                "fields": {
                    "title": {},
                    "body": {}
                }
            },*/
            "fields": [
                "author",
                "tags",
                "permlink",
                "category",
                "title",
                "body",
                "json_metadata",
                "net_rshares",
                "net_votes",
                "author_reputation",
                "donates",
                "donates_uia",
                "children",
                "root_title",
                "root_author",
                "root_permlink",
                "created"
            ]
        };
    }
}

export async function sendSearchRequest(_index, _type, sr, timeoutMsec = 10000) {
    let body = sr.build ? sr.build() : sr
    let url = new URL($STM_Config.elastic_search.url);
    url += _index + '/' + _type + '/_search?pretty'
    const response = await fetchWithTimeout(url, timeoutMsec, {
        method: 'post',
        headers: new Headers({
            'Authorization': 'Basic ' + btoa($STM_Config.elastic_search.login + ':' + $STM_Config.elastic_search.password),
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify(body)
    })
    if (response.ok) {
        const result = await response.json()
        return result
    } else {
        throw new Error(response.status)
    }
}

const copyField = (obj, hit, fieldName, fallbackValue) => {
    let val = hit.fields[fieldName] ? hit.fields[fieldName][0] : undefined
    obj[fieldName] = val !== undefined ? val : fallbackValue
}

export async function searchData(sr, retries = 3, retryIntervalSec = 2, timeoutMsec = 10000, myAccount = null) {
    const retryMsec = retryIntervalSec * 1000
    let preResults = null
    for (let i = 0; i < (retries + 1); ++i) {
        try {
            preResults = await sendSearchRequest('blog', 'post', sr, timeoutMsec)
            break
        } catch (err) {
            if (i + 1 < retries + 1) {
                console.error('ElasticSearch failure, retrying after', retryIntervalSec, 'sec...', err)
                await new Promise(resolve => setTimeout(resolve, retryMsec))
            } else {
                console.error('ElasticSearch failure', err)
                throw err
            }
        }
    }

    const authors = new Set()
    const results = []
    for (let i = 0; i < preResults.hits.hits.length; ++i) {
        const hit = preResults.hits.hits[i]
        let obj = {}

        copyField(obj, hit, 'author')
        authors.add(obj.author)
        copyField(obj, hit, 'permlink')
        copyField(obj, hit, 'category')
        copyField(obj, hit, 'root_author')
        copyField(obj, hit, 'root_permlink')
        copyField(obj, hit, 'created')
        copyField(obj, hit, 'title')
        copyField(obj, hit, 'body')
        copyField(obj, hit, 'json_metadata')
        copyField(obj, hit, 'net_votes', 0)
        copyField(obj, hit, 'net_rshares', 0)
        copyField(obj, hit, 'author_reputation')
        copyField(obj, hit, 'donates', '0.000 GOLOS')
        copyField(obj, hit, 'donates_uia', 0)
        copyField(obj, hit, 'children', 0)

        obj.active_votes = []
        obj.url = '/' + obj.category + '/@' + obj.author + '/' + obj.permlink
        obj.pending_author_payout_in_golos = '0.000 GOLOS'
        obj.parent_author = ''
        obj.replies = []

        results.push(obj)
    }

    let total = (preResults.hits.total && preResults.hits.total.value) || 100

    let filteredResults = []
    if (myAccount) {
        const rels = await api.getAccountRelationsAsync({
            my_account: myAccount,
            with_accounts: [...authors]
        })

        for (let i = 0; i < results.length; ++i) {
            const acc = results[i].author
            if (rels[acc] && rels[acc].blocking) {
                --total
            } else {
                filteredResults.push(results[i])
            }
        }
    } else {
        filteredResults = results
    }

    return {
        results: filteredResults,
        total
    }
}

const makeId = (author, permlink) => author + '.' + permlink

const maxVersion = 10

export async function listVersions(author, permlink) {
    const id = makeId(author, permlink)
    let should = []
    for (let i = 1; i <= maxVersion; ++i) {
        should.push({"term": { "_id": id + ',' + i }})
    }
    let sr = {
        "_source": false,
        "from": 0, "size": maxVersion,
        "query": { "bool": { should } },
        "sort": { "v": { "order": "asc" } },
        "fields": [ "post", "body", "is_patch", "time", "v" ]
    }
    try {
        let preResults = await sendSearchRequest('blog_versions', 'version', sr)
        let results = preResults.hits.hits.map((hit) => {
            let obj = {}

            copyField(obj, hit, 'body')
            copyField(obj, hit, 'time')
            copyField(obj, hit, 'post')
            copyField(obj, hit, 'is_patch')
            copyField(obj, hit, 'v')

            obj._id = hit._id

            return obj
        })
        return { results }
    } catch (err) {
        console.error('ElasticSearch failure', err)
        return { results: [] }
    }
}

export async function getVersion(author, permlink, version) {
    version = parseInt(version)
    if (version < 1 || version > maxVersion) {
        return null
    }
    const id = makeId(author, permlink)
    let should = []
    for (let i = 1; i <= version; ++i) {
        should.push({"term": { "_id": id + ',' + i }})
    }
    let sr = {
        "_source": false,
        "from": 0, "size": version,
        "query": { "bool": { should } },
        "sort": { "v": { "order": "asc" } },
        "fields": [ "post", "body", "is_patch", "time", "v" ]
    }
    try {
        let preResults = await sendSearchRequest('blog_versions', 'version', sr)
        let results = preResults.hits.hits.map((hit) => {
            let obj = {}

            copyField(obj, hit, 'body')
            copyField(obj, hit, 'time')
            copyField(obj, hit, 'is_patch')
            copyField(obj, hit, 'v')

            obj._id = hit._id

            return obj
        })
        if (results.length) {
            let lastUpdate, lastV
            let body = ''
            for (let i = 0; i < results.length; ++i) {
                try {
                    const patches = dmp.patch_fromText(results[i].body)
                    body = dmp.patch_apply(patches, body)[0]
                } catch (err) {
                    if (i > 0) {
                        console.error('Cannot apply patch', err, i)
                    }
                    body = results[i].body
                }
                lastUpdate = results[i].time
                lastV = results[i].v
            }
            if (lastV < version) {
                return null
            }
            return { body, lastUpdate }
        }
    } catch (err) {
        console.error('ElasticSearch failure', err)
    }
    return null
}

export async function stateSetVersion(content, urlSearch) {
    try {
        const sp = new URLSearchParams(urlSearch)
        const version = sp.get('version')
        if (version) {
            const vers = await getVersion(content.author, content.permlink, version)
            if (vers) {
                content.body = vers.body
                content.versions = { current: version }
            }
        }
    } catch (err) {
        console.error('Cannot set version', permlink, err)
    }
}
