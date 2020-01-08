const { deployArbiterLongroad } = require('./arbiter')

main()

async function main() {
  const {
    namespace
  } = parseArgs()
  await deployArbiterLongroad(namespace)
}

function parseArgs() {
  const args = {}
  let key = ''
  for (const item of process.argv) {
    if (key !== '') {
      args[key] = item
      continue
    }
    if (item.startsWith('-')) {
      key = item.slice(1)
    }
  }
  return args
}
