import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import tt from 'counterpart';

import TagInput from 'app/components/elements/postEditor/TagInput';
import TagsEditLine from 'app/components/elements/postEditor/TagsEditLine';
import PostOptions from 'app/components/elements/postEditor/PostOptions/PostOptions';
import Button from 'app/components/elements/common/Button';
import Hint from 'app/components/elements/common/Hint';
import VerticalMenu from 'app/components/elements/VerticalMenu'
import { NSFW_TAG, ONLYBLOG_TAG, ONLYAPP_TAG } from 'app/utils/tags';
import { VISIBLE_TYPES } from 'app/components/modules/PostForm/PostForm';
import './PostFooter.scss';

export default class PostFooter extends PureComponent {
    static propTypes = {
        editMode: PropTypes.bool,
        tags: PropTypes.array,
        publishedLimited: PropTypes.bool,
        postDisabled: PropTypes.bool,
        postEncrypted: PropTypes.bool,
        disabledHint: PropTypes.string,
        isS: PropTypes.bool,
        onPayoutTypeChange: PropTypes.func.isRequired,
        onCurationPercentChange: PropTypes.func.isRequired,
        onDecryptFeeChange: PropTypes.func.isRequired,
        onTagsChange: PropTypes.func.isRequired,
        onPost: PropTypes.func.isRequired,
        onResetClick: PropTypes.func.isRequired,
        onCancelClick: PropTypes.func.isRequired,
    };

    state = {
        temporaryErrorText: null,
        singleLine: true,
        showVisibleOptions: false,
    };

    constructor(props) {
        super(props)
        this._onAwayClickListen = false
    }

    componentDidMount() {
        this._checkSingleLine();

        this._resizeInterval = setInterval(() => {
            this._checkSingleLine();
        }, 1000);
    }

    componentWillUnmount() {
        clearInterval(this._resizeInterval);
        clearTimeout(this._temporaryErrorTimeout);

        this._unmount = true

        if (this._onAwayClickListen) {
            window.removeEventListener('mousedown', this._onAwayClick)
        }
    }

    onCategoryChange = (event) => {
        let { tags, categories } = this.props;
        this.props.onTagsChange(
            tags.length >= 1 && categories.includes(tags[0]) ?
            [event.target.value, ...tags.slice(1)] :
            [event.target.value, ...tags]);
    }

    onPostClick = (e) => {
        e.preventDefault()

        const { editMode, postEncrypted } = this.props
        if (editMode) {
            this.props.onPost(postEncrypted ? VISIBLE_TYPES.ONLY_SPONSORS : VISIBLE_TYPES.ALL,
                this.props.decryptFee)
            return
        }

        this.setState({
            showVisibleOptions: !this.state.showVisibleOptions
        },
        () => {
            const { showVisibleOptions } = this.state;

            if (showVisibleOptions && !this._onAwayClickListen) {
                window.addEventListener('mousedown', this._onAwayClick)
                this._onAwayClickListen = true
            }
        })
    }

    _onAwayClick = e => {
        if (!this._popupVisible || !this._popupVisible.contains(e.target)) {
            setTimeout(() => {
                if (!this._unmount) {
                    this.setState({
                        showVisibleOptions: false,
                    });
                }
            }, 50);
        }
    };

    _popupVisibleRef = el => {
        this._popupVisible = el
    }

    _renderVisibleOptions = (postDisabled) => {
        const { decryptFee } = this.props

        const onClick = (e) => {
            e.preventDefault()
            if (!postDisabled)
                this.props.onPost(parseInt(e.target.parentNode.dataset.value),
                    decryptFee)
        }

        const visibleItems = [
            {disabled: decryptFee && decryptFee.amount > 0, link: '#', label: tt('post_editor.visible_option_all'), value: VISIBLE_TYPES.ALL, onClick },
            {disabled: decryptFee && decryptFee.amount > 0, link: '#', label: tt('post_editor.visible_option_onlyblog'), value: VISIBLE_TYPES.ONLY_BLOG, onClick },
            {link: '#', label: tt('post_editor.visible_option_onlysponsors'), value: VISIBLE_TYPES.ONLY_SPONSORS, onClick },
        ]

        return (
            <Hint key='3' align='right' innerRef={this._popupVisibleRef} className='PostFooter__visible-hint'>
                <span className='caption'>
                    {tt('post_editor.set_visible_type')}
                </span>
                <VerticalMenu items={visibleItems} />
            </Hint>
        )
    }

    render() {
        let {
            editMode,
            tags,
            categories,
            postDisabled,
            disabledHint,
            isS,
        } = this.props;
        const { temporaryErrorText, singleLine, showVisibleOptions } = this.state;

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

        let isMobile = false;
        if (process.env.BROWSER) {
            isMobile = window.matchMedia('screen and (max-width: 39.9375em)').matches;
        }

        const options = (<PostOptions
            nsfw={this.props.tags.includes(NSFW_TAG)}
            onNsfwClick={this._onNsfwClick}
            payoutType={this.props.payoutType}
            curationPercent={this.props.curationPercent}
            editMode={editMode}
            onPayoutChange={this.props.onPayoutTypeChange}
            onCurationPercentChange={this.props.onCurationPercentChange}
            decryptFee={this.props.decryptFee}
            onDecryptFeeChange={this.props.onDecryptFeeChange}
        />)

        const buttons = (<div className="PostFooter__buttons" style={{ 'marginTop': isMobile ? '15px' : '0px' }}>
            <div className="PostFooter__button">
                {editMode ? (
                    <Button style={{'minWidth': '140px'}} onClick={this.props.onCancelClick}>
                        {tt('g.cancel')}
                    </Button>
                ) : (
                    <Button style={{'minWidth': '140px'}} onClick={this.props.onResetClick}>
                        {tt('g.clear')}
                    </Button>
                )}
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
                ) : showVisibleOptions ? this._renderVisibleOptions(postDisabled) : null}
                <Button
                    primary
                    disabled={postDisabled}
                    onClick={this.onPostClick}
                    style={{'minWidth': '140px'}}
                >
                    {editMode
                        ? tt('post_editor.update')
                        : tt('g.post')}
                </Button>
            </div>
        </div>)

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
                        {!editMode && <select className={cn('PostFooter__category', {
                            small: isS
                        })} value={category} onChange={this.onCategoryChange}>
                            <option value="" disabled>{isS ? tt('category_selector_jsx.select_a_category2') : tt('category_selector_jsx.select_a_category')}</option>
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
                        <TagInput tags={tagsNoCat} onChange={onTagsChange}
                            isS={isS} />
                    </div>
                    {isMobile ? null : options}
                    {isMobile ? null : buttons}
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
                {isMobile ? options : null}
                {isMobile ? buttons : null}
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
