import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Remarkable from 'remarkable';
import cn from 'classnames';
import tt from 'counterpart';
import sanitize from 'sanitize-html';
import HtmlReady from 'shared/HtmlReady';
import { getTags } from 'shared/HtmlReady'
import YoutubePlayer from 'app/components/elements/common/YoutubePlayer/YoutubePlayer';
import sanitizeConfig, { noImageText } from 'app/utils/SanitizeConfig';
import Lightbox from 'lightbox-react';
import 'lightbox-react/style.css';

let remarkable = null;

export function getRemarkable() {
    if (!remarkable) {
        remarkable = new Remarkable({
            html: true,
            breaks: true,
            // Linkify is done locally
            // Issue: https://github.com/jonschlinkert/remarkable/issues/142#issuecomment-221546793
            linkify: false,
            typographer: false,
            quotes: '“”‘’',
        });
    }

    return remarkable;
}

class MarkdownViewer extends Component {
    static propTypes = {
        text: PropTypes.string,
        className: PropTypes.string,
        large: PropTypes.bool,
        formId: PropTypes.string, // This is unique for every editor of every post (including reply or edit)
        canEdit: PropTypes.bool,
        highQualityPost: PropTypes.bool,
        noImage: PropTypes.bool,
        allowDangerousHTML: PropTypes.bool,
    };

    static defaultProps = {
        large: false,
        allowDangerousHTML: false,
    };

    constructor(props) {
        super(props);

        this.images = [];
        this.imagesAlts = [];

        this.handleContentClick = this.handleContentClick.bind(this);
    }

    state = {
      allowNoImage: true,

      lightboxOpen: false,
      lightboxIndex: 0
    };

    shouldComponentUpdate(np, ns) {
        return (
            np.text !== this.props.text ||
            np.large !== this.props.large ||
            // np.formId !== this.props.formId ||
            np.canEdit !== this.props.canEdit ||
            ns.allowNoImage !== this.state.allowNoImage ||
            ns.lightboxOpen !== this.state.lightboxOpen ||
            ns.lightboxIndex !== this.state.lightboxIndex
        );
    }

    onAllowNoImage = () => {
        this.setState({ ...this.state, allowNoImage: false });
    };

    handleContentClick(e) {
      if (e.target.tagName === 'IMG' && this.images) {
        const tags = this.contentDiv.getElementsByTagName('img');
        for (let i = 0; i < tags.length; i += 1) {
          if (tags[i] === e.target && this.images.length > i) {
            if (e.target.parentNode && e.target.parentNode.tagName === 'A') return;
            this.setState({
              ...this.state,

              lightboxOpen: true,
              lightboxIndex: i
            })
          }
        }
      }
    }

