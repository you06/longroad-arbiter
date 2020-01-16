const path = require('path')
const { exec, sleep, exists } = require('./util')
const { TEMP_DIR } = require('./const')

module.exports.deployArbiterLongroad = async function({
  namespace: ns,
  storageClass
}) {
  const tempDir = path.join(__dirname, TEMP_DIR)
  const arbiterChartsDir = path.join(__dirname, 'charts/arbiter')
  const arbiterTempDirChartsDir = path.join(tempDir, `${ns}-arbiter`)

  // prepare work dir
  if (!await exists(tempDir)) {
    await exec(`mkdir ${tempDir}`)
  }
  await exec(`cp -r ${arbiterChartsDir} ${arbiterTempDirChartsDir}`)

  // replace namespace
  await exec(`sed -i 's/{namespace}/${ns}/g' ${path.join(arbiterTempDirChartsDir, 'tidb-cluster/source-values.yaml')}`)
  await exec(`sed -i 's/{namespace}/${ns}/g' ${path.join(arbiterTempDirChartsDir, 'tidb-cluster/target-values.yaml')}`)
  await exec(`sed -i 's/{namespace}/${ns}/g' ${path.join(arbiterTempDirChartsDir, 'arbiter/values.yaml')}`)
  // replace storage class
  await exec(`sed -i 's/{storage-class}/${storageClass}/g' ${path.join(arbiterTempDirChartsDir, 'kafka/values.yaml')}`)
  await exec(`sed -i 's/{storage-class}/${storageClass}/g' ${path.join(arbiterTempDirChartsDir, 'arbiter/values.yaml')}`)
  await exec(`sed -i 's/{storage-class}/${storageClass}/g' ${path.join(arbiterTempDirChartsDir, 'tidb-cluster/source-values.yaml')}`)
  await exec(`sed -i 's/{storage-class}/${storageClass}/g' ${path.join(arbiterTempDirChartsDir, 'tidb-cluster/target-values.yaml')}`)

  // start kafka
  await exec(`helm install --namespace ${ns} --name ${ns}-kafka ${path.join(arbiterTempDirChartsDir, 'kafka')}/`)
  // start TiDB cluster
  await exec(`ln -sf ${path.join(arbiterTempDirChartsDir, 'tidb-cluster/source-values.yaml')} ${path.join(arbiterTempDirChartsDir, 'tidb-cluster/values.yaml')}`)
  await exec(`helm install --namespace ${ns} --name ${ns}-sourcedb ${path.join(arbiterTempDirChartsDir, 'tidb-cluster')}/`)
  await exec(`ln -sf ${path.join(arbiterTempDirChartsDir, 'tidb-cluster/target-values.yaml')} ${path.join(arbiterTempDirChartsDir, 'tidb-cluster/values.yaml')}`)
  await exec(`helm install --namespace ${ns} --name ${ns}-targetdb ${path.join(arbiterTempDirChartsDir, 'tidb-cluster')}/`)

  // get topic and replace it
  const topic = await getTopic(ns)
  await exec(`sed -i 's/{topic}/${topic}/g' ${path.join(arbiterTempDirChartsDir, 'arbiter/values.yaml')}`)
  // start arbiter
  await exec(`helm install --namespace ${ns} --name ${ns}-arbiter ${path.join(arbiterTempDirChartsDir, 'arbiter')}/`)
}

async function getTopic(ns) {
  console.log('wait for TiDB up')
  // write in upstream to generate topic
  let port = await tryGetSourceDBPort(ns)
  while (port === '') {
    await sleep(1000)
    port = await tryGetSourceDBPort(ns)
  }
  console.log(`get source TiDB port ${port}`)
  await sleep(20000)
  console.log(`write to source TiDB to generate topic`)
  await exec(`mysql -h 127.0.0.1 -P ${port} -u root -e "CREATE DATABASE call_for_topic;"`)

  // get topic
  let topic = await getTopicName(ns)
  while (topic === '') {
    await sleep(1000)
    topic = await getTopicName(ns)
  }
  console.log(`get topic ${topic}`)
  return topic
}

async function getTopicName(ns) {
  let topic
  try {
    const { stdout } = await exec(`kubectl -n ${ns} exec -it ${ns}-kafka-0 -- kafka-topics --zookeeper ${ns}-kafka-zookeeper:2181 --list`)
    topic = stdout
  } catch (e) {
    console.log(e)
    return ''
  }
  if (/\d+_obinlog/.test(topic.trim())) {
    return topic.trim()
  }
  return ''
}

async function tryGetSourceDBPort(ns) {
  if (!await getDBPodStatus(ns)) {
    return ''
  }
  const { stdout: svc } = await exec(`kubectl -n ${ns} get svc | grep "sourcedb"`)
  const match = /4000:(\d+)\/TCP/.exec(svc)
  if (match === null) {
    return ''
  }
  return match[1]
}

async function getDBPodStatus(ns) {
  const { stdout: pod } = await exec(`kubectl -n ${ns} get pods | grep "sourcedb"`)
  if (pod.split('\n').map(i => i.indexOf("tidb") >= 0 ? 1 : 0).reduce((a, b) => a + b) < 2) {
    return false
  }
  for (const line of pod.split('\n')) {
    if (line.trim() === '') continue
    if (line.indexOf('Running') < 0) {
      return false
    }
  }
  return true
}
