module.exports = function (api) {
    api.cache(true);
    return {
      presets: ["babel-preset-expo"],
      plugins: [
        [
          "@babel/plugin-transform-runtime",
          {
            regenerator: true,
            helpers: true,
          },
        ],
        ['react-native-reanimated/plugin'],
      ],
    };
  };