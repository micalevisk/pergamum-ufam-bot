const actions = require('require.all')({
  dir: '.',
  recursive: false,
  not: /^index\.js$/,
});

module.exports = actions;
