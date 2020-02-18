// Attempt to fix node-notifier icon
// https://github.com/mikaelbr/node-notifier#within-electron-packaging

module.exports = function(context) {
  context.node = {
    __filename: true,
    __dirname: true
  }
  return context;
};
