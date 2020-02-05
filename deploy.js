const { getConfig } = require('./config')
const { deployTiDBCluster } = require('./tidb-cluster')
const { deployVeryLongroad } = require('./longroad-cluster')
const { deployArbiterLongroad } = require('./arbiter')

main()

async function main() {
  const cfg = getConfig(parseArgs())
  if (cfg.namespace === '') {
    console.log('empty namespace')
    return
  }
  switch (cfg.workload) {
    case 'tidb-cluster':
      await deployTiDBCluster(cfg)
      break
    case 'longroad-cluster':
      await deployVeryLongroad(cfg)
      break
    case 'arbiter':
      await deployArbiterLongroad(cfg)
      break
    default:
      console.log('Unsupported workload')
  }
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
