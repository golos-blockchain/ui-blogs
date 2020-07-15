import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import tt from 'counterpart';
import TagInput from 'app/components/elements/postEditor/TagInput';
import TagsEditLine from 'app/components/elements/postEditor/TagsEditLine';
import PostOptions from 'app/components/elements/postEditor/PostOptions/PostOptions';
import Button from 'app/components/elements/common/Button';
import Hint from 'app/components/elements/common/Hint';
import { NSFW_TAG } from 'app/utils/tags';
import './PostFooter.scss';

export default class PostFooter extends PureComponent {
    static propTypes = {
        editMode: PropTypes.bool,
        tags: PropTypes.array,
        postDisabled: PropTypes.bool,
        disabledHint: PropTypes.string,
        onPayoutTypeChange: PropTypes.func.isRequired,
        onCurationPercentChange: PropTypes.func.isRequired,
        onTagsChange: PropTypes.func.isRequired,
        onPostClick: PropTypes.func.isRequired,
        onResetClick: PropTypes.func.isRequired,
        onCancelClick: PropTypes.func.isRequired,
    };

    state = {
        temporaryErrorText: null,
        singleLine: true,
    };

    componentDidMount() {
        this._checkSingleLine();

        this._resizeInterval = setInterval(() => {
            this._checkSingleLine();
        }, 1000);
    }

    componentWillUnmount() {
        clearInterval(this._resizeInterval);
        clearTimeout(this._temporaryErrorTimeout);
    }

    onCategoryChange = (event) => {
        let { tags, categories } = this.props;
        this.props.onTagsChange(
            tags.length >= 1 && categories.includes(tags[0]) ?
            [event.target.value, ...tags.slice(1)] :
            [event.target.value, ...tags]);
    }

    render() {
        let {
            editMode,
            tags,
            categories,
            postDisabled,
            disabledHint,
        } = this.props;
        const { temporaryErrorText, singleLine } = this.state;

        let category = "";

        let tagsNoCat = [];
        let onTagsChange= null;
        if (!editMode) {
            if (tags.length >= 1 && categories.includes(tags[0])) {
                category = tags[0];
                tagsNoCat = tags.slice(1);
            } else {
                tagsNoCat = tags;
                postDisabled = true;
                disabledHint = tt('category_selector_jsx.must_set_category');
            }

            onTagsChange = (tags) => {
                this.props.onTagsChange(category != "" ? [category, ...tags] : tags);
            };
        } else {
            tagsNoCat = tags;

            onTagsChange = (tags) => {
                this.props.onTagsChange(tags);
            };
        }

        return (
            <div
                className={cn('PostFooter', {
                    PostFooter_edit: editMode,
                    'PostFooter_fix-height': singleLine,
                })}
                ref="root"
            >
                <div className="PostFooter__line">
                    <div className="PostFooter__tags">
                        {!editMode && <select className="PostFooter__category" value={category} onChange={this.onCategoryChange}>
                            <option value="" disabled>{tt('category_selector_jsx.select_a_category')}</option>
                            {
                                categories.map((cat) => {
                                    return <option className="PostFooter__cat" key={cat} value={cat}>{cat}</option>;
                                })
                            }
                        </select>}
                        {singleLine ? (
                            <TagsEditLine
                                tags={tagsNoCat}
                                inline
                                editMode={editMode}
                                className="PostFooter__inline-tags-line"
                                hidePopular={editMode}
                                onChange={onTagsChange}
                            />
                        ) : null}
                        <TagInput tags={tagsNoCat} onChange={onTagsChange} />
                    </div>
                    <PostOptions
                        nsfw={this.props.tags.includes(NSFW_TAG)}
                        onNsfwClick={this._onNsfwClick}
                        payoutType={this.props.payoutType}
                        curationPercent={this.props.curationPercent}
                        editMode={editMode}
                        onPayoutChange={this.props.onPayoutTypeChange}
                        onCurationPercentChange={this.props.onCurationPercentChange}
                    />
                    <div className="PostFooter__buttons">
                        <div className="PostFooter__button">
                            {editMode ? (
                                <Button onClick={this.props.onCancelClick}>
                                    {tt('g.cancel')}
                                </Button>
                            ) : null}
                        </div>
                        <div
                            className={cn('PostFooter__button', {
                                'PostFooter__button_hint-disabled': postDisabled,
                            })}
                        >
                            {postDisabled && disabledHint ? (
                                <Hint
                                    key="1"
                                    warning
                                    align="right"
                                    className="PostFooter__disabled-hint"
                                >
                                    {disabledHint}
                                </Hint>
                            ) : temporaryErrorText ? (
                                <Hint key="2" error align="right">
                                    {temporaryErrorText}
                                </Hint>
                            ) : null}
                            <Button
                                primary
                                disabled={postDisabled}
                                onClick={this.props.onPostClick}
                            >
                                {editMode
                                    ? tt('post_editor.update')
                                    : tt('g.post')}
                            </Button>
                        </div>
                    </div>
                </div>
                {singleLine ? null : (
                    <TagsEditLine
                        className="PostFooter__tags-line"
                        editMode={editMode}
                        tags={tagsNoCat}
                        hidePopular={editMode}
                        onChange={onTagsChange}
                    />
                )}
            </div>
        );
    }

    showPostError(errorText) {
        clearTimeout(this._temporaryErrorTimeout);

        this.setState({
            temporaryErrorText: errorText,
        });

        this._temporaryErrorTimeout = setTimeout(() => {
            this.setState({
                temporaryErrorText: null,
            });
        }, 5000);
    }

    _checkSingleLine() {
        const singleLine = this.refs.root.clientWidth > 950;

        if (this.state.singleLine !== singleLine) {
            this.setState({ singleLine });
        }
    }

    _onNsfwClick = () => {
        const tags = this.props.tags;
        let newTags;

        if (tags.includes(NSFW_TAG)) {
            newTags = tags.filter(t => t !== NSFW_TAG);
        } else {
            newTags = tags.concat(NSFW_TAG);
        }

        this.props.onTagsChange(newTags);
    };
}
