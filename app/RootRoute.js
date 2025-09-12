import React from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
const { match } = require("path-to-regexp");

import App from 'app/components/App';
import PostsIndex from '@pages/PostsIndex';
import resolveRoute from './ResolveRoute';

const renderPage = (rouProps, Page) => {
    const { location, navigate, searchParams } = rouProps;
    let params = {}
    if (Page.path) {
        const { path } = Page;
        if (path === '*') {
            params = {}
        } else {
            let matcher
            try {
                matcher = match(Page.path)
            } catch (err) {
                console.error('Cannot build matcher', Page.path)
                throw err
            }
            const result = matcher(location.pathname)
            if (!result) {
                return renderPage(rouProps, require('@pages/NotFound'))
            }
            params = result.params
        }
    }
    if (Page.component) {
        Page = Page.component
    }
    return <Page routeParams={params} location={location} navigate={navigate} searchParams={searchParams} />
};

export default [{
    path: '/',
    element: <App />,
    children: [{
        path: '*',
        Component: () => {
            const location = useLocation();
            const navigate = useNavigate();
            const [ searchParams, setSearchParams ] = useSearchParams();
            const rouProps = { location, navigate, searchParams, setSearchParams };

            const route = resolveRoute(location.pathname);
            if (route.page === 'Welcome') {
                const Page = process.env.BROWSER
                            ? require('@pages/WelcomeLoader').default
                            : require('@pages/Welcome').default
                return renderPage(rouProps, Page)
            } else if (route.page === 'Start') {
                return renderPage(rouProps, require('@pages/Start'))
            } else if (route.page === 'Services') {
                return renderPage(rouProps, require('@pages/Services'))
            } else if (route.page === 'Faq') {
                return renderPage(rouProps, process.env.BROWSER
                    ? require('@pages/FaqLoader').default
                    : require('@pages/Faq').default,
                )
            } else if (route.page === 'Login') {
                return renderPage(rouProps, require('@pages/Login'))
            } else if (
                route.page === 'XSSTest' &&
                process.env.NODE_ENV === 'development'
            ) {
                return renderPage(rouProps, require('@pages/XSS'))
            } else if (route.page === 'Tags') {
                return renderPage(rouProps, require('@pages/TagsIndex'))
            } else if (route.page === 'MinusedAccounts') {
                return renderPage(rouProps, require('@pages/MinusedAccounts'))
            } else if (route.page === 'Referrers') {
                return renderPage(rouProps, require('@pages/Referrers'))
            } else if (route.page === 'AppGotoURL') {
                return renderPage(rouProps, require('@pages/app/AppGotoURL'))
            } else if (route.page === 'AppSplash') {
                return renderPage(rouProps, require('@pages/app/AppSplash'))
            } else if (route.page === 'AppSettings') {
                return renderPage(rouProps, require('@pages/app/AppSettings'))
            } else if (route.page === 'AppUpdate') {
                return renderPage(rouProps, require('@pages/app/AppUpdate'))
            } else if (route.page === 'LeavePage') {
                return renderPage(rouProps, require('@pages/LeavePage'))
            } else if (route.page === 'Search') {
                return renderPage(rouProps, require('@pages/Search'))
            } else if (route.page === 'SubmitPost') {
                if (process.env.BROWSER)
                    return renderPage(rouProps, require('@pages/SubmitPost'))
                else
                    return renderPage(rouProps, require('@pages/SubmitPostServerRender'))
            } else if (route.page === 'UserProfile') {
                return renderPage(rouProps, require('@pages/UserProfile'))
            } else if (route.page === 'Post') {
                return renderPage(rouProps, require('@pages/PostPage'))
            } else if (route.page === 'PostNoCategory') {
                return renderPage(rouProps, require('@pages/PostPageNoCategory'))
            } else if (route.page === 'PostsIndex') {
                return renderPage(rouProps, PostsIndex)
            } else {
                // TODO: process.env.BROWSER ? null : Error(404)
                return renderPage(rouProps, require('@pages/NotFound'))
            }
        }
    }]
}];