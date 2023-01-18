import React from 'react';
import './HtmlEditor.scss';

let RichTextEditor;

if (process.env.BROWSER) {
    RichTextEditor = require('react-rte').default;
}

export default class HtmlEditor extends React.PureComponent {
    static createValueFromString(htmlString) {
        return RichTextEditor.createValueFromString(htmlString, 'html');
    }

    static getStateFromHtml(html) {
        if (html) {
            html = stripHtmlWrapper(html).trim();
        }

        if (html) {
            return RichTextEditor.createValueFromString(html, 'html');
        } else {
            return RichTextEditor.createEmptyValue();
        }
    }

    render() {
        // Don't try to render on server
        if (!RichTextEditor) {
            return;
        }

        const toolbarConfig = {
            display: ['INLINE_STYLE_BUTTONS', 'BLOCK_TYPE_BUTTONS', 'LINK_BUTTONS',
                'IMAGE_BUTTON', 'BLOCK_TYPE_DROPDOWN', 'HISTORY_BUTTONS'],
            INLINE_STYLE_BUTTONS: [
                { label: 'Bold', style: 'BOLD'},
                { label: 'Italic', style: 'ITALIC'},
                { label: 'Strikethrough', style: 'STRIKETHROUGH'},
                { label: 'Monospace', style: 'CODE'}
            ],
            BLOCK_TYPE_BUTTONS: [
                { label: 'UL', style: 'unordered-list-item'},
                { label: 'OL', style: 'ordered-list-item'},
                { label: 'Blockquote', style: 'blockquote'},
            ],
            BLOCK_TYPE_DROPDOWN: [
                {label: 'Normal', style: 'unstyled'},
                {label: 'Heading Large', style: 'header-one'},
                {label: 'Heading Medium', style: 'header-two'},
                {label: 'Heading Small', style: 'header-three'},
                {label: 'Code Block', style: 'code-block'},
            ]
        }

        return (
            <RichTextEditor
                className="HtmlEditor"
                toolbarClassName='editorToolbar'
                toolbarConfig={toolbarConfig}
                value={this.props.value}
                onChange={this.props.onChange}
                ref="editor"
            />
        );
    }

    getValue() {
        const html = this.props.value.toString('html');

        if (html === '<p></p>' || html === '<p><br></p>' || html === '') {
            return '';
        }

        return `<html>\n${html}\n</html>`;
    }

    isEmpty() {
        return !this.getValue();
    }
}

function stripHtmlWrapper(text) {
    const match = text.match(/<html>\n*([\s\S]+?)?\n*<\/html>/);
    return match && match.length === 2 ? match[1] : text;
}
