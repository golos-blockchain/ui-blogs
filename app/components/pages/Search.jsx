import React from 'react';
import golos from 'golos-lib-js';
import { Link } from 'react-router';
import { browserHistory } from 'react-router';
import tt from 'counterpart';
import Icon from 'app/components/elements/Icon';
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper';
import remarkableStripper from 'app/utils/RemarkableStripper';
import sanitize from 'sanitize-html';
import { detransliterate } from 'app/utils/ParsersAndFormatters';
import truncate from 'lodash/truncate';
import Pagination from 'rc-pagination';
import localeEn from 'rc-pagination/lib/locale/en_US';
import localeRu from 'rc-pagination/lib/locale/ru_RU';
if (typeof(document) !== 'undefined') require('rc-pagination/assets/index.css');
let Multiselect;
if (typeof(document) !== 'undefined') Multiselect = require('multiselect-react-dropdown').Multiselect;

class Search extends React.Component {
    constructor(props) {
        super(props);
        const { routeParams } = props;
        let query = routeParams.query || '';
        let author = '';
        if (query.startsWith('@')) {
            author = query.substring(1);
            query = '';
        }
        this.state = {
            query,
            page: 1,
            where: tt('search.where_posts'),
            dateFrom: '',
            dateTo: '',
            authorLookup: [],
            author,
            tagLookup: [],
            tags: []
        };
    }

    componentDidMount() {
        this.fetchSearch(1);
    }

    onChange = (e) => {
        this.setState({
            query: e.target.value
        });
    };

    fetchSearch = async (page) => {
        let sort = {};
        let main = [];
        if (this.state.query) {
            let queryTrimmed = this.state.query.trim();
            let queryOp = 'match';
            if (queryTrimmed.length >= 3 && queryTrimmed[0] === '"' && queryTrimmed[queryTrimmed.length - 1] === '"') {
                queryOp = 'match_phrase';
            }
            main = [{
                "bool": {
                    "should": [
                        {
                            [queryOp]: {
                                "title": this.state.query
                            }
                        },
                        {
                            [queryOp]: {
                                "body": this.state.query
                            }
                        } 
                    ]
                }
            }];
        } else {
            sort = {
                "sort": {
                    "created": {
                        "order": "desc"
                    }
                }
            };
        }

        let filters = [];
        if (this.state.where === tt('search.where_posts')) {
            filters.push({
                "term": {
                    "depth": 0
                }
            });
        } else if (this.state.where === tt('search.where_comments')) {
            filters.push({
                "bool": {
                    "must_not": {
                        "term": {
                            "depth": 0
                        }
                    }
                }
            });
        }
        if (this.state.dateFrom || this.state.dateTo) {
            let range = {
                "range": {
                    "created": {
                    }
                }
            };
            if (this.state.dateFrom) {
                range.range.created.gte = this.state.dateFrom + 'T00:00:00';
            }
            if (this.state.dateTo) {
                range.range.created.lte = this.state.dateTo;
            }
            filters.push(range);
        }
        if (this.state.author) {
            filters.push({
                "match_phrase": {
                    "author": this.state.author
                }
            });
        }
        if (this.state.tags.length) {
            for (let tag of this.state.tags)
            filters.push({
                "term": {
                    "tags": tag
                }
            });
        }

        let url = new URL($STM_Config.elastic_search.url);
        url += 'blog/post/_search?pretty';
        let body = {
            "_source": false,
            "from": (page - 1) * 20,
            "size": 20,
            "query": {
                "bool": {
                    "must": [
                        ...main,
                        ...filters
                    ],
                    "must_not": {
                        "match_phrase_prefix": {
                            "category": "fm-"
                        }
                    }
                }
            },
            ...sort,
            "highlight": {
                "fragment_size" : 400,
                "fields": {
                    "title": {},
                    "body": {}
                }
            },
            "fields": ["author", "tags", "permlink", "category", "title", "body", "root_title", "root_author", "root_permlink", "created"]
        };
        const response = await fetch(url, {
            method: 'post',
            headers: new Headers({
                'Authorization': 'Basic ' + btoa($STM_Config.elastic_search.login + ':' + $STM_Config.elastic_search.password),
                'Content-Type': 'application/json'
            }),
            body: JSON.stringify(body)
        });
        if (response.ok) {
            const result = await response.json();
            //alert(JSON.stringify(result));
            this.setState({
                result
            })
        } else {
            console.error(response.status);
        }

        this.setState({
            page
        });
    };

