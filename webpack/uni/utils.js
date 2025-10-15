import webpack from 'webpack';

export const fixConfigForServer = (cfg) => {
  cfg.target = 'node';

  cfg.plugins = cfg.plugins.map(plugin => {
      if (plugin instanceof webpack.DefinePlugin) {
          console.log('Fixing for server: DefinePlugin');
          const newDef = { ...plugin.definitions };
          delete newDef['process.env'];
          return new webpack.DefinePlugin(newDef);
      } else if (plugin instanceof webpack.ProvidePlugin) {
          console.log('Fixing for server: ProvidePlugin');
          const newDef = { ...plugin.definitions };
          delete newDef['process'];
          delete newDef['Buffer'];
          return new webpack.ProvidePlugin(newDef);
      }
      return plugin;
  });
};