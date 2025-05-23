import React from 'react';
import PropTypes from 'prop-types';
import throttle from 'lodash/throttle';
import { connect } from 'react-redux';
import Turndown from 'turndown';
import cn from 'classnames';
import tt from 'counterpart';
import { api } from 'golos-lib-js'
import { Asset } from 'golos-lib-js/lib/utils'

import transaction from 'app/redux/Transaction';
import HtmlReady, { getTags } from 'shared/HtmlReady';
import DialogManager from 'app/components/elements/common/DialogManager';
import Icon from 'app/components/elements/Icon';
import MarkdownEditor from 'app/components/elements/postEditor/MarkdownEditor/MarkdownEditor';
import HtmlEditor from 'app/components/elements/postEditor/HtmlEditor/HtmlEditor';
import EditorSwitcher from 'app/components/elements/postEditor/EditorSwitcher/EditorSwitcher';
import PostFooter from 'app/components/elements/postEditor/PostFooter/PostFooter';
import PostTitle from 'app/components/elements/postEditor/PostTitle/PostTitle';
import PreviewButton from 'app/components/elements/postEditor/PreviewButton';
import MarkdownViewer, {
    getRemarkable,
} from 'app/components/cards/MarkdownViewer';
import { checkPostHtml } from 'app/utils/validator';
import { DEBT_TICKER } from 'app/client_config';
import {
    ONLYAPP_TAG, ONLYBLOG_TAG,
    processTagsFromData,
    processTagsToSend,
    validateTags,
    updateFavoriteTags,
} from 'app/utils/tags';
import { DRAFT_KEY, EDIT_KEY } from 'app/utils/postForm';
import { checkAllowed, AllowTypes } from 'app/utils/Allowance'
import { makeOid, encryptPost, } from 'app/utils/sponsors'
import { withScreenSize } from 'app/utils/ScreenSize'
import { reloadLocation } from 'app/utils/app/RoutingUtils'

const EDITORS_TYPES = {
    MARKDOWN: 1,
    MARKDOWN_OLD: 2,
    HTML: 3,
};

export const PAYOUT_TYPES = {
    PAY_0: 1,
    PAY_50: 2,
    PAY_100: 3,
};

export const VISIBLE_TYPES = {
    ALL: 1,
    ONLY_BLOG: 2,
    ONLY_SPONSORS: 3,
};

const DEFAULT_CURATION_PERCENT = 5000; // 50%

export const PAYOUT_OPTIONS = [
    {
        id: PAYOUT_TYPES.PAY_100,
        title: 'post_editor.payout_option_100',
        hint: 'post_editor.payout_option_100_hint',
    },
    {
        id: PAYOUT_TYPES.PAY_50,
        title: 'post_editor.payout_option_50',
        hint: 'post_editor.payout_option_50_hint',
    },
    {
        id: PAYOUT_TYPES.PAY_0,
        title: 'post_editor.payout_option_0',
        hint: 'post_editor.payout_option_0_hint',
    },
];

class PostForm extends React.Component {
    static propTypes = {
        editMode: PropTypes.bool,
        editParams: PropTypes.object,
        jsonMetadata: PropTypes.object,
        onCancel: PropTypes.func,
        onSuccess: PropTypes.func,
    };

    constructor(props) {
        super(props);

        const { editMode } = this.props;

        this.state = {
            isPreview: false,
            editorId: EDITORS_TYPES.MARKDOWN,
            title: '',
            text: '',
            emptyBody: true,
            rteState: null,
            tags: [],
            postError: null,
            payoutType: PAYOUT_TYPES.PAY_100,
            curationPercent: DEFAULT_CURATION_PERCENT,
            decryptFee: null,
            isPosting: false,
            uploadingCount: 0,
        };

        this._saveDraftLazy = throttle(this._saveDraft, 500, { leading: true });
        this._checkBodyLazy = throttle(this._checkBody, 300, {
            leading: false,
        });
        this._postSafe = this._safeWrapper(this._post);

        let isLoaded = false;

        try {
            isLoaded = this._tryLoadDraft();
        } catch (err) {
            console.warn('[Golos.id] Draft recovering failed:', err);
        }

        if (editMode) {
            const tags = this._getTagsFromMetadata();
            if (!isLoaded) {
                this._fillFromMetadata(tags);
            }
        }
    }

    _tryLoadDraft() {
        const { editMode } = this.props;

        let json;

        if (editMode) {
            json = sessionStorage.getItem(EDIT_KEY);
        } else {
            json = localStorage.getItem(DRAFT_KEY);
        }

        if (json) {
            const draft = JSON.parse(json);

            if (editMode && draft.permLink !== this.props.editParams.permlink) {
                return;
            }

            const state = this.state;

            state.editorId = draft.editorId;
            state.title = draft.title;
            state.text = draft.text;
            state.emptyBody = draft.text.trim().length === 0;
            state.tags = draft.tags;
            state.payoutType = draft.payoutType || PAYOUT_TYPES.PAY_50;
            state.curationPercent = draft.curationPercent || DEFAULT_CURATION_PERCENT;
            if (draft.decryptFee) {
                state.decryptFee = Asset(draft.decryptFee)
            }

            if (state.editorId === EDITORS_TYPES.MARKDOWN_OLD) {
                state.editorId = EDITORS_TYPES.MARKDOWN;
            }

            if (state.editorId === EDITORS_TYPES.HTML) {
                state.text = null;
                state.rteState = HtmlEditor.getStateFromHtml(draft.text);
            }

            return true;
        }
    }

    _getTagsFromMetadata() {
        const { editParams, jsonMetadata } = this.props;

        const tagsFromData = [...(jsonMetadata.tags || [])];

        if (tagsFromData[0] !== editParams.category) {
            tagsFromData.unshift(editParams.category);
        }

        return processTagsFromData(tagsFromData);
    }

    _fillFromMetadata(tags) {
        const { editParams, curationPercent, jsonMetadata } = this.props;

        if (jsonMetadata.format === 'markdown') {
            this.state.editorId = EDITORS_TYPES.MARKDOWN;
        } else if (editParams.body.startsWith('<html')) {
            this.state.editorId = EDITORS_TYPES.HTML;
        }

        this.state.title = editParams.title;

        if (this.state.editorId === EDITORS_TYPES.HTML) {
            this.state.text = null;
            this.state.rteState = HtmlEditor.getStateFromHtml(editParams.body);
        } else {
            this.state.text = editParams.body;
        }

        this.state.emptyBody = false;
        this.state.curationPercent = curationPercent;
        this.state.decryptFee = editParams.decrypt_fee

        this.state.tags = tags;
    }

    componentWillUnmount() {
        this._unmount = true;
    }

    render() {
        const { editMode, editParams, categories,
            isS, } = this.props;

        const {
            editorId,
            title,
            text,
            tags,
            payoutType,
            curationPercent,
            decryptFee,
            isPreview,
            postError,
            uploadingCount,
            isPosting,
        } = this.state;



        const disallowPostCode = this._checkDisallowPost();

        return (
            <div
                className={cn('PostForm', {
                    PostForm_page: !editMode,
                    PostForm_edit: editMode,
                })}
            >
                <div className="PostForm__work-area" ref="workArea">
                    <div className="PostForm__content">
                        <PreviewButton
                            isPreview={isPreview}
                            onPreviewChange={this._onPreviewChange}
                        />
                        <EditorSwitcher
                            items={[
                                {
                                    id: EDITORS_TYPES.MARKDOWN,
                                    text: tt('post_editor.new_editor'),
                                },
                                {
                                    id: EDITORS_TYPES.HTML,
                                    text: tt('post_editor.html_editor'),
                                },
                            ]}
                            activeId={editorId}
                            onChange={this._onEditorChange}
                            isS={isS}
                        />
                        {isPreview ? null : (
                            <PostTitle
                                value={title}
                                placeholder={tt(
                                    'post_editor.title_placeholder'
                                )}
                                validate={this._validateTitle}
                                onTab={this._onTitleTab}
                                onChange={this._onTitleChange}
                            />
                        )}
                        <div style={{ display: isPreview ? 'none' : 'block' }}>
                            {this._renderEditorPanel()}
                        </div>
                        {isPreview ? (
                            <div className="PostForm__preview">
                                <h1 className="PostForm__title-preview">
                                    {title.trim() ||
                                        tt('post_editor.title_placeholder')}
                                </h1>
                                <MarkdownViewer text={text} large />
                            </div>
                        ) : null}
                    </div>
                </div>
                <div className="PostForm__footer">
                    <div className="PostForm__footer-content">
                        <PostFooter
                            ref="footer"
                            editMode={editMode}
                            errorText={postError}
                            tags={tags}
                            categories={categories.get('categories').toJS()}
                            onTagsChange={this._onTagsChange}
                            payoutType={payoutType}
                            curationPercent={curationPercent}
                            onPayoutTypeChange={this._onPayoutTypeChange}
                            onCurationPercentChange={this._onCurationPercentChange}
                            decryptFee={decryptFee}
                            onDecryptFeeChange={this._onDecryptFeeChange}
                            postDisabled={
                                Boolean(disallowPostCode) || isPosting
                            }
                            postEncrypted={editMode ? editParams.encrypted : false}
                            disabledHint={
                                disallowPostCode
                                    ? tt(disallowPostCode)
                                    : null
                            }
                            isS={isS}
                            onPost={this._postSafe}
                            onResetClick={this._onResetClick}
                            onCancelClick={this._onCancelClick}
                        />
                    </div>
                </div>
                {uploadingCount > 0 || isPosting ? (
                    <div className="PostForm__spinner">
                        <Icon
                            name="clock"
                            size="4x"
                            className="PostForm__spinner-inner"
                        />
                    </div>
                ) : null}
            </div>
        );
    }

