import React from 'react';
import PropTypes from 'prop-types';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual'
import tt from 'counterpart';
import DropdownMenu from 'app/components/elements/DropdownMenu';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';

const hideLastItem = true;

export default class PagedDropdownMenu extends React.Component {
    static propTypes = {
        items: PropTypes.arrayOf(PropTypes.object).isRequired,
        selected: PropTypes.string,
        children: PropTypes.object,
        className: PropTypes.string,
        title: PropTypes.string,
        href: PropTypes.string,
        el: PropTypes.string.isRequired,
        noArrow: PropTypes.bool,

        page: PropTypes.number,
        perPage: PropTypes.number.isRequired,
        renderItem: PropTypes.func.isRequired,
        onLoadMore: PropTypes.func,
    };

    static defaultProps = {
        page: 1
    }

    constructor(props) {
        super(props);
        this.state = {
            items: [],
            page: props.page,
            loading: false,
        };
    }

    componentDidMount() {
        const { items, page, } = this.props
        this.initItems(this.sliceItems(items, page))
        this.setState({ page })
    }

    componentDidUpdate(prevProps) {
        const { items, page, } = this.props
        if (items && (!prevProps.items || !isEqual(items, prevProps.items))) {
            const sliced = this.sliceItems(items, 1)
            this.initItems(sliced)
            this.setState({ page: 1 })
        } else if (page && prevProps.page !== page) {
            this.setState({ page })
        }
    }

    sliceItems = (items, page) => {
        const { onLoadMore, perPage } = this.props
        if (onLoadMore) {
            return items
        }
        const startIdx = perPage * (page - 1)
        const endIdx = startIdx + perPage + 1
        const sliced = items.slice(startIdx, endIdx)
        return sliced
    }

    initItems = (items) => {
        if (!items || !items.length)
            return;
        this.setState({
            items: cloneDeep(items),
        });
    };

    loadMore = async (newPage) => {
        const { items, page, } = this.state;
        const { onLoadMore, } = this.props;
        if (!onLoadMore) {
            setTimeout(async () => {
                this.setState({
                    page: newPage
                }, () => {
                    this.initItems(this.sliceItems(this.props.items, newPage))
                })
            }, 10);
            return
        }
        setTimeout(async () => {
            this.setState({
                page: newPage,
                loading: true,
            });
            if (onLoadMore) {
                const res = await onLoadMore({ page, newPage, items, });
                this.setState({
                    loading: false,
                });
                this.initItems(res);
            }
        }, 10);
    };

    nextPage = () => {
        const { page, } = this.state;
        this.loadMore(page + 1);
    };

    prevPage = () => {
        if (this.state.page === 1) return;
        const { page, } = this.state;
        this.loadMore(page - 1);
    };

    _renderPaginator = () => {
        const { perPage, } = this.props;
        const { items, page, } = this.state;
        const hasMore = items.length > perPage;
        if (page === 1 && !hasMore) {
            return null;
        }
        const hasPrev = page > 1
        return {
            value: <span>
              <span className={'PagedDropdownMenu__paginator' + (hasPrev ? '' : ' disabled')} onClick={this.prevPage}>
                {hasPrev ? '< ' + tt('g.back') : ''}</span>
              <span className={'PagedDropdownMenu__paginator' + (hasMore ? '' : ' disabled')} onClick={hasMore ? this.nextPage : null}>
                {hasMore ? tt('g.more_list') + ' >' : ''}
                </span></span>,
        };
    };

    render() {
        const { el, selected, children, className, title, href, noArrow, perPage, renderItem, } = this.props
        const { items, loading, } = this.state;

        let itemsWithPaginator = [];
        if (!loading) {
            for (let i = 0; i < items.length; ++i) {
                const rendered = renderItem(items[i])
                itemsWithPaginator.push(rendered)
            }
            if (items.length > perPage && hideLastItem) {
                itemsWithPaginator.pop();
            }
            const paginator = this._renderPaginator();
            if (paginator) {
                itemsWithPaginator.push(paginator);
            }
        } else {
            itemsWithPaginator = [{value: <span>
                    <LoadingIndicator type='circle' />
                </span>}];
        }

        return (<DropdownMenu 
            children={children}
            title={title}
            href={href}
            noArrow={noArrow}
            className={className}
            items={itemsWithPaginator}
            selected={selected}
            el={el} />)
    }
};