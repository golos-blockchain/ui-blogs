import React from 'react';
import cn from 'classnames';
import tt from 'counterpart';
import KEYS from 'app/utils/keyCodes';
import Icon from 'app/components/elements/Icon';
import DialogManager from 'app/components/elements/common/DialogManager';
import AddImageDialog from '../../../dialogs/AddImageDialog';
import LinkOptionsDialog from '../../../dialogs/LinkOptionsDialog';
import plusSvg from 'app/assets/icons/editor-toolbar/plus.svg';

const MAX_HEADING = 4;
const TOOLBAR_OFFSET = 7;
const TOOLBAR_WIDTH = 468;
const TOOLBAR_COMMENT_WIDTH = 336;
const MIN_TIP_OFFSET = 29;

const PLUS_ACTIONS = [
    {
        id: 'picture',
        icon: 'picture',
        tooltip: 'post_editor.add_image',
    },
    {
        id: 'link',
        icon: 'link',
        tooltip: 'editor_toolbar.add_link',
        placeholder: 'editor_toolbar.enter_link',
    },
    {
        id: 'video',
        icon: 'video',
        tooltip: 'editor_toolbar.add_video',
        placeholder: 'editor_toolbar.enter_video_link',
    },
];

export default class MarkdownEditorToolbar extends React.PureComponent {
    constructor(props) {
        super(props);

        this._editor = props.editor;
        this._cm = this._editor.codemirror;

        this.state = {
            state: props.editor.getState(),
            toolbarShow: false,
            newLineOpen: false,
            selected: null,
        };

        this._onCursorActivityDelayed = () => {
            this._timeoutId = setTimeout(this._onCursorActivity, 5);
        };
    }

    componentDidMount() {
        this._delayedListenTimeout = setTimeout(() => {
            this._cm.on('cursorActivity', this._onCursorActivityDelayed);
            this._cm.on('focus', this._onCursorActivityDelayed);
        }, 700);
        document.addEventListener('keydown', this._onGlobalKeyDown);

        this._initTimeout = setTimeout(() => {
            if (this._cm.hasFocus()) {
                this._onCursorActivity();
            }
        }, 500);
    }

    componentWillUnmount() {
        this._unmount = true;

        clearTimeout(this._initTimeout);
        clearTimeout(this._delayedListenTimeout);
        this._cm.off('cursorActivity', this._onCursorActivityDelayed);
        this._cm.off('focus', this._onCursorActivityDelayed);
        document.removeEventListener('keydown', this._onGlobalKeyDown);
        clearTimeout(this._timeoutId);
    }

    render() {
        const { commentMode } = this.props;
        const { newLineHelper } = this.state;

        return (
            <div
                className={cn('MET', { MET_comment: commentMode })}
                ref="root"
                style={{ display: 'none' }}
            >
                {this._renderToolbar()}
                {newLineHelper ? this._renderHelper(newLineHelper) : null}
            </div>
        );
    }

