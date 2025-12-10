module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Mock localStorage globally to prevent build errors
      webpackConfig.plugins.unshift({
        apply: (compiler) => {
          compiler.hooks.beforeCompile.tap('MockLocalStorage', () => {
            global.localStorage = {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
              clear: () => {}
            };
          });
        }
      });
      return webpackConfig;
    }
  }
};