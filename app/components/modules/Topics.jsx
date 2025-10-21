import React from 'react';
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom';
import cookie from "react-cookie";
import tt from 'counterpart';
import capitalize from 'lodash/capitalize'

import { detransliterate } from 'app/utils/ParsersAndFormatters';
import { isCyrillicTag, processCyrillicTag } from 'app/utils/tags';
import { SELECT_TAGS_KEY } from 'app/client_config';
import { withRouter } from 'app/utils/routing'

class Topics extends React.Component {
    static propTypes = {
        categories: PropTypes.object.isRequired,
        user: PropTypes.string,
        metaData: PropTypes.object,
        loading: PropTypes.bool,
        order: PropTypes.string,
        current: PropTypes.string,
        loadSelected: PropTypes.func,
        updateSubscribe: PropTypes.func,
        className: PropTypes.string,
        compact: PropTypes.bool
    };

    constructor(props) {
        super(props);

        const cookieKeys = cookie.load(SELECT_TAGS_KEY) || [];
        const profileKeys = props.metaData && props.metaData.profile && props.metaData.profile.select_tags || [];
        let keys = cookieKeys
        if (typeof keys !== 'object' || !keys.length) {
          keys = profileKeys
        }
        this.state = {
          expanded: false,
          selected: keys,
          selectedExpanded: false,
          needUpdateSubscribe: cookieKeys.join('') !== profileKeys.join('') || false
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        const res = this.props.categories !== nextProps.categories ||
            this.props.current !== nextProps.current ||
            this.props.order !== nextProps.order || this.state !== nextState;
        return res;
    }

    onSaveTags = () => {
        if (this.props.updateSubscribe)
            this.props.updateSubscribe(() => {
                this.setState({
                    needUpdateSubscribe: false,
                });
            });
    };

    onSelectTag = key => {
      let keys = this.state.selected
      const index = keys.indexOf(key)
      if (index !== -1)
        keys.splice(index, 1)
      else
        keys.push(key)
      keys.sort()
      this.setState({selected: keys})
      cookie.save(SELECT_TAGS_KEY, keys, {path: "/", expires: new Date(Date.now() + 60 * 60 * 24 * 365 * 10 * 1000)});
      if (! this.props.loading && this.props.loadSelected)
        this.props.loadSelected(keys)

      const profileKeys = this.props.metaData && this.props.metaData.profile && this.props.metaData.profile.select_tags || [];
      this.setState({needUpdateSubscribe: keys.join('') !== profileKeys.join('')})
    }

    expand = (e) => {
        e.preventDefault();
        this.setState({expanded: true});
        return false;
    }

    onSelectExpand = (e) => {
        e.preventDefault();
        this.setState({selectedExpanded: ! this.state.selectedExpanded});
        return false;
    }

    render() {
        const {
            props: {order, current, compact, className, user},
            state: {expanded, selected, selectedExpanded},
            onSelectTag, onSaveTags, expand, onSelectExpand
        } = this;

        if (!this.props.categories)
            return

        let categories = this.props.categories.get('categories');
        if (!(expanded) || compact) categories = categories.take(50);
        categories = categories.map(cat => {
            if (/^(u\w{4}){6,}/.test(cat)) return null;
            return cat ? cat : null;
        }).filter(cat => {
          return cat !== null
        })

        const cn = 'Topics' + (className ? ` ${className}` : '');
        const currentValue = `/${order}/${current}`;
        const selectedKeys = selected.map(key => {
          const link = order ? `/${order}/${key}` : `/${key}`;
          return <div key={`selected-${key}`}>
            <a className="action" onClick={() => onSelectTag(key)}>×</a><Link to={link} className="tagname" activeClassName="active" style={{textTransform: 'capitalize'}} title={detransliterate(key)}>{detransliterate(key)}</Link>
          </div>
        })
        const expandFilterButton = selectedKeys.length > 2 &&
          selectedExpanded ?
            <a onClick={onSelectExpand} className="expand">{tt('g.collapse')} &uarr;</a> :
            <a onClick={onSelectExpand} className="expand">{tt('g.expand')} &darr;</a>
        ;
        let isSelected = false

        if (compact) {
            const homePath = '/' + order
            const { router } = this.props
            return <select className={cn} onChange={(e) => {
                const { value } = e.target
                if (value === '_home') {
                    e.preventDefault()
                    router.navigate(homePath)
                    return
                }
                router.navigate(value)
            }} value={currentValue}>
                <option key={'*'} value={homePath} hidden>{tt('g.topics')}...</option>
                {(process.env.BROWSER && location.pathname !== homePath) ?
                    <option key={'*'} value='_home'>&lt; {tt('g.all_posts')}...</option> : null}
                {categories.map(cat => {
                    const link = order ? `/${order}/${cat}` : `/hot/${cat}`;
                    cat = capitalize(cat)
                    return <option key={cat} value={link}>{cat}</option>
                })}
            </select>;
        }

        categories = categories.map((cat) => {
            const urlTag = isCyrillicTag(cat) ? processCyrillicTag(cat) : cat
            const link = order ? `/${order}/${urlTag}` : `/hot/${urlTag}`;

            isSelected = selected.indexOf(cat) !== -1
            return <li key={cat} className={isSelected ? 'Topics__selected__remove' : 'Topics__selected__add'}>
                        <a className="action" onClick={() => onSelectTag(cat)}>{isSelected ? '×' : '+'}</a>
                        <Link to={link} className="tagname" activeClassName="active" title={cat} style={{textTransform: 'capitalize'}}>{cat}</Link>
                    </li>;
        });
        return (
            <ul className={cn}>
                <li className={`Topics__filter ${selectedExpanded ? 'filter_expanded' : 'filter_fixed'}`} key="filter">
                  <b>{tt('g.tags_filter')}</b>{' ('+ selectedKeys.length + ')'}&nbsp;&nbsp;&nbsp;
                  <input
                    onClick={onSaveTags}
                    disabled={! this.state.needUpdateSubscribe}
                    type="button"
                    className="button"
                    value={tt('g.save')}
                  />
                  {selectedKeys.length ? selectedKeys : <div><span>{tt('g.no_tags_selected')}</span></div>}
                </li>
                <li className="Topics__filter__expand" key="filter__expand_action">{expandFilterButton}</li>
                {categories}
                {!expanded && <li className="show-more">
                        <Link to={`/tags`}>{tt('g.show_more_topics')}</Link>
                    </li>
                }
            </ul>
        );
    }
}

export default withRouter(Topics);
