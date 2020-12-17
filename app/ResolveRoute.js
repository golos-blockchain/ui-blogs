export const routeRegex = {
    PostsIndex: /^\/(@[\w\.\d-]+)\/feed\/?$/,
    UserProfile1: /^\/(@[\w\.\d-]+)\/?$/,
    UserProfile2: /^\/(@[\w\.\d-]+)\/(blog|posts|comments|recommended|transfers|assets|create-asset|invites|curation-rewards|author-rewards|donates-from|donates-to|permissions|created|recent-replies|feed|password|witness|followed|followers|settings)\/??(?:&?[^=&]*=[^=&]*)*$/,
    UserProfile3: /^\/(@[\w\.\d-]+)\/[\w\.\d-]+/,
    UserAssetEndPoints: /^\/(@[\w\.\d-]+)\/assets\/([\w\d.-]+)\/(update|transfer)$/,
    UserEndPoints: /^(blog|posts|comments|recommended|transfers|assets|create-asset|invites|curation-rewards|author-rewards|donates-from|donates-to|permissions|created|recent-replies|feed|password|witness|followed|followers|settings)$/,
    CategoryFilters: /^\/(hot|votes|responses|donates|trending|promoted|cashout|payout|payout_comments|created|active)\/?$/ig,
    PostNoCategory: /^\/(@[\w\.\d-]+)\/([\w\d-]+)/,
    Post: /^\/([\w\d\-\/]+)\/(\@[\w\d\.-]+)\/([\w\d-]+)\/?($|\?)/,
    WorkerSort: /^\/workers\/([\w\d\-]+)\/?($|\?)/,
    WorkerSearchByAuthor: /^\/workers\/([\w\d\-]+)\/(\@[\w\d.-]+)\/?($|\?)/,
    WorkerRequest: /^\/workers\/([\w\d\-]+)\/(\@[\w\d.-]+)\/([\w\d-]+)\/?($|\?)/,
    MarketPair: /^\/market\/([\w\d\.]+)\/([\w\d.]+)\/?($|\?)/,
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
    if (path === '/exchanges'){
        return {page: 'Exchanges'}
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
    if (path === '/change_password') {
        return {page: 'ChangePassword'};
    }
    if (path === '/create_account') {
        return {page: 'CreateAccount'};
    }
    if (path === '/recover_account_step_1') {
        return {page: 'RecoverAccountStep1'};
    }
    if (path === '/recover_account_step_2') {
        return {page: 'RecoverAccountStep2'};
    }
    if (path === '/market') {
        return {page: 'Market'};
    }
    let match = path.match(routeRegex.MarketPair);
    if (match) {
        return {page: 'Market', params: match.slice(1)};
    }
    if (path === '/~witnesses') {
        return {page: 'Witnesses'};
    }
    if (path === '/workers') {
        return {page: 'Workers'};
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
    match = path.match(routeRegex.WorkerRequest)
        || path.match(routeRegex.WorkerSearchByAuthor)
        || path.match(routeRegex.WorkerSort);
    if (match) {
        return {page: 'Workers', params: match.slice(1)};
    }
    match = path.match(routeRegex.PostsIndex);
    if (match) {
        return {page: 'PostsIndex', params: ['home', match[1]]};
    }
    match = path.match(routeRegex.UserAssetEndPoints);
    if (match) {
        return {page: 'UserProfile', params: [match[1], 'assets', match[2], match[3]]};
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
    match = path.match(/^\/(hot|votes|responses|donates|trending|promoted|cashout|payout|payout_comments|created|active)\/?$/)
         || decodeURI(path).match(/^\/(hot|votes|responses|donates|trending|promoted|cashout|payout|payout_comments|created|active)\/([\u0400-\u04FF-\w\d-]+)\/?$/)
    if (match) {
        return {page: 'PostsIndex', params: match.slice(1)};
    }
    return {page: 'NotFound'};
}
