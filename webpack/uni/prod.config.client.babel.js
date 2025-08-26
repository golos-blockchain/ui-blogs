import { client } from 'universal-webpack/config'
import settings from './universal-webpack-settings'
import configuration from '../prod.config'

const conf = client(configuration, settings)
export default conf
