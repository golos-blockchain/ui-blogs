import { server } from 'universal-webpack/config'
import webpack from 'webpack';

import settings from './universal-webpack-settings'
import { fixConfigForServer } from './utils'
import configuration from '../dev.config'

const cfg = server(configuration, settings)

fixConfigForServer(cfg);

export default cfg;
