import remarkableStripper from 'app/utils/RemarkableStripper'
import links from 'app/utils/Links'
import sanitize from 'sanitize-html'
import {htmlDecode} from 'app/utils/Html'
import { getTags } from 'shared/HtmlReady'
import { Remarkable } from 'remarkable';
import { linkify } from 'remarkable/linkify';

const remarkable = new Remarkable({ html: true, }).use(linkify);

export default function extractContent(get, content) {
    const {
        author,
        permlink,
        parent_author,
        parent_permlink,
        json_metadata,
        category,
        title,
        created,
        active,
        net_rshares,
        children
    } = get(
        content,
        'author',
        'permlink',
        'parent_author',
        'parent_permlink',
        'json_metadata',
        'category',
        'title',
        'created',
        'active',
        'net_rshares',
        'children'
    );
    const author_link = '/@' + get(content, 'author');
    let link = `/@${author}/${permlink}`;
    if (category) link = `/${category}${link}`;
    const body = get(content, 'body');
    let jsonMetadata = {}
    let image_link
    try {
        jsonMetadata = JSON.parse(json_metadata)
        if(typeof jsonMetadata == 'string') {
            // At least one case where jsonMetadata was double-encoded: #895
            jsonMetadata = JSON.parse(jsonMetadata)
        }
        // First, attempt to find an image url in the json metadata
        if(jsonMetadata) {
            if(jsonMetadata.image && Array.isArray(jsonMetadata.image)) {
                [image_link] = jsonMetadata.image
            }
        }
    } catch(error) {
        // console.error('Invalid json metadata string', json_metadata, 'in post', author, permlink);
    }

    // If nothing found in json metadata, parse body and check images/links
    if(!image_link) {
        let rtags
        {
            const isHtml = /^<html>([\S\s]*)<\/html>$/.test(body)
            const htmlText = isHtml ? body : remarkable.render(body.replace(/<!--([\s\S]+?)(-->|$)/g, '(html comment removed: $1)'))
            rtags = getTags(htmlText);
        }

        [image_link] = Array.from(rtags.images)
    }

    // Fixing &amp; if present in URL (some alternative UIs?)
    // TODO: move to imageproxy
    if (image_link) {
        image_link = image_link.split('&amp;').join('&');
    }

    let desc
    let desc_complete = false
    if(!desc) {
        // Short description.
        // Remove bold and header, etc.
        // Stripping removes links with titles (so we got the links above)..
        // Remove block quotes if detected comment preview
        const body2 = remarkableStripper.render(get(content, 'depth') > 1 ? body.replace(/>([\s\S]*?).*\s*/g,'') : body);
        desc = sanitize(body2, {allowedTags: []})// remove all html, leaving text
        desc = htmlDecode(desc)

        // Strip any raw URLs from preview text
        desc = desc.replace(/https?:\/\/[^\s]+/g, '');

        // Grab only the first line (not working as expected. does rendering/sanitizing strip newlines?)
        desc = desc.trim().split("\n")[0];

        if(desc.length > 140) {
          desc = desc.substring(0, 140).trim();

          const dotSpace = desc.lastIndexOf('. ')
          if(dotSpace > 80 && !get(content, 'depth') > 1) {
              desc = desc.substring(0, dotSpace + 1)
          } else {
            // Truncate, remove the last (likely partial) word (along with random punctuation), and add ellipses
            desc = desc.substring(0, 120).trim().replace(/[,!\?]?\s+[^\s]+$/, "…");
          }
        }
        desc_complete = body2 === desc // is the entire body in desc?
    }
    const pending_payout = get(content, 'pending_payout_value');
    return {
        author,
        author_link,
        permlink,
        parent_author,
        parent_permlink,
        json_metadata: jsonMetadata,
        category,
        title,
        created,
        active,
        net_rshares,
        children,
        link,
        image_link,
        desc,
        desc_complete,
        body,
        pending_payout,
    };
}
