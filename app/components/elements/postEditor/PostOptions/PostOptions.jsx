import React, { createRef } from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import tt from 'counterpart';
import { isNil } from 'ramda';
import { api } from 'golos-js';
import {connect} from 'react-redux';


import styled from 'styled-components';
import Slider from 'golos-ui/Slider';
import Icon from 'app/components/elements/Icon';
import Hint from 'app/components/elements/common/Hint';
import RadioGroup from 'app/components/elements/common/RadioGroup';
import { PAYOUT_OPTIONS } from 'app/components/modules/PostForm/PostForm';
import './PostOptions.scss';


const SliderStyled = styled(Slider)`
    margin-top: 20px;
`;

const CuratorText = styled.p`
    margin: 0 0 6px;
    font-size: 15px;
    white-space: nowrap;
    color: #393636;
`;

const CuratorValue = styled.b`
    display: inline-block;
    width: 38px;
    text-align: left;
    font-weight: 500;
`;



class PostOptions extends React.PureComponent {
    static propTypes = {
        nsfw: PropTypes.bool.isRequired,
        payoutType: PropTypes.number.isRequired,
        curationPercent: PropTypes.number.isRequired,

        editMode: PropTypes.bool,
        onNsfwClick: PropTypes.func.isRequired,
        onPayoutChange: PropTypes.func.isRequired,
        onCurationPercentChange: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);

        this._onAwayClickListen = false;

        this.state = {
            showCoinMenu: false,
            showCuratorMenu: false,

            minCurationPercent: 0,
            maxCurationPercent: 0,
        };
    }

    componentWillUnmount() {
        this._unmount = true;

        if (this._onAwayClickListen) {
            window.removeEventListener('mousedown', this._onAwayClick);
        }
    }

    render() {
      const { showCoinMenu, showCuratorMenu, curatorPercent, minCurationPercent, maxCurationPercent } = this.state;


			//{isNil(minCurationPercent) || minCurationPercent === maxCurationPercent ? null : (

        return (
            <div className="PostOptions">
							{(
                <span className="PostOptions__item-wrapper">
                    <span
                        className={cn('PostOptions__item', {
                            PostOptions__item_active: showCuratorMenu,
                        })}
                        onClick={this._onCuratorClick}
                    >
                        <Icon
                            name="editor/k"
                            size="1_5x"
                            data-tooltip={tt('post_editor.payout_hint')}
                        />
                    </span>
                    {showCuratorMenu ? this._renderCuratorMenu() : null}
                </span>
								)}

                <span className="PostOptions__item-wrapper">
                    <span
                        className={cn('PostOptions__item', {
                            PostOptions__item_active: showCoinMenu,
                        })}
                        onClick={this._onCoinClick}
                    >
                        <Icon
                            name="editor/coin"
                            size="1_5x"
                            data-tooltip={tt('post_editor.payout_hint')}
                        />
                    </span>
                    {showCoinMenu ? this._renderCoinMenu() : null}
                </span>
                <span
                    className={cn('PostOptions__item', {
                        PostOptions__item_warning: this.props.nsfw,
                    })}
                    onClick={this.props.onNsfwClick}
                >
                    <Icon
                        name="editor/plus-18"
                        size="1_5x"
                        data-tooltip={tt('post_editor.nsfw_hint')}
                    />
                </span>
            </div>
        );
    }

  _renderCuratorMenu() {
        let { editMode, curationPercent } = this.props;
        let { minCurationPercent, maxCurationPercent } = this.state;

        let min;
        let max;
        let percent;
        let showCaptions;

        if (editMode) {
            min = 0;
            max = 100;
            percent = curationPercent / 100;
            showCaptions = false;
        } else {
            const actualPercent = Math.round(curationPercent / 100);

            min = Math.ceil(minCurationPercent / 100);
            max = Math.floor(maxCurationPercent / 100);
            percent = Math.max(Math.min(actualPercent, max), min);
            showCaptions = true;
        }

         return (
            <Hint align="center" innerRef={this._onBubbleRef}>
                <CuratorText>
                    {tt('post_editor.set_curator_percent')}{' '}
                    <CuratorValue>{percent}%</CuratorValue>
                </CuratorText>
            <SliderStyled
                    value={percent}
                    min={min}
                    max={max}
                    disabled={editMode}
                    showCaptions
                    onChange={this.onCurationPercentChange}
                />
            </Hint>
        );
    }

    _renderCoinMenu() {
        const { editMode, payoutType } = this.props;

        return (
            <Hint align="center" innerRef={this._onBubbleRef}>
                <div className="PostOptions__bubble-text">
                    {tt('post_editor.set_payout_type')}:
                </div>
                <RadioGroup
                    disabled={editMode}
                    options={PAYOUT_OPTIONS.map(({ id, title, hint }) => ({
                        id,
                        title: tt(title),
                        hint: hint ? tt(hint) : null,
                    }))}
                    value={payoutType}
                    onChange={this._onCoinModeChange}
                />
            </Hint>
        );
    }

    _onCoinClick = () => {
        this.setState(
            {
                showCoinMenu: !this.state.showCoinMenu,
            },
            () => {
                const { showCoinMenu } = this.state;

                if (showCoinMenu && !this._onAwayClickListen) {
                    window.addEventListener('mousedown', this._onAwayClick);
                    this._onAwayClickListen = true;
                }
            }
        );
    };

    _onCuratorClick = () => {
        this.setState(
            {
                showCuratorMenu: !this.state.showCuratorMenu,
            },
            () => {
                const { showCuratorMenu } = this.state;

                if (showCuratorMenu && !this._onAwayClickListen) {
                    window.addEventListener('mousedown', this._onAwayClick);
                    this._onAwayClickListen = true;
                }
            }
        );
    };

    _onCoinModeChange = coinMode => {
        this.props.onPayoutChange(coinMode);
    };

    onCurationPercentChange = percent => {
        this.props.onCurationPercentChange(Math.round(percent * 100));
    };

    _onAwayClick = e => {
        if (this._bubble && !this._bubble.contains(e.target)) {
            setTimeout(() => {
                if (!this._unmount) {
                    this.setState({
                        showCoinMenu: false,
                        showCuratorMenu: false,
                    });
                }
            }, 50);
        }
    };

    _onBubbleRef = el => {
        this._bubble = el;
    };

    componentDidMount() {
      // FIXME Dirty hack
      // retry api call
      api.getChainPropertiesAsync().then(r => {
        this.setState({
          minCurationPercent: r.min_curation_percent,
          maxCurationPercent: r.max_curation_percent
        }, () => {
            this.props.onCurationPercentChange(r.min_curation_percent);
        });
      }).catch(e => {
        api.getChainPropertiesAsync().then(r => {
          this.setState({
            minCurationPercent: r.min_curation_percent,
            maxCurationPercent: r.max_curation_percent
          }, () => {
            this.props.onCurationPercentChange(r.min_curation_percent);
          });
        }).catch(e => {
          this.setState({
            minCurationPercent: 5000,
            maxCurationPercent: 9000
          })
        })
      })
    };
}

export default PostOptions;