    _renderToolbar() {
        const { SM, commentMode } = this.props;
        const { state, toolbarPosition, toolbarShow } = this.state;
        const { root } = this.refs;

        const editor = this._editor;

        const toolbarWidth = commentMode
            ? TOOLBAR_COMMENT_WIDTH
            : TOOLBAR_WIDTH;

        const style = {
            width: toolbarWidth,
        };

        let toolbarTipLeft = null;

        if (toolbarPosition) {
            const rootPos = root.getBoundingClientRect();

            style.top = toolbarPosition.top - rootPos.top - TOOLBAR_OFFSET;

            if (toolbarPosition.left != null) {
                let left = Math.round(toolbarPosition.left - rootPos.left);
                toolbarTipLeft = toolbarWidth / 2;

                const deltaLeft = left - toolbarWidth / 2;

                if (deltaLeft < 0) {
                    toolbarTipLeft = Math.max(MIN_TIP_OFFSET, left);
                    left = toolbarWidth / 2;
                } else {
                    const deltaRight = left + toolbarWidth / 2 - rootPos.width;

                    if (deltaRight > 0) {
                        toolbarTipLeft = Math.min(
                            toolbarWidth - MIN_TIP_OFFSET,
                            toolbarWidth / 2 + deltaRight
                        );
                        left = rootPos.width - toolbarWidth / 2;
                    }
                }

                style.left = Math.round(left);
            }
        }

        const actions = [
            {
                active: state.bold,
                icon: 'bold',
                tooltip: tt('editor_toolbar.bold'),
                onClick: () => SM.toggleBold(editor),
            },
            {
                active: state.italic,
                icon: 'italic',
                tooltip: tt('editor_toolbar.italic'),
                onClick: () => SM.toggleItalic(editor),
            },
            commentMode
                ? null
                : {
                      active: state.heading,
                      icon: 'header',
                      tooltip: tt('editor_toolbar.header'),
                      onClick: this._onHeadingClick,
                  },
            {
                active: state.strikethrough,
                icon: 'strike',
                tooltip: tt('editor_toolbar.strikethrough'),
                onClick: this._toggleStrikeThrough,
            },
            'SEPARATOR',
            {
                icon: 'bullet-list',
                tooltip: tt('editor_toolbar.unordered_list'),
                onClick: () => SM.toggleUnorderedList(editor),
            },
            {
                icon: 'number-list',
                tooltip: tt('editor_toolbar.ordered_list'),
                onClick: this._onToggleOrderedList,
            },
            'SEPARATOR',
            {
                active: state.quote,
                icon: 'quote',
                tooltip: tt('editor_toolbar.quote'),
                onClick: () => SM.toggleBlockquote(editor),
            },
            {
                active: state.link,
                icon: 'link',
                tooltip: tt('editor_toolbar.add_link'),
                onClick: this._draw,
            },
            {
                icon: 'picture',
                tooltip: tt('editor_toolbar.add_image'),
                onClick: this._addImage,
            },
            {
                icon: 'video',
                tooltip: tt('editor_toolbar.add_video'),
                onClick: this._drawVideo,
            },
        ];

        return (
            <div
                className={cn('MET__toolbar', {
                    MET__toolbar_raising: toolbarShow,
                })}
                style={style}
            >
                {toolbarTipLeft != null ? (
                    <div
                        className="MET__toolbar-tip"
                        style={{
                            left: toolbarTipLeft,
                        }}
                    />
                ) : null}
                {actions.map(
                    (action, i) =>
                        !action ? null : action === 'SEPARATOR' ? (
                            <i key={i} className="MET__separator" />
                        ) : (
                            <Icon
                                key={i}
                                className={cn('MET__icon', {
                                    MET__icon_active: action.active,
                                })}
                                name={`editor-toolbar/${action.icon}`}
                                data-tooltip={action.tooltip}
                                onClick={action.onClick}
                            />
                        )
                )}
            </div>
        );
    }

    _renderHelper(pos) {
        const { newLineOpen, selected } = this.state;
        const { root } = this.refs;

        const action = selected
            ? PLUS_ACTIONS.find(a => a.id === selected)
            : null;

        return (
            <div
                className={cn('MET__new-line-helper', {
                    'MET__new-line-helper_open': newLineOpen,
                    'MET__new-line-helper_selected': newLineOpen && selected,
                })}
                style={{
                    top: Math.round(
                        pos.top -
                            root.getBoundingClientRect().top -
                            window.scrollY
                    ),
                }}
            >
                <i
                    className="MET__plus"
                    dangerouslySetInnerHTML={{ __html: plusSvg }}
                    onClick={this._onPlusClick}
                />
                <div
                    className={cn('MET__new-line-actions', {
                        'MET__new-line-actions_selected': selected,
                    })}
                >
                    {PLUS_ACTIONS.map(action => (
                        <Icon
                            key={action.id}
                            className="MET__new-line-item MET__new-line-icon"
                            name={`editor-toolbar/${action.icon}`}
                            data-tooltip={tt(action.tooltip)}
                            onClick={() => this._onActionClick(action.id)}
                        />
                    ))}
                </div>
                {action ? (
                    <div
                        className="MET__new-line-input-wrapper"
                        key={action.id}
                    >
                        <Icon
                            className="MET__new-line-icon"
                            name={`editor-toolbar/${action.icon}`}
                            onClick={this._onResetActionClick}
                            data-tooltip={tt('g.cancel')}
                        />
                        <input
                            className="MET__new-line-input"
                            autoFocus
                            placeholder={tt(action.placeholder)}
                            onKeyDown={this._onInputKeyDown}
                        />
                    </div>
                ) : null}
            </div>
        );
    }

