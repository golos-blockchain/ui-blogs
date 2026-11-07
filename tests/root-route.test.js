'use strict';
// Uses installed production React/path-to-regexp and real Babel transforms.
// In an offline checkout, NODE_PATH may point at a validated build's node_modules.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');
const React = require('react');
const root = path.resolve(__dirname, '..');

function compile(relative, dependencies) {
    const filename = path.join(root, relative);
    const { code } = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
        filename, babelrc: false, configFile: false,
        presets: [[require.resolve('@babel/preset-env'), { targets: { node: 'current' } }],
            [require.resolve('@babel/preset-react'), { runtime: 'classic' }]],
    });
    const module = { exports: {} };
    vm.runInNewContext(code, {
        module, exports: module.exports, console,
        process: { env: { IS_APP: '1', NODE_ENV: 'test' } },
        require: name => Object.hasOwn(dependencies, name) ? dependencies[name] : require(name),
    }, { filename });
    return module.exports;
}

// Only leaf views are fixtures: their route declarations come from actual source ASTs.
// No matcher, routing function, Babel helper or React implementation is substituted.
function view(relative, name) {
    const ast = babel.parseSync(fs.readFileSync(path.join(root, relative), 'utf8'), {
        babelrc: false, configFile: false,
        parserOpts: { sourceType: 'unambiguous', plugins: ['jsx', 'classProperties'] },
    });
    const declaration = ast.program.body.find(node => node.type === 'ExpressionStatement' &&
        node.expression.type === 'AssignmentExpression' &&
        node.expression.left.type === 'MemberExpression' &&
        node.expression.left.object.name === 'module' &&
        node.expression.left.property.name === 'exports' &&
        node.expression.right.type === 'ObjectExpression');
    assert.ok(declaration, `${relative}: module.exports route declaration`);
    const routePath = declaration.expression.right.properties.find(p => p.key.name === 'path').value.value;
    return { path: routePath, component: { [name]: function() {} }[name] };
}
const PostsIndex = view('app/components/pages/PostsIndex.jsx', 'PostsIndex');
const NotFound = view('app/components/pages/NotFound.jsx', 'NotFound');
const AppSettings = view('app/components/pages/app/AppSettings.jsx', 'AppSettings');
const resolveRoute = compile('app/ResolveRoute.js', {}).default;
function render(location) {
    const navigate = () => {};
    const searchParams = new URLSearchParams(location.search);
    const routes = compile('app/RootRoute.js', {
        react: React,
        'react-router-dom': {
            useLocation: () => location, useNavigate: () => navigate,
            useSearchParams: () => [searchParams, () => {}],
        },
        'app/components/App': function App() {},
        '@pages/PostsIndex': PostsIndex,
        './ResolveRoute': { default: resolveRoute, __esModule: true },
        '@pages/NotFound': NotFound,
        '@pages/app/AppSettings': AppSettings,
    }).default;
    const element = routes[0].children[0].Component();
    assert.ok(React.isValidElement(element));
    return { element, navigate, searchParams };
}
// Integration boundary: actual source route objects, real provider and Outlet.
function renderThroughProvider(url) {
    const routerDom = require('react-router-dom');
    const server = require('react-dom/server');
    const seen = [];
    const leaf = (declaration, name) => ({ ...declaration, component: props => {
        seen.push({ name, props });
        return React.createElement('article', { 'data-page': name }, name);
    } });
    const routes = compile('app/RootRoute.js', {
        react: React,
        'react-router-dom': routerDom,
        'app/components/App': () => React.createElement('main', null,
            'HEADER', React.createElement(require('react-router').Outlet), 'FOOTER'),
        '@pages/PostsIndex': leaf(PostsIndex, 'PostsIndex'),
        './ResolveRoute': { default: resolveRoute, __esModule: true },
        '@pages/NotFound': leaf(NotFound, 'NotFound'),
        '@pages/app/AppSettings': leaf(AppSettings, 'AppSettings'),
    }).default;
    const router = routerDom.createMemoryRouter(routes, { initialEntries: [url] });
    try {
        const html = server.renderToString(React.createElement(routerDom.RouterProvider, { router }));
        return { html, seen };
    } finally { router.dispose(); }
}

test('real source root route mounts its feed through RouterProvider and Outlet', () => {
    const { html, seen } = renderThroughProvider('/');
    assert.ok(html.includes('data-page="PostsIndex"'), 'NO_RENDERED_FEED_SUBTREE at /');
    assert.equal(seen.length, 1);
    assert.equal(seen[0].props.routeParams.order, 'trending');
});

test('real provider preserves root query/hash and explicit trending route', () => {
    for (const url of ['/?tag=one#keep', '/trending?tag=one#keep']) {
        const { html, seen } = renderThroughProvider(url);
        assert.ok(html.includes('data-page="PostsIndex"'), url);
        assert.equal(seen[0].props.routeParams.order, 'trending');
        assert.equal(seen[0].props.location.search, '?tag=one');
        assert.equal(seen[0].props.location.hash, '#keep');
        assert.equal(seen[0].props.searchParams.get('tag'), 'one');
    }
});

test('real provider retains settings and unknown-route controls', () => {
    for (const [url, name] of [['/__app_settings', 'AppSettings'], ['/unknown-route', 'NotFound']]) {
        const { html, seen } = renderThroughProvider(url);
        assert.ok(html.includes(`data-page="${name}"`), url);
        assert.equal(seen.length, 1);
    }
});

function location(pathname, search = '', hash = '') {
    return { pathname, search, hash, state: { preserved: true }, key: 'route-key' };
}

test('root resolves and renders the feed with trending order, preserving location/query/hash', () => {
    assert.equal(resolveRoute('/').page, 'PostsIndex');
    const input = location('/', '?sort=keep&tag=one', '#keep');
    const { element, navigate, searchParams } = render(input);
    assert.equal(element.type, PostsIndex.component, `actual rendered leaf: ${element.type.name}`);
    assert.equal(element.props.routeParams.order, 'trending');
    assert.deepEqual(Object.keys(element.props.routeParams), ['order']);
    assert.equal(element.props.location, input);
    assert.equal(element.props.navigate, navigate);
    assert.equal(element.props.searchParams, searchParams);
    assert.equal(searchParams.get('tag'), 'one');
});

test('explicit feed orders and category parameters are unchanged', () => {
    for (const [pathname, expected] of [
        ['/trending', { order: 'trending' }],
        ['/created/category', { order: 'created', category: 'category' }],
    ]) {
        const { element } = render(location(pathname));
        assert.equal(element.type, PostsIndex.component);
        assert.deepEqual({ ...element.props.routeParams }, expected);
    }
});

test('app settings and unknown/settings fallback remain unchanged', () => {
    const settings = render(location('/__app_settings')).element;
    assert.equal(settings.type, AppSettings.component);
    assert.deepEqual({ ...settings.props.routeParams }, {});
    for (const pathname of ['/settings', '/unknown-route', '/trending/one/two']) {
        assert.equal(resolveRoute(pathname).page, 'NotFound');
        const { element } = render(location(pathname));
        assert.equal(element.type, NotFound.component);
        assert.deepEqual({ ...element.props.routeParams }, {});
    }
});