    search = (e) => {
        if (e.type === 'keyup' && e.keyCode != 13) {
            return;
        }
        browserHistory.push('/search/' + this.state.query);
        this.fetchSearch(1);
    };

    changePage = async (page) => {
        await this.fetchSearch(page);
        window.scrollTo(0, 0);
    };

    _reloadWithSettings = (newState) => {
        this.setState(newState, () => {
            this.fetchSearch(1);
        });
    };

    handleWhereChange = (e) => {
        this._reloadWithSettings({
            where: e.target.value
        });
    };

    handleDateFromChange = (e) => {
        this._reloadWithSettings({
            dateFrom: e.target.value
        });
    };

    handleDateToChange = (e) => {
        this._reloadWithSettings({
            dateTo: e.target.value
        });
    };

    handleDateClear = (e) => {
        this._reloadWithSettings({
            dateFrom: '',
            dateTo: ''
        });
    };

    handleAuthorLookup = (value) => {
        golos.api.lookupAccounts(value.toLowerCase(), 6, true, (err, data) => {
            this.setState({
                authorLookup: data
            });
        });
    };
    handleAuthorSelect = (selectedList, selectedItem) => {
        document.getElementById('search_input').style.display = 'none';
        document.activeElement.blur();
        this._reloadWithSettings({
            author: selectedItem
        });
    };
    handleAuthorRemove = (selectedList, removedItem) => {
        document.getElementById('search_input').style.display = 'inline-block';
        this._reloadWithSettings({
            author: ''
        });
    };

    makeTag = (text) => {
        return /^[а-яё]/.test(text)
            ? '' + detransliterate(text, true)
            : text;
    };
    handleTagLookup = (value) => {
        setTimeout(() => {
            this.setState({
                tagLookup: [{text: value.toLowerCase(), value: this.makeTag(value.toLowerCase())}]
            });
        }, 1);
    };
    handleTagSelect = (selectedList, selectedItem) => {
        this._reloadWithSettings({
            tags: [...this.state.tags, selectedItem.value]
        });
    };
    handleTagRemove = (selectedList, selectedItem) => {
        this._reloadWithSettings({
            tags: this.state.tags.filter(item => item !== selectedItem.value)
        });
    };

