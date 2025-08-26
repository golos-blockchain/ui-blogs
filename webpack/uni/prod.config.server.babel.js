import { server } from 'universal-webpack/config'
import settings from './universal-webpack-settings'
import configuration from '../prod.config'

export default server(configuration, settings)
