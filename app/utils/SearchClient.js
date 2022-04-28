import { Headers } from 'cross-fetch'

import { detransliterate } from 'app/utils/ParsersAndFormatters'
import fetchWithTimeout from 'shared/fetchWithTimeout'

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

export async function sendSearchRequest(sr, timeoutMsec = 10000) {
    let body = sr.build()
    let url = new URL($STM_Config.elastic_search.url);
    url += 'blog/post/_search?pretty'
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

export async function searchData(sr, retries = 3, retryIntervalSec = 2, timeoutMsec = 10000) {
    const retryMsec = retryIntervalSec * 1000
    let preResults = null
    for (let i = 0; i < (retries + 1); ++i) {
        try {
            preResults = await sendSearchRequest(sr, timeoutMsec)
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
    let results = preResults.hits.hits.map((hit) => {
        let obj = {}

        copyField(obj, hit, 'author')
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

        return obj
    })
    return {
        results,
        total: (preResults.hits.total && preResults.hits.total.value) || 100
    }
}
