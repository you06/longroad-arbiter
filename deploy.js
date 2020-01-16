const { getConfig } = require('./config')
const { deployArbiterLongroad } = require('./arbiter')

main()

async function main() {
  await deployArbiterLongroad(getConfig(parseArgs()))
}

function parseArgs() {
  const args = {}
  let key = ''
  for (const item of process.argv) {
    if (key !== '') {
      args[key] = item
      key = ''
      continue
    }
    if (item.startsWith('-')) {
      key = item.slice(1)
    }
  }
  return args
}
