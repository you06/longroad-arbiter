curl -X POST -d "tidb_general_log=1" http://127.0.0.1:10080/settings

helm del --purge binlog-test-18-sourcedb
helm del --purge binlog-test-18-targetdb-tidb
kubectl delete ns binlog-test-18

kubectl -n binlog-test-18 get pods
ln -sf `pwd`/tidb-cluster/source-values.yaml tidb-cluster/values.yaml
helm install --namespace binlog-test-18 --name binlog-test-18-sourcedb tidb-cluster/
ln -sf `pwd`/tidb-cluster/target-values.yaml tidb-cluster/values.yaml
helm install --namespace binlog-test-18 --name binlog-test-18-targetdb-tidb tidb-cluster/