    _renderEditorPanel() {
        const { editorId, text } = this.state;

        if (editorId === EDITORS_TYPES.MARKDOWN) {
            return (
                <MarkdownEditor
                    ref="editor"
                    initialValue={text}
                    scrollContainer={this.refs.workArea}
                    placeholder={tt('post_editor.text_placeholder')}
                    uploadImage={this._onUploadImage}
                    onChangeNotify={this._onTextChangeNotify}
                />
            );
        } else if (editorId === EDITORS_TYPES.HTML) {
            return (
                <HtmlEditor
                    ref="editor"
                    value={this.state.rteState}
                    onChange={this._onHtmlEditorChange}
                />
            );
        }
    }

    _onEditorChange = async toEditorId => {
        const { editorId } = this.state;
        let newText = null;
        let newRteState = null;

        if (editorId === EDITORS_TYPES.HTML) {
            if (this.refs.editor.isEmpty()) {
                newText = '';
                newRteState = null;
            } else {
                if (
                    !(await DialogManager.dangerConfirm(
                        tt('post_editor.convert_to_md_warning')
                    ))
                ) {
                    return;
                }

                const td = new Turndown({
                    headingStyle: 'atx',
                });

                newText = td.turndown(this.refs.editor.getValue());

                newText = newText.replace(
                    /~~~ embed:([A-Za-z0-9_]+) (youtube|vimeo|coub) ~~~/g,
                    (a, code, hosting) => {
                        if (hosting === 'youtube') {
                            return `https://youtube.com/watch?v=${code}`;
                        } else if (hosting === 'coub') {
                            return `https://coub.com/view/${code}`;
                        } else {
                            return `https://vimeo.com/${code}`;
                        }
                    }
                );

                newRteState = null;
            }
        } else if (editorId === EDITORS_TYPES.MARKDOWN) {
            const body = this.refs.editor.getValue();

            if (body.trim()) {
                if (
                    !(await DialogManager.dangerConfirm(
                        tt('post_editor.convert_to_html_warning')
                    ))
                ) {
                    return;
                }
            }

            newText = null;
            newRteState = markdownToHtmlEditorState(body);
        }

        this.setState(
            {
                editorId: toEditorId,
                text: newText,
                rteState: newRteState,
                isPreview: false,
            },
            this._saveDraftLazy
        );
    };

    _onPreviewChange = enable => {
        if (enable) {
            this._saveDraft();

            this.setState({
                isPreview: true,
                text: this.refs.editor.getValue(),
            });
        } else {
            this.setState({
                isPreview: false,
            });
        }
    };

    _onTitleChange = title => {
        this.setState(
            {
                title,
            },
            this._saveDraftLazy
        );
    };

    _onTitleTab = () => {
        try {
            this.refs.editor.focus();
        } catch (err) {}
    };

    _onHtmlEditorChange = state => {
        this.setState(
            {
                rteState: state,
            },
            this._onTextChangeNotify
        );
    };

    _onTextChangeNotify = () => {
        this._saveDraftLazy();
        this._checkBodyLazy();
    };

    _onTagsChange = tags => {
        this.setState(
            {
                tags: [...new Set(tags)]
            },
            this._saveDraftLazy
        );
    };

    _onCurationPercentChange = percent => {
        this.setState({ curationPercent: percent }, this._saveDraftLazy);
    };

    _onPayoutTypeChange = payoutType => {
        this.setState({ payoutType }, this._saveDraftLazy);
    };

    _onDecryptFeeChange = fee => {
        this.setState({ decryptFee: fee.clone() }, this._saveDraftLazy)
    };

