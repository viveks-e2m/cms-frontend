module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Temporarily disable CSS minification to fix build issue
      webpackConfig.optimization.minimizer = webpackConfig.optimization.minimizer.filter(
        (plugin) => plugin.constructor.name !== 'CssMinimizerPlugin'
      );

      return webpackConfig;
    },
  },
};