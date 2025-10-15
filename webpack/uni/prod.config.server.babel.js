import { server } from 'universal-webpack/config'
import settings from './universal-webpack-settings'
import { fixConfigForServer } from './utils'
import configuration from '../prod.config'

const cfg = server(configuration, settings)

fixConfigForServer(cfg);

export default cfg;
