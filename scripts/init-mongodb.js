// scripts/init-mongodb.js
db = db.getSiblingDB('myapp');

db.createCollection('users');

db.createCollection('metrics', {
  timeseries: {
    timeField: 'timestamp',
    metaField: 'metric_name',
    granularity: 'minutes',
  },
});

db.metrics.createIndex({ metric_category: 1, metric_name: 1, timestamp: 1 });
