const path = require('path')
const { exec, sleep, exists } = require('./util')
const { TEMP_DIR } = require('./const')

module.exports.deployTiDBCluster = async function({
  namespace: ns,
  storageClass
}) {
  const tempDir = path.join(__dirname, TEMP_DIR)
  const tidbChartsDir = path.join(__dirname, 'charts/tidb-cluster')
  const tidbTempDirChartsDir = path.join(tempDir, `${ns}-tidb-cluster`)

  await exec(`mkdir -p ${tidbTempDirChartsDir}`)
  await exec(`cp -r ${tidbChartsDir} ${tidbTempDirChartsDir}/tidb-cluster`)

  // replace namespace
  await exec(`sed -i 's/{namespace}/${ns}/g' ${path.join(tidbTempDirChartsDir, 'tidb-cluster/values.yaml')}`)
  // replace storage class
  await exec(`sed -i 's/{storage-class}/${storageClass}/g' ${path.join(tidbTempDirChartsDir, 'tidb-cluster/values.yaml')}`)

  // start TiDB cluster
  await exec(`helm install --namespace ${ns} --name ${ns}-upstream ${path.join(tidbTempDirChartsDir, 'tidb-cluster')}/`)
}
