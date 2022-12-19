import React from 'react';

export default class PostSummaryThumb extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    let { visitedClassName, title, body, isNsfw } = this.props
    title = title || ''
    body = body || ''
    let className = this.props.mobile ? ('PostSummary__image-mobile ' + visitedClassName) : 'PostSummary__image '
    if (isNsfw) {
      className += ' nsfw-img'
    }
    return (
      <a href={this.props.href} target={this.props.target} onClick={this.props.onClick}>
        <span className="PostSummary__image_container">
         <picture className="PostSummary__image_container-wrapper">
          <img
            src={this.props.src}
            className={className}
            ref={(img) => {
              this.img = img;
            }}>
          </img>
         </picture>
          <div className="PostSummary__text">{title}</div>
        </span>
      </a>
    );
  }
}
