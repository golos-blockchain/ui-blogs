import React from 'react';
// keep this in memory, no requests
import nsfwBanner from 'app/assets/images/nsfw/light.png'
// import * as pixelate from './utils/effects/close-pixelate'


//todo render fallback image by react, not by canvas depending on state?

export default class PostSummaryThumb extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  handleImageLoaded() {
    if (this.props.isNsfw) {
      this.cp = new window.ClosePixelation(this.img, this.canvas)
      try {
        this.cp.render([
          {
            // todo fix author's algorithm
            // either loses color channels or disappears completely )
            // only these options render well
            resolution: 10,
            alpha: 1,
            size: 10,
          }
        ])
      }
      catch (e) {
        // clear canvas before the fallback image drawing!
        this.cp.ctx.clearRect(0, 0, this.cp.width, this.cp.height);
        this.cp.ctx.drawImage(this.defaultImage,
          this.cp.width / 2 - this.defaultImage.width / 2,
          this.cp.height / 2 - this.defaultImage.height / 2,
        )
      }
    }
  }

  handleImageErrored() {
    this.setState({imageStatus: 'failed to load'});
  }

  render() {
    let {visitedClassName, title, body} = this.props;
    title = title ? title : '';
    body = body ? body : '';
    return (
      <a href={this.props.href} target={this.props.target} onClick={this.props.onClick}>
        <span className="PostSummary__image_container">
         <picture className="PostSummary__image_container-wrapper">
          <img
            src={this.props.src}
            style={this.props.isNsfw ? {display: "none"} : {}}
            className={this.props.mobile ? ('PostSummary__image-mobile ' + visitedClassName) : 'PostSummary__image '}
            ref={(img) => {
              this.img = img;
            }}>
          </img>
          <img
            ref={(img) => {
              this.defaultImage = img;
            }}
            style={!this.props.isNsfw ? {display: "none"} : {}}
            // src={`/images/18_plus.png`}
            src={nsfwBanner}
            className={'PostSummary__image '} //+ visitedClassName}*!/*/}
          >
          </img>
         </picture>
          <div className="PostSummary__text">{title}</div>
        </span>
      </a>
    );
  }
}
