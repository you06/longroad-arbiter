const { DEFAULT_STORAGE_CLASS } = require('./const')

module.exports.getConfig = function(args) {
  return {
    workload: args.workload || '',
    namespace: args.namespace || '',
    storageClass: args['storage-class'] || DEFAULT_STORAGE_CLASS
  }
}
