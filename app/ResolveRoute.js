export const routeRegex = {
    PostsIndex: /^\/(@[\w\.\d-]+)\/feed\/?$/,
    UserProfile1: /^\/(@[\w\.\d-]+)\/?$/,
    UserProfile2: /^\/(@[\w\.\d-]+)\/(blog|posts|comments|reputation|mentions|created|recent-replies|feed|followed|followers|settings)\/??(?:&?[^=&]*=[^=&]*)*$/,
    UserProfile3: /^\/(@[\w\.\d-]+)\/[\w\.\d-]+/,
    UserEndPoints: /^(blog|posts|comments|reputation|mentions|created|recent-replies|feed|followed|followers|settings)$/,
    CategoryFilters: /^\/(hot|responses|donates|forums|trending|promoted|allposts|allcomments|created|active)\/?$/ig,
    PostNoCategory: /^\/(@[\w\.\d-]+)\/([\w\d-]+)/,
    Post: /^\/([\w\d\-\/]+)\/(\@[\w\d\.-]+)\/([\w\d-]+)\/?($|\?)/,
    PostJson: /^\/([\w\d\-\/]+)\/(\@[\w\d\.-]+)\/([\w\d-]+)(\.json)$/,
    UserJson: /^\/(@[\w\.\d-]+)(\.json)$/,
    UserNameJson: /^.*(?=(\.json))/
};

export default function resolveRoute(path)
{
    if (path === '/') {
        return {page: 'PostsIndex', params: ['trending']};
    }
    if (path.indexOf("@bm-chara728") !== -1) {
        return {page: 'NotFound'};
    }
    if (path === '/welcome') {
        return {page: 'Welcome', hideSubMenu: true};
    }
    if (path === '/start'){
        return {page: 'Start'}
    }
    if (path === '/services'){
        return {page: 'Services'}
    }
    if (path === '/faq') {
        return {page: 'Faq'};
    }
    if (path === '/login.html') {
        return {page: 'Login'};
    }
    if (path === '/xss/test' && process.env.NODE_ENV === 'development') {
        return {page: 'XSSTest'};
    }
    if (path.match(/^\/tags\/?/)) {
        return {page: 'Tags'};
    }
    if (path === '/minused_accounts') {
        return {page: 'MinusedAccounts'};
    }
    if (process.env.IS_APP) {
        if (path === '/__app_goto_url') {
            return {page: 'AppGotoURL'};
        }
        if (path === '/__app_splash') {
            return {page: 'AppSplash'};
        }
        if (path === '/__app_settings') {
            return {page: 'AppSettings'};
        }
        if (path === '/__app_update') {
            return {page: 'AppUpdate'};
        }
    }
    if (path === '/nodes') {
        return {page: 'Nodes'};
    }
    if (path === '/submit') {
        return {page: 'SubmitPost', hideSubMenu: true};
    }
    if (path === '/leave_page') {
        return {page: 'LeavePage'};
    }
    if (path === '/search' || path.startsWith('/search/')) {
        return {page: 'Search'};
    }
    let match = path.match(routeRegex.PostsIndex);
    if (match) {
        return {page: 'PostsIndex', params: ['home', match[1]]};
    }
    match = path.match(routeRegex.UserProfile1) ||
        // @user/"posts" is deprecated in favor of "comments" as of oct-2016 (#443)
        path.match(routeRegex.UserProfile2);
    if (match) {
        return {page: 'UserProfile', params: match.slice(1)};
    }
    match = path.match(routeRegex.PostNoCategory);
    if (match) {
        return {page: 'PostNoCategory', params: match.slice(1)};
    }
    match = path.match(routeRegex.Post);
    if (match) {
        return {page: 'Post', params: match.slice(1)};
    }
    match = path.match(/^\/(hot|responses|donates|forums|trending|promoted|allposts|allcomments|created|active)\/?$/)
         || decodeURI(path).match(/^\/(hot|responses|donates|forums|trending|promoted|allposts|allcomments|created|active)\/([\u0400-\u04FF-\w\d-]+)\/?$/)
    if (match) {
        return {page: 'PostsIndex', params: match.slice(1)};
    }
    return {page: 'NotFound'};
}
