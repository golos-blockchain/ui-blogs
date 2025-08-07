import { client } from 'universal-webpack/config'
import settings from './universal-webpack-settings.json' with { type: "json" };
import configuration from './dev.config.js'

export default client(configuration, settings)
