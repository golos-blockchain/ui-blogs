import { createBrowserRouter } from 'react-router-dom'
import RootRoute from 'app/RootRoute'

let router
if (process.env.BROWSER) {
    console.log('creating', RootRoute)
    router = createBrowserRouter(RootRoute)
}

export default router