    render() {
        const { noImage, className, large, highQualityPost } = this.props;
        const { allowNoImage, lightboxOpen, lightboxIndex } = this.state;

        let text = this.props.text || '';

        let isHtml = false;
        // See also ReplyEditor isHtmlTest
        const htmlMatch = text.match(/^<html>([\S\s]*)<\/html>$/);

        if (htmlMatch) {
            text = htmlMatch[1];
            isHtml = true;
        } else {
            isHtml = text.startsWith('<p>');
        }

        // Strip out HTML comments.
        text = text.replace(/<!--([\s\S]+?)(?:-->|$)/g, '');

        let renderedText = isHtml ? text : getRemarkable().render(text);

        if (renderedText) {
            // Embed videos, link mentions and hashtags, etc...
            renderedText = HtmlReady(renderedText);
        }

        let cleanText;

        if (this.props.allowDangerousHTML === true) {
            console.warn('WARN\tMarkdownViewer rendering unsanitized content');
            cleanText = renderedText;
        } else {
            // Complete removal of javascript and other dangerous tags..
            // The must remain as close as possible to dangerouslySetInnerHTML
            cleanText = sanitize(
                renderedText,
                sanitizeConfig({
                    large,
                    highQualityPost,
                    noImage: noImage && allowNoImage,
                })
            );
        }

        // "&amp;mdash;" -> "&mdash;" and so on
        cleanText = cleanText.replace(
            /&amp;(mdash|rdquo|ndash|ldquo|laquo|raquo|zwj)/g,
            (match, word) => '&' + word
        );

        cleanText = cleanText.replace(
            /<a\s+href="http:\/\/bit\.do\/.+?<\/a>/g,
            '[ fishing link ]'
        );

        if (/<\s*script/gi.test(cleanText)) {
            // Not meant to be complete checking, just a secondary trap and red flag (code can change)
            console.error(
                'Refusing to render script tag in post text',
                cleanText
            );
            return <div />;
        }

        const rtags = getTags(cleanText);
        this.images = Array.from(rtags.images);

        const noImageActive = cleanText.indexOf(noImageText) !== -1;

        let idx = 0;
        const sections = [];

        // HtmlReady inserts ~~~ embed:${id} type ~~~
        for (let section of cleanText.split('~~~ embed:')) {
            const match = section.match(
                /^([A-Za-z0-9_-]+) (youtube|vimeo|coub|ok_video|rutube) ~~~/
            );

            if (match) {
                const [, id, type] = match;

                const w = large ? 640 : 480;
                const h = large ? 360 : 270;

                if (type === 'youtube') {
                    sections.push(
                        <YoutubePlayer
                            className="videoWrapper"
                            key={++idx}
                            width={w}
                            height={h}
                            youTubeId={id}
                        />
                    );
                } else if (type === 'vimeo') {
                    sections.push(
                        <div className="videoWrapper" key={++idx}>
                            <iframe
                                src={`https://player.vimeo.com/video/${id}`}
                                width={w}
                                height={h}
                                frameBorder="0"
                                allowFullScreen
                            />
                        </div>
                    );
                } else if (type === 'coub') {
                    sections.push(
                        <iframe
                            key={++idx}
                            src={`//coub.com/embed/${id}?muted=true&autostart=true&originalSize=false&startWithHD=false&hideTopBar=true`}
                            allowFullScreen
                            frameBorder="0"
                            width="100%"
                            height="300"
                            allow="autoplay"
                        />
                    );
                } else if (type === 'rutube') {
                    sections.push(
                        <div className="videoWrapper" key={++idx}>
                            <iframe
                                src={`//rutube.ru/play/embed/${id}/`}
                                allowFullScreen
                                frameBorder="0"
                                width="100%"
                                height="200"
                                allow="autoplay"
                            />
                        </div>
                    );
                } else if (type === 'ok_video') {
                    sections.push(
                        <div className="videoWrapper" key={++idx}>
                            <iframe
                                src={`//ok.ru/videoembed/${id}`}
                                allowFullScreen
                                frameBorder="0"
                                width="100%"
                                height="200"
                                allow="autoplay"
                            />
                        </div>
                    );
                } else {
                    console.error('MarkdownViewer unknown embed type', type);
                }
                section = section.substring(`${id} ${type} ~~~`.length);

                if (section === '') {
                    continue;
                }
            }

            sections.push(
                <div
                    key={++idx}
                    dangerouslySetInnerHTML={{ __html: section }}
                />
            );
        }

        return (
          <div
              role="presentation"
              className={cn('MarkdownViewer Markdown', className, {
                  html: isHtml,
                  'MarkdownViewer--small': !large,
              })}
              ref={(div) => {
                this.contentDiv = div;
              }}
              onClick={this.handleContentClick}
          >
                {sections}
                {noImageActive &&
                    allowNoImage && (
                        <div
                            onClick={this.onAllowNoImage}
                            className="MarkdownViewer__negative_group"
                        >
                            {tt(
                                'markdownviewer_jsx.images_were_hidden_due_to_low_ratings'
                            )}
                            <button
                                style={{ marginBottom: 0 }}
                                className="button hollow tiny float-right"
                            >
                                {tt('g.show')}
                            </button>
                        </div>
                    )}
                {lightboxOpen && (
                  <Lightbox
                    mainSrc={this.images[lightboxIndex]}
                    nextSrc={this.images[(lightboxIndex + 1) % this.images.length]}
                    prevSrc={this.images[(lightboxIndex + (this.images.length - 1)) % this.images.length]}
                    onCloseRequest={() => {
                      this.setState({
                        ...this.state,
                        lightboxOpen: false
                      });
                    }}
                    onMovePrevRequest={() =>
                      this.setState({
                        ...this.state,
                        lightboxIndex: (lightboxIndex + (this.images.length - 1)) % this.images.length
                      })
                    }
                    onMoveNextRequest={() =>
                      this.setState({
                        ...this.state,
                        lightboxIndex: (lightboxIndex + (this.images.length + 1)) % this.images.length
                      })
                    }
                  />
                )}
            </div>
        );
    }
}

// TODO: Why needs a connect?
export default connect((state, props) => props)(MarkdownViewer);