    _onCursorActivity = () => {
        this.setState({
            state: this._editor.getState(),
        });

        const cm = this._cm;

        const cursor = cm.getCursor();
        const line = cm.getLine(cursor.line);
        const selection = cm.getSelection();

        if (line.trim() === '') {
            const pos = cm.cursorCoords();

            // Sometimes editor being in invalid state, skip it
            if (pos.top > 20000) {
                return;
            }

            this.setState({
                newLineHelper: {
                    top: Math.ceil(pos.top + (pos.bottom - pos.top) / 2),
                },
                toolbarShow: false,
                newLineOpen: false,
                selected: null,
            });
            return;
        }

        const newState = {
            toolbarShow: false,
            newLineHelper: null,
        };

        if (selection) {
            const pos = cm.cursorCoords();

            const toolbarPosition = {
                top: Math.round(pos.top),
            };

            const selectionNode = document.querySelector(
                '.CodeMirror-selectedtext'
            );

            if (selectionNode) {
                const bound = selectionNode.getBoundingClientRect();

                toolbarPosition.top = Math.round(bound.top);
                toolbarPosition.left = Math.round(bound.left + bound.width / 2);
            }

            newState.toolbarShow = true;
            newState.toolbarPosition = toolbarPosition;
        }

        this.setState(newState);
    };

    _onPlusClick = () => {
        if (this.state.newLineOpen) {
            this.setState({
                newLineOpen: false,
            });
        } else {
            this.setState({
                newLineOpen: true,
                selected: null,
            });
        }
    };

    _onActionClick = id => {
        if (id === 'picture') {
            this._addImage();
        } else {
            this.setState({
                selected: id,
            });
        }
    };

    _onResetActionClick = () => {
        this.setState({
            selected: null,
        });
    };

    _onInputKeyDown = e => {
        if (e.which === KEYS.ENTER) {
            const value = e.target.value;
            e.target.value = '';

            this._makeNewLineAction(value);

            this.setState({
                newLineOpen: false,
                selected: null,
            });
        }
    };

    _toggleStrikeThrough = () => {
        const cm = this._cm;

        const selection = cm.getSelection();
        const selectionTrimmed = selection.trim();

        if (
            selection !== selectionTrimmed &&
            selectionTrimmed &&
            !selection.includes('\n')
        ) {
            const start = cm.getCursor('start');
            const end = cm.getCursor('end');

            cm.setSelection(
                {
                    ch:
                        start.ch +
                        (selection.length - selection.trimLeft().length),
                    line: start.line,
                },
                {
                    ch:
                        end.ch -
                        (selection.length - selection.trimRight().length),
                    line: end.line,
                }
            );
        }

        setTimeout(() => {
            this.props.SM.toggleStrikethrough(this._editor);
        });
    };

    _makeNewLineAction(text) {
        const { selected } = this.state;
        const cm = this._cm;

        if (selected === 'link') {
            const selection = cm.getSelection() || text;
            const cursor = cm.getCursor();

            cm.replaceSelection(`[${selection}](${text})`);

            cm.setSelection(
                {
                    ch: cursor.ch + 1,
                    line: cursor.line,
                },
                {
                    ch: cursor.ch + selection.length + 1,
                    line: cursor.line,
                }
            );

            setTimeout(() => {
                cm.focus();
            });
        } else if (selected === 'video') {
            cm.replaceSelection(this._processVideoUrl(text));
            cm.focus();
        } else {
            console.error('INVALID_CASE');
        }
    }

    _draw = () => {
        const selection = this._cm.getSelection();

        const props = {
            text: '',
            link: '',
        };

        if (selection) {
            const match = selection.match(/^\[([^\]]*)\]\(([^)]*)\)$/);

