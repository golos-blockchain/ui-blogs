import React from 'react';
import PropTypes from 'prop-types';
import cloneDeep from 'lodash/cloneDeep';
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

        perPage: PropTypes.number.isRequired,
        onLoadMore: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);
        this.state = {
            items: [],
            page: 0,
            loading: false,
        };
    }

    componentDidMount() {
        this.initItems(this.props.items);
    }

    componentDidUpdate(prevProps) {
        const { items, } = this.props;
        if (items && (!prevProps.items || items.length !== prevProps.items.length)) {
            this.initItems(items);
        }
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
        if (this.state.page === 0) return;
        const { page, } = this.state;
        this.loadMore(page - 1);
    };

    _renderPaginator = () => {
        const { perPage, } = this.props;
        const { items, page, } = this.state;
        const hasMore = items.length > perPage;
        if (page === 0 && !hasMore) {
            return null;
        }
        return {
            value: <span>
              <span className='PagedDropdownMenu__paginator' onClick={this.prevPage}>
                {page > 0 ? '< ' + tt('g.back') : ''}</span>
              <span className='PagedDropdownMenu__paginator' onClick={hasMore ? this.nextPage : null}>
                {hasMore ? tt('g.more_list') + ' >' : ''}
                </span></span>,
        };
    };

    render() {
        const { el, selected, children, className, title, href, noArrow, perPage, } = this.props;
        const { items, loading, } = this.state;

        let itemsWithPaginator = [];
        if (!loading) {
            itemsWithPaginator = [...items];
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