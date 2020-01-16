# Longroad with kafka & arbiter

## Road

```
TiDB -> binlog -> kafka -> arbiter -> TiDB
```

## Usage

```sh
node deploy.js -namespace your-namespace -storage-class your-storage-class
```

* `-namespace` required, if not exist will be created
* `-storage-class` optional, default to `local-storage`
