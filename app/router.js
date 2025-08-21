import { createBrowserRouter } from 'react-router-dom'
import RootRoute from 'app/RootRoute'

let router
if (process.env.BROWSER) {
    router = createBrowserRouter(RootRoute)
}

export default router
