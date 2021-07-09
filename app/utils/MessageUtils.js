import truncate from 'lodash/truncate';

export function displayQuoteMsg(body) {
    body = truncate(body, { length: 50, omission: '...', });
    return body.split('\n').join(' ');
}