    render() {
        let results = [];
        let totalPosts = 0;
        let display = null;
        if (this.state.result) {
            results = this.state.result.hits.hits.map((hit) => {
                let category = hit.fields.category[0];

                let parts = hit._id.split('.');
                let author = parts[0];
                let permlink = parts.slice(1).join();
                let root_author = hit.fields.root_author[0];
                let root_permlink = hit.fields.root_permlink[0];

                let url = '/' + category + '/@' + root_author + '/' + root_permlink;

                let title = hit.highlight && hit.highlight.title;
                title = title ? title[0].split('</em> <em>').join(' ') : hit.fields.root_title[0];
                if (root_permlink !== permlink) {
                    title = 'RE: ' + title;
                    url += '#@' + author + '/' + permlink;
                }
                let body = hit.highlight && hit.highlight.body;
                body = body ? body[0].split('</em> <em>').join(' ') : truncate(hit.fields.body[0], {length: 250});

                if (this.state.author && author !== this.state.author) return null;

                body = remarkableStripper.render(body);
                body = sanitize(body, {allowedTags: ['em', 'img']});

                return (<div className='golossearch-results'>
                        <Link target="_blank" to={url}><h6 dangerouslySetInnerHTML={{__html: title}}></h6></Link>
                        <span style={{color: 'rgb(180, 180, 180)'}}>
                            <TimeAgoWrapper date={hit.fields.created[0]} />
                            &nbsp;—&nbsp;@
                            {hit.fields.author[0]}
                        </span>
                        <div dangerouslySetInnerHTML={{__html: body}}></div>
                        <br/>
                    </div>);
            });
            totalPosts = this.state.result.hits.total.value;
            display = (<div>
              <b>{tt('search.results')} {totalPosts}</b>
              <Pagination
                defaultPageSize={20}
                current={this.state.page}
                onShowSizeChange={this.onShowSizeChange}
                onChange={this.changePage}
                total={totalPosts}
                style={{ float: 'right', margin: 10 }}
                locale={tt.getLocale() === 'ru' ? localeRu : localeEn}
              />
              <br/>
              <br/>
              {results}
              <Pagination
                defaultPageSize={20}
                current={this.state.page}
                onShowSizeChange={this.onShowSizeChange}
                onChange={this.changePage}
                total={totalPosts}
                style={{ float: 'right', margin: 0 }}
                locale={tt.getLocale() === 'ru' ? localeRu : localeEn}
              />
              </div>);
        }
        return (<div className="App-search">
                <img className="float-center" src={require("app/assets/images/search.png")} width="500" />
              <div className='esearch-box'>
                  <input value={this.state.query} className='esearch-input' placeholder={tt('search.placeholder')} type='text' onKeyUp={this.search} onChange={this.onChange} />
                    <select onChange={this.handleWhereChange}>
                        <option value={tt('search.where_posts')}>{tt('search.where_posts')}</option>
                        <option value={tt('search.where_comments')}>{tt('search.where_comments')}</option>
                        <option value={tt('search.where_anywhere')}>{tt('search.where_anywhere')}</option>
                    </select>
                    &nbsp;&nbsp;
                  <input type="submit" className="button" value={tt('g.search')} onClick={this.search} />
              </div>
              <div className='esearch-settings'>
                <input type='date' value={this.state.dateFrom} onChange={this.handleDateFromChange} />
                &nbsp;—&nbsp;
                <input type='date' value={this.state.dateTo} onChange={this.handleDateToChange} />
                &nbsp;&nbsp;
                {(this.state.dateFrom || this.state.dateTo) ? <span className='button small hollow esearch-btn-alltime' title={tt('search.alltime')} onClick={this.handleDateClear}>
                    <Icon name="cross" size="0_95x" />
                </span> : null}
                &nbsp;&nbsp;
                {Multiselect ? <Multiselect
                    className='esearch-author'
                    options={this.state.authorLookup}
                    isObject={false}
                    selectionLimit="3"
                    emptyRecordMsg={tt('search.author')}
                    closeOnSelect='true'
                    closeIcon="cancel"
                    placeholder={tt('search.author')}
                    selectedValues={this.state.author ? [this.state.author] : undefined}
                    onSearch={this.handleAuthorLookup}
                    onSelect={this.handleAuthorSelect}
                    onRemove={this.handleAuthorRemove}
                    /> : null}
                &nbsp;&nbsp;
                {Multiselect ? <Multiselect
                    className='esearch-tags'
                    options={this.state.tagLookup}
                    displayValue='text'
                    selectionLimit="3"
                    emptyRecordMsg={tt('search.tags')}
                    closeOnSelect='true'
                    closeIcon="cancel"
                    placeholder={tt('search.tags')}
                    onSearch={this.handleTagLookup}
                    onSelect={this.handleTagSelect}
                    onRemove={this.handleTagRemove}
                    /> : null}
              </div>
              {display}
              <br/>
              <br/>
              <hr/>
              <center><p className='another-search'>
              {tt('search.search_in')}
              <a target='_blank' href={'https://yandex.ru/search/?lr=35&text=' + this.state.query + ' site:golos.id'}>{tt('search.yandex')}</a>
              {tt('search.or')}
              <a target='_blank' href={'https://www.google.com/search?lr=&q=' + this.state.query + ' site:golos.id'}>{tt('search.google')}</a>
              </p></center>
          </div>);
    }
}


module.exports = {
    path: '/search(/:query)',
    component: Search
};
