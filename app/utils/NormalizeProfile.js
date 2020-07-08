import linksRe from 'app/utils/Links';

export function getPinnedPosts(account, links=false) {
  let pinnedPosts = [];

  try {
      let json = account.json_metadata
      pinnedPosts = (json && JSON.parse(json).pinnedPosts) || [];
      if(typeof tags == 'string') {
          pinnedPosts = [pinnedPosts];
      } if(!Array.isArray(pinnedPosts)) {
          pinnedPosts = [];
      }
  } catch(e) {
      pinnedPosts = []
  }

  if (!links)
    pinnedPosts = pinnedPosts.map(p => {
      let [author, permlink] = p.split('/')
      return {author, permlink, reblog_on: '1970-01-01T00:00:00'}
    })

  return pinnedPosts
}

export function getMutedInNew(account) {
  let mutedInNew = [];

  try {
      let json = account.json_metadata
      mutedInNew = (json && JSON.parse(json).mutedInNew) || [];
      if(!Array.isArray(mutedInNew)) {
          mutedInNew = [];
      }
  } catch(e) {
      mutedInNew = []
  }

  return mutedInNew
}

function truncate(str, len) {
    if (str) {
        str = str.trim();
        if (str.length > len) {
            str = str.substring(0, len - 1) + '...';
        }
    }
    return str;
}

/**
 * Enforce profile data length & format standards.
 */
export default function normalizeProfile(account) {
    if (!account) return {};

    // Parse
    let profile = {};
    if (account.json_metadata) {
        let metadata = account.json_metadata;
        // https://github.com/GolosChain/tolstoy/issues/450
        if (metadata.localeCompare("{created_at: 'GENESIS'}") == 0) {
            metadata = '{"created_at": "GENESIS"}';
            profile = {};
        }
        try {
            const md = JSON.parse(metadata);
            if (md.profile) {
                profile = md.profile;
            }
            if (typeof profile !== 'object') {
                console.error(
                    'Expecting object in account.json_metadata.profile:',
                    profile
                );
                profile = {};
            }
        } catch (e) {
            console.error(
                `Invalid json metadata string ${metadata} in account ${account.name}`
            );
        }
    }

    // Read & normalize
    let {
        name,
        gender,
        about,
        location,
        website,
        profile_image,
        cover_image,
    } = profile;

    name = truncate(name, 20);
    gender = truncate(gender, 20);
    about = truncate(about, 160);
    location = truncate(location, 30);

    if (/^@/.test(name)) name = null;
    if (/^@/.test(gender)) gender = null;
    if (website && website.length > 100) website = null;
    if (website && website.indexOf('http') === -1) {
        website = 'http://' + website;
    }
    if (website) {
        // enforce that the url regex matches, and fully
        const m = website.match(linksRe.any);
        if (!m || m[0] !== website) {
            website = null;
        }
    }

    if (profile_image && !/^https?:\/\//.test(profile_image))
        profile_image = null;
    if (cover_image && !/^https?:\/\//.test(cover_image)) cover_image = null;

    return {
        name,
        gender,
        about,
        location,
        website,
        profile_image,
        cover_image,
    };
}
