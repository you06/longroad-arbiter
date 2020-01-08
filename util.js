const util = require('util')
const exec = util.promisify(require('child_process').exec)
const exists = util.promisify(require('fs').exists)

DRYRUN = false

module.exports.exec = async function(command) {
  if (DRYRUN) {
    console.log("[DRYRUN]", command)
    return {
      stdout: '',
      stderr: ''
    }
  } else {
    return await exec(command)
  }
}

module.exports.sleep = async function(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

module.exports.exists = async function(path) {
  return await exists(path)
}
