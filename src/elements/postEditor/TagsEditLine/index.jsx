import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import Icon from 'app/components/elements/Icon';
import { getFavoriteTags, ONLYAPP_TAG, ONLYBLOG_TAG } from 'app/utils/tags';

export default class TagsEditLine extends React.PureComponent {
    static propTypes = {
        tags: PropTypes.arrayOf(PropTypes.string).isRequired,
        inline: PropTypes.bool,
        editMode: PropTypes.bool,
        hidePopular: PropTypes.bool,
        onChange: PropTypes.func.isRequired,
    };

    state = {
        favoriteTags: [],
    };

    componentDidMount() {
        window.addEventListener('mouseup', this._onGlobalMouseUp);

        this.setState({
            favoriteTags: getFavoriteTags(),
        });
    }

    componentWillUnmount() {
        this._unmount = true;

        window.removeEventListener('mouseup', this._onGlobalMouseUp);
        window.removeEventListener('mousemove', this._onGlobalMouseMove);

        this._toggleDraggingMode(false);
    }

    render() {
        const { tags, className, hidePopular, inline } = this.props;

        return (
            <div
                className={cn(
                    'TagsEditLine',
                    {
                        TagsEditLine_inline: inline,
                        TagsEditLine_drag: this._isDragging,
                    },
                    className
                )}
            >
                <div className="TagsEditLine__wrapper">
                    {this._renderTagList()}
                    {hidePopular ? null : this._renderPopularList()}
                </div>
            </div>
        );
    }

    _renderTagList() {
        const { tags } = this.props;

        return (
            <div className="TagsEditLine__tag-list">
                {tags.map((tag, i) => this._renderTag(tag, i))}
            </div>
        );
    }

    _renderTag(tag, i) {
        const { editMode } = this.props;
        const allowMove = (i !== 0 || !editMode) && (tag !== ONLYBLOG_TAG && tag !== ONLYAPP_TAG)

        return (
            <span
                key={tag}
                className={cn('TagsEditLine__tag', {
                    TagsEditLine__tag_draggable: allowMove,
                    TagsEditLine__tag_drag:
                        allowMove && this._draggingTag === tag,
                })}
                data-tag={tag}
                ref={this._draggingTag === tag ? 'drag-item' : null}
                onMouseDown={allowMove ? this._onMouseDown : null}
                onMouseMove={
                    this._isDragging && this._draggingTag !== tag
                        ? this._onTagMouseMove
                        : null
                }
            >
                {tag}
                {allowMove ? (
                    <i
                        className="TagsEditLine__tag-icon"
                        onClick={() => this._removeTag(tag)}
                    >
                        <Icon name="editor/cross" size="0_75x" />
                    </i>
                ) : null}
            </span>
        );
    }

    _renderPopularList() {
        const { tags } = this.props;
        const { favoriteTags } = this.state;

        const favorites = favoriteTags.filter(tag => !tags.includes(tag));

        if (!favorites.length) {
            return null;
        }

        return (
            <div className="TagsEditLine__tag-list TagsEditLine__tag-list_popular">
                {favorites.map(tag => (
                    <span
                        key={tag}
                        className="TagsEditLine__tag TagsEditLine__tag_favorite"
                        onClick={() => this._onAddPopularTag(tag)}
                    >
                        <span className="TagsEditLine__shrink">{tag}</span>
                        <i className="TagsEditLine__tag-icon">
                            <Icon name="editor/plus" size="0_75x" />
                        </i>
                    </span>
                ))}
            </div>
        );
    }

    _onMouseDown = e => {
        e.preventDefault();

        this._toggleDraggingMode(false);

        this._mouseDownPosition = {
            x: e.clientX,
            y: e.clientY,
            tag: e.currentTarget.getAttribute('data-tag'),
        };

        window.addEventListener('mousemove', this._onGlobalMouseMove);
    };

    _onGlobalMouseUp = () => {
        this._toggleDraggingMode(false);
    };

    _onGlobalMouseMove = e => {
        if (this._isDragging) {
            return;
        }

        const pos = this._mouseDownPosition;

        if (Math.abs(pos.x - e.clientX) + Math.abs(pos.y - e.clientY) > 5) {
            this._mouseDownPosition = null;
            this._toggleDraggingMode(true);
            this._draggingTag = pos.tag;

            window.removeEventListener('mousemove', this._onGlobalMouseMove);

            this.forceUpdate();
        }
    };

    _toggleDraggingMode(enable) {
        window.removeEventListener('mousemove', this._onGlobalMouseMove);

        if (this._isDragging === enable) {
            return;
        }

        if (enable) {
        } else {
            window.removeEventListener('mousemove', this._onGlobalMouseMove);
            this._draggingTag = null;
        }

        this._isDragging = enable;

        if (!this._unmount) {
            this.forceUpdate();
        }
    }

    _onTagMouseMove = e => {
        if (!this._isDragging) {
            return;
        }

        const target = e.currentTarget;

        const tag = target.dataset['tag'];

        const box = target.getBoundingClientRect();
        const draggingBox = this.refs['drag-item'].getBoundingClientRect();

        const modifier = box.x > draggingBox.x ? 0.2 : 0.8;
        let positionShift = e.clientX > box.x + box.width * modifier ? 1 : 0;

        const newTags = this.props.tags.filter(
            tag => tag !== this._draggingTag
        );

        const tagIndex = newTags.indexOf(tag);

        if (this.props.editMode && tagIndex === 0) {
            positionShift = 1;
        }

        newTags.splice(tagIndex + positionShift, 0, this._draggingTag);

        this.props.onChange(newTags);
    };

    _removeTag = tag => {
        const { tags } = this.props;
        this.props.onChange(tags.filter(t => t !== tag));
    };

    _onAddPopularTag = tag => {
        const { tags } = this.props;

        if (!tags.includes(tag)) {
            this.props.onChange([...tags, tag]);
        }
    };
}
