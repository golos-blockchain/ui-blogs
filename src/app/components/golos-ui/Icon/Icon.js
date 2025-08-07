import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const icons = new Map();
const files = require.context('./assets', true, /.*\.svg$/);
files.keys().forEach(f => {
    const name = f.replace(/^\.\/(.*)\.svg$/, '$1');
    icons.set(name, files(f));
})

const Icon = ({ name, size, height, width, ...props }) => {
    if (!props) props = {};
    height = size || height;
    width = size || width;

    let html = icons.get(name) || '';
    let sizes = '';
    if (height) {
        sizes += ' height="' + height + '" ';
    }
    if (width) {
        sizes += ' width="' + width + '" ';
    }
    html = html.replace('<svg ', '<svg ' + sizes);

    return (
        <span { ...props } dangerouslySetInnerHTML={{ __html: html }}>
        </span>
    );
};

Icon.propTypes = {
    name: PropTypes.string,
    size: PropTypes.string,
    height: PropTypes.string,
    width: PropTypes.string,
}

Icon.defaultProps = {
    height: '24px',
    width: '24px',
}

const StyledIcon = styled(Icon)`
    svg {
        vertical-align: middle;
    }
`;

export default StyledIcon;
