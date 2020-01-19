const path = require('path')
const { exec, sleep, exists } = require('./util')
const { TEMP_DIR } = require('./const')

module.exports.deployVeryLongroad = async function({
  namespace: ns,
  storageClass
}) {
  const tempDir = path.join(__dirname, TEMP_DIR)
  const longroadChartsDir = path.join(__dirname, 'charts/longroad-cluster')
  const longroadTempDirChartsDir = path.join(tempDir, `${ns}-longroad-cluster`)

  await exec(`mkdir -p ${longroadTempDirChartsDir}`)
  await exec(`cp -r ${longroadChartsDir} ${longroadTempDirChartsDir}/longroad-cluster`)

  // replace namespace
  await exec(`sed -i 's/{namespace}/${ns}/g' ${path.join(longroadTempDirChartsDir, 'longroad-cluster/upstream-values.yaml')}`)
  await exec(`sed -i 's/{namespace}/${ns}/g' ${path.join(longroadTempDirChartsDir, 'longroad-cluster/middlestream-values.yaml')}`)
  await exec(`sed -i 's/{namespace}/${ns}/g' ${path.join(longroadTempDirChartsDir, 'longroad-cluster/downstream-values.yaml')}`)
  // replace storage class
  await exec(`sed -i 's/{storage-class}/${storageClass}/g' ${path.join(longroadTempDirChartsDir, 'longroad-cluster/upstream-values.yaml')}`)
  await exec(`sed -i 's/{storage-class}/${storageClass}/g' ${path.join(longroadTempDirChartsDir, 'longroad-cluster/middlestream-values.yaml')}`)
  await exec(`sed -i 's/{storage-class}/${storageClass}/g' ${path.join(longroadTempDirChartsDir, 'longroad-cluster/downstream-values.yaml')}`)

  // start TiDB cluster
  await exec(`ln -sf ${path.join(longroadTempDirChartsDir, 'longroad-cluster/upstream-values.yaml')} ${path.join(longroadTempDirChartsDir, 'longroad-cluster/values.yaml')}`)
  await exec(`helm install --namespace ${ns} --name ${ns}-upstream ${path.join(longroadTempDirChartsDir, 'longroad-cluster')}/`)
  await exec(`ln -sf ${path.join(longroadTempDirChartsDir, 'longroad-cluster/middlestream-values.yaml')} ${path.join(longroadTempDirChartsDir, 'longroad-cluster/values.yaml')}`)
  await exec(`helm install --namespace ${ns} --name ${ns}-middlestream ${path.join(longroadTempDirChartsDir, 'longroad-cluster')}/`)
  await exec(`ln -sf ${path.join(longroadTempDirChartsDir, 'longroad-cluster/downstream-values.yaml')} ${path.join(longroadTempDirChartsDir, 'longroad-cluster/values.yaml')}`)
  await exec(`helm install --namespace ${ns} --name ${ns}-downstream ${path.join(longroadTempDirChartsDir, 'longroad-cluster')}/`)
}