            if (match) {
                props.text = match[1];
                props.link = match[2];
            } else if (/^http|^\/\//.test(selection)) {
                props.link = selection;
            } else {
                props.text = selection;
            }
        }

        DialogManager.showDialog({
            component: LinkOptionsDialog,
            props,
            onClose: data => {
                if (!this._unmount && data) {
                    this._cm.replaceSelection(`[${data.text}](${data.link})`);
                }
            },
        });
    };

    _insertLink(url, isImage) {
        const cm = this._cm;

        const startPoint = cm.getCursor('start');
        const selection = cm.getSelection();

        let offset;
        if (isImage) {
            cm.replaceSelection(`![${selection}](${url})`);
            offset = 2;
        } else {
            cm.replaceSelection(`[${selection}](${url})`);
            offset = 1;
        }

        cm.setSelection(
            {
                ch: startPoint.ch + offset,
                line: startPoint.line,
            },
            {
                ch: startPoint.ch + offset + selection.length,
                line: startPoint.line,
            }
        );
        cm.focus();
    }

    _addImage = () => {
        DialogManager.showDialog({
            component: AddImageDialog,
            onClose: this._onAddImageClose,
        });
    };

    _drawVideo = async () => {
        const url = await DialogManager.prompt(
            tt('editor_toolbar.enter_the_link') + ':'
        );

        if (url) {
            this._cm.replaceSelection(this._processVideoUrl(url));
            this._cm.focus();
        }
    };

    _processVideoUrl(url) {
        // Parse https://vimeo.com/channels/staffpicks/273652603
        const match = url.match(
            /^(?:https?:\/\/)?vimeo\.com\/[a-z0-9]+\/[a-z0-9]+\/(\d+.*)$/
        );

        if (match) {
            return `https://vimeo.com/${match[1]}`;
        }

        return url;
    }

    _onHeadingClick = () => {
        const cm = this._cm;

        const cursor = cm.getCursor();
        const text = cm.getLine(cursor.line);

        const match = text.match(/^(#+)(\s*)/);

        if (match) {
            const count = match[1].length;

            if (count >= MAX_HEADING) {
                cm.setSelection(
                    {
                        ch: 0,
                        line: cursor.line,
                    },
                    {
                        ch: count + match[2].length,
                        line: cursor.line,
                    }
                );

                cm.replaceSelection('');
                cm.setCursor({
                    ch: 0,
                    line: cursor.line,
                });
            } else {
                cm.setCursor({
                    ch: 0,
                    line: cursor.line,
                });
                cm.replaceSelection('#');

                cm.setCursor({
                    ch: 1 + count + match[2].length,
                    line: cursor.line,
                });
            }
        } else {
            cm.setCursor({
                ch: 0,
                line: cursor.line,
            });
            cm.replaceSelection('# ');
        }

        cm.focus();
    };

    _onToggleOrderedList = () => {
        //this.props.SM.toggleOrderedList(this._editor);
        //return;
        const cm = this._cm;

        const cursor = cm.getCursor('start');
        const cursorEnd = cm.getCursor('end');
        const selection = cm.getSelection();

        if (!selection.trim()) {
            cm.replaceSelection('1. ');
            cm.setCursor({
                ch: 2,
                line: cursor.line,
            });
            return;
        }

        cm.setSelection(
            {
                ch: 0,
                line: cursor.line,
            },
            {
                ch: cursorEnd.ch,
                line: cursorEnd.line,
            }
        );

        let selectionLines = cm.getSelection().split('\n');

        if (/^\d+\. /.test(selectionLines[0])) {
            selectionLines = selectionLines.map(line =>
                line.replace(/^\d+\.\s+/, '')
            );
        } else {
            selectionLines = selectionLines.map(
                (line, i) => `${i + 1}. ${line}`
            );
        }

        cm.replaceSelection(selectionLines.join('\n'));
        cm.setSelection(
            {
                ch: 0,
                line: cursor.line,
            },
            {
                ch: 99999,
                line: cursorEnd.line,
            }
        );
    };

    _onAddImageClose = data => {
        this.setState({
            newLineOpen: false,
            selected: null,
        });

        if (!data) {
            return;
        }

        if (data.file) {
            this.props.uploadImage(data.file, progress => {
                if (progress.url) {
                    this._insertLink(progress.url, true);
                }
            });
        } else if (data.url) {
            this._insertLink(data.url, true);
        }
    };

    _onGlobalKeyDown = e => {
        if (this.state.toolbarShow && e.which === KEYS.ESCAPE) {
            this.setState({
                toolbarShow: false,
            });
        }
    };
}