    _saveDraft = () => {
        const { editMode, editParams } = this.props;
        const {
            isPreview,
            editorId,
            title,
            text,
            tags,
            payoutType,
            curationPercent,
            decryptFee,
        } = this.state;

        try {
            let body;

            if (isPreview) {
                body = text;
            } else {
                body = this.refs.editor.getValue();
            }

            const save = {
                permLink: editMode ? editParams.permlink : undefined,
                editorId,
                title,
                text: body,
                tags,
                payoutType,
                curationPercent,
                decryptFee: decryptFee ? decryptFee.toString() : null
            };

            const json = JSON.stringify(save);

            if (editMode) {
                sessionStorage.setItem(EDIT_KEY, json);
            } else {
                localStorage.setItem(DRAFT_KEY, json);
            }
        } catch (err) {
            console.warn('[Golos.id] Draft not saved:', err);
        }
    };

    _validateTitle = title => {
        const _title = title.trim();

        if (
            /\*[\w\s]*\*|#[\w\s]*#|_[\w\s]*_|~[\w\s]*~|]\s*\(|]\s*\[/.test(
                _title
            )
        ) {
            return tt('submit_a_story.markdown_not_supported');
        }
    };

    _safeWrapper(callback) {
        return (...args) => {
            try {
                return callback(...args);
            } catch (err) {
                console.error(err);
                this.refs.footer.showPostError('Что-то пошло не так');
            }
        };
    }

    _post = (visibleType, decryptFee) => {
        const { author, editMode } = this.props;
        const { title, tags, payoutType, curationPercent, editorId } = this.state;
        let error;

        if (!title.trim()) {
            this.refs.footer.showPostError(
                tt('category_selector_jsx.title_is_required')
            );
            return;
        }

        if (this._validateTitle(title)) {
            this.refs.footer.showPostError(
                tt('category_selector_jsx.title_is_not_valid')
            );
            return;
        }

        if (!tags.length) {
            this.refs.footer.showPostError(
                tt('category_selector_jsx.must_set_category')
            );
            return;
        }

        if ((error = validateTags(tags, true))) {
            this.refs.footer.showPostError(error);
            return;
        }

        let processedTags = processTagsToSend(tags);

        if (visibleType === VISIBLE_TYPES.ONLY_BLOG) {
            if (!processedTags.includes(ONLYBLOG_TAG))
                processedTags.push(ONLYBLOG_TAG)
        }

        const body = this.refs.editor.getValue();
        let html;

        if (!body || !body.trim()) {
            this.refs.footer.showPostError(tt('post_editor.empty_body_error'));
            return;
        }

        if (editorId === EDITORS_TYPES.MARKDOWN) {
            html = getRemarkable().render(body);
        } else if (editorId === EDITORS_TYPES.HTML) {
            html = body;
        }

        const rtags = getTags(html);

        if (editorId === EDITORS_TYPES.HTML) {
            rtags.htmltags.delete('html');
        }

        if ((error = checkPostHtml(rtags))) {
            this.refs.footer.showPostError(error.text);
            return;
        }

        const meta = {
            app: $STM_Config.site_domain + '/0.1',
            format: editorId === EDITORS_TYPES.HTML ? 'html' : 'markdown',
            tags: processedTags,
        };

        if (rtags.usertags.size) {
            meta.users = [...rtags.usertags];
        }

        if (rtags.images.size) {
            const [firstImage] = rtags.images
            meta.image = [firstImage]
        }

        if (rtags.links.size) {
            meta.links = [...rtags.links];
        }

        const data = {
            author,
            title,
            body,
            category: processedTags[0],
            parent_author: '',
            parent_permlink: undefined, // ???
            json_metadata: meta,
            __config: {
                autoVote: false,
            },
        };

        if (editMode) {
            const { editParams } = this.props;

            data.permlink = editParams.permlink;
            data.parent_permlink = editParams.parent_permlink;
            data.__config.originalBody = editParams.body;

            data.__config.comment_options = {}
        } else {
            const commentOptions = {
                curator_rewards_percent: curationPercent,
            };

            if (payoutType === PAYOUT_TYPES.PAY_0) {
                commentOptions.max_accepted_payout = '0.000 ' + DEBT_TICKER;
            } else if (payoutType === PAYOUT_TYPES.PAY_100) {
                commentOptions.percent_steem_dollars = 0;
            }

            data.__config.comment_options = commentOptions;
        }

        if (decryptFee) {
            data.__config.comment_options.comment_decrypt_fee = decryptFee
        }

        this.setState({
            isPosting: true,
        });

        this.props.onPost(
            data,
            editMode,
            visibleType,
            (payload) => {
                try {
                    if (editMode) {
                        sessionStorage.removeItem(EDIT_KEY);
                    } else {
                        localStorage.removeItem(DRAFT_KEY);
                    }
                } catch (err) {}

                if (!this._unmount) {
                    setTimeout(() => {
                        if (!this._unmount) {
                            this.setState({
                                isPosting: false,
                            })
                        }
                    }, 1000)

                    this.props.onSuccess(payload, editMode, visibleType)
                }

                if (!editMode) {
                    updateFavoriteTags(tags);
                }
            },
            err => {
                if (!this._unmount) {
                    this.setState({
                        isPosting: false,
                    });

                    if (err) this.refs.footer.showPostError(err.toString().trim());
                }
            }
        );
    };

    _onResetClick = () => {
        let rteState = null;

        if (this.state.editorId === EDITORS_TYPES.MARKDOWN) {
            if (this.refs.editor) {
                this.refs.editor.setValue('');
            }
        } else {
            rteState = HtmlEditor.getStateFromHtml('');
        }

        this.setState({
            title: '',
            text: '',
            rteState,
            tags: [],
            isPreview: false,
        });

        localStorage.removeItem(DRAFT_KEY);
    };

    _onCancelClick = async () => {
        if (await DialogManager.confirm(tt('g.are_you_sure'))) {
            try {
                sessionStorage.removeItem(EDIT_KEY);
            } catch (err) {}

            this.props.onCancel();
        }
    };

    _onUploadImage = (file, progress) => {
        this.setState(
            {
                uploadingCount: this.state.uploadingCount + 1,
            },
            () => {
                this.props.uploadImage({
                    file,
                    progress: data => {
                        if (!this._unmount) {
                            if (data && (data.url || data.error)) {
                                this.setState({
                                    uploadingCount:
                                        this.state.uploadingCount - 1,
                                });
                            }

                            progress(data);
                        }
                    },
                });
            }
        );
    };

    _checkBody() {
        const editor = this.refs.editor;

        if (editor) {
            const value = editor.getValue();

            this.setState({
                emptyBody: value.trim().length === 0,
            });
        }
    }

    _checkDisallowPost() {
        const { title, emptyBody, tags, uploadingCount } = this.state;

        if (uploadingCount > 0) {
            return 'post_editor.wait_uploading';
        }

        if (!title.trim()) {
            return 'post_editor.enter_title';
        }

        if (emptyBody) {
            return 'post_editor.enter_body';
        }
    }
}

