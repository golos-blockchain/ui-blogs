import { client } from 'universal-webpack/config'
import settings from './universal-webpack-settings'
import configuration from './dev.config'

export default client(configuration, settings)
