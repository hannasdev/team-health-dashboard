print('Starting initialization script');

db = db.getSiblingDB('myapp');

if (!db.getCollectionNames().includes('users')) {
  print('Creating users collection');
  db.createCollection('users');
} else {
  print('Users collection already exists');
}

if (!db.getCollectionNames().includes('metrics')) {
  print('Creating metrics collection');
  db.createCollection('metrics', {
    timeseries: {
      timeField: 'timestamp',
      metaField: 'metric_name',
      granularity: 'minutes',
    },
  });
  print('Creating index on metrics collection');
  db.metrics.createIndex({ metric_category: 1, metric_name: 1, timestamp: 1 });
} else {
  print('Metrics collection already exists');
}

print('Initialization script completed');