function markdownToHtmlEditorState(markdown) {
    let html;

    if (markdown && markdown.trim() !== '') {
        html = getRemarkable().render(markdown);
        html = HtmlReady(html);
    }

    return HtmlEditor.getStateFromHtml(html);
}

export default connect(
    state => ({
        author: state.user.getIn(['current', 'username']),
        categories: state.global.get('tag_idx'),
    }),
    dispatch => ({
        async onPost(payload, editMode, visibleType, onSuccess, onError) {
            const onlySponsors = visibleType === VISIBLE_TYPES.ONLY_SPONSORS

            const decryptFee = payload.__config.comment_options.comment_decrypt_fee
            const hasDecryptFee = (decryptFee && decryptFee.amount > 0)

            if (onlySponsors && !hasDecryptFee) {
                let pso
                try {
                    pso = await api.getPaidSubscriptionOptionsAsync({
                        author: payload.author,
                        oid: makeOid()
                    })
                } catch (err) {
                    console.error('Cannot get paid subscription', err)
                    onError(err)
                    return
                }
                if (!pso.author) {
                    reloadLocation('/@' + payload.author + '/sponsors')
                    return
                }
            }

            if (onlySponsors || hasDecryptFee) {
                try {
                    payload.body = await encryptPost(payload)
                } catch (err) {
                    console.error('Cannot encrypt', err)
                    onError(err)
                    return
                }
            }

            let blocking = await checkAllowed(payload.author,
                [],
                null, editMode ? AllowTypes.postEdit : AllowTypes.post)
            if (blocking.error) {
                onError(blocking.error)
                return
            }
            const confirm = blocking.confirm
            dispatch(
                transaction.actions.broadcastOperation({
                    type: 'comment',
                    operation: payload,
                    confirm,
                    hideErrors: true,
                    errorCallback: onError,
                    successCallback: () => {
                        onSuccess(payload)
                    },
                })
            );
        },
        uploadImage({ file, progress }) {
            dispatch({
                type: 'user/UPLOAD_IMAGE',
                payload: {
                    file,
                    progress: data => {
                        if (data && data.error) {
                            dispatch({
                                type: 'ADD_NOTIFICATION',
                                payload: {
                                    message: data.error,
                                    dismissAfter: 5000,
                                },
                            });
                        }

                        progress(data);
                    },
                },
            });
        },
    })
)(withScreenSize(PostForm))
