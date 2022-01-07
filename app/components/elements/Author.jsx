/* eslint react/prop-types: 0 */
import React from 'react';
import PropTypes from 'prop-types'
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate'
import { LinkWithDropdown } from 'react-foundation-components/lib/global/dropdown'
import Follow from 'app/components/elements/Follow';
import Icon from 'app/components/elements/Icon';
import { Link } from 'react-router';
import {authorNameAndRep} from 'app/utils/ComponentFormatters';
import { getGameLevel } from 'app/utils/GameUtils'
import Reputation from 'app/components/elements/Reputation';
import Userpic from 'app/components/elements/Userpic';
import tt from 'counterpart';
import normalizeProfile from 'app/utils/NormalizeProfile';

const {string, bool, number} = PropTypes;

class Author extends React.Component {
    static propTypes = {
        author: string.isRequired,
        follow: bool,
        mute: bool,
        authorRepLog10: number,
        donateUrl: string,
    };
    static defaultProps = {
        follow: true,
        mute: true,
    };

    constructor() {
        super();
        this.showProfileCtrl = this.showProfileCtrl.bind(this);
    }

    componentDidMount() {
        const element = document.querySelector('.FoundationDropdownMenu__label');
        if (element) element.addEventListener("click", this.showProfileCtrl, false);
    }

    componentWillUnmount() {
        const element = document.querySelector('.FoundationDropdownMenu__label');
        if (element) element.removeEventListener("click", this.showProfileCtrl, false);
    }

    showProfileCtrl(e) {
        if (e.metaKey || e.ctrlKey) { // handle edge case for ctrl clicks
            e.stopPropagation();
            window.location = '/@' + this.props.author;
        } else { // show default author preview
        }
    }

    shouldComponentUpdate = shouldComponentUpdate(this, 'Author');
    render() {
        const {author, follow, mute, authorRepLog10, donateUrl} = this.props; // html
        const {username} = this.props; // redux

        let level = null
        const { levelUrl } = getGameLevel(this.props.account, this.props.gprops, true)
        if (levelUrl) {
            level = (<img src={levelUrl} style={{ height: '24px', marginRight: '2px' }} />)
        }

        const author_link = <span className="author" itemProp="author" itemScope itemType="http://schema.org/Person">
            <Link to={'/@' + author}><strong>{author}</strong></Link>
            {!(follow || mute) ? <Reputation value={authorRepLog10} /> : level}
        </span>;

        if(!(follow || mute) || username === author)
            return author_link;

        const {name, about} = this.props.account ? normalizeProfile(this.props.account.toJS()) : {};

        const dropdown = <div className="Author__dropdown">
            <Link to={'/@' + author}>
                <Userpic account={author} width="75" height="75" />
            </Link>
            <Link to={'/@' + author} className="Author__name">
                {name}
            </Link>
            <Link to={'/@' + author} className="Author__username">
                @{author}
            </Link>
            <div>
                <Follow className="float-right" follower={username} following={author} what="blog"
                        showFollow={follow} showMute={mute} donateUrl={donateUrl}
                        />
            </div>

            <div className="Author__bio">
                {about}
            </div>
        </div>;

        return (
            <span className="Author">
                <LinkWithDropdown
                    closeOnClickOutside
                    dropdownPosition="bottom"
                    dropdownAlignment="left"
                    dropdownContent={dropdown}
                >
                    <span className="FoundationDropdownMenu__label">
                        <span itemProp="author" itemScope itemType="http://schema.org/Person">
                            <strong>{author}</strong>
                        </span>
                        <Icon name="dropdown-arrow" />
                    </span>
                </LinkWithDropdown>
                {level}
                <a href={`/msgs/@${author}`} target='_blank' title={tt('g.write_message_long')} className='Author__write'>
                    <Icon name="new/envelope" />
                </a>
            </span>
        )
    }
}

import {connect} from 'react-redux'
export default connect(
    (state, ownProps) => {
        const {author, follow, mute, authorRepLog10} = ownProps;
        const username = state.user.getIn(['current', 'username']);
        const account = state.global.getIn(['accounts', author]);
        const gprops = state.global.get('props')
        return {
            author, follow, mute, authorRepLog10,
            username,
            account,
            gprops,
        }
    },
)(Author)
