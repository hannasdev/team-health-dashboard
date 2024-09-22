print('Starting initialization script');

db = db.getSiblingDB('myapp');

// GitHub Pull Requests Collection
if (!db.getCollectionNames().includes('githubpullrequests')) {
  print('Creating githubpullrequests collection');
  db.createCollection('githubpullrequests');

  // Insert some sample pull requests
  db.githubpullrequests.insertMany([
    {
      number: 1,
      title: 'Test PR 1',
      state: 'closed',
      author: 'testuser',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      updatedAt: new Date(),
      closedAt: new Date(),
      mergedAt: new Date(),
      additions: 100,
      deletions: 50,
      changedFiles: 5,
      processed: false,
      processedAt: null,
    },
    {
      number: 2,
      title: 'Test PR 2',
      state: 'open',
      author: 'testuser2',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      updatedAt: new Date(),
      closedAt: null,
      mergedAt: null,
      additions: 200,
      deletions: 100,
      changedFiles: 10,
      processed: false,
      processedAt: null,
    },
  ]);
} else {
  print('githubpullrequests collection already exists');
}

// GitHub Metrics Collection
if (!db.getCollectionNames().includes('githubmetrics')) {
  print('Creating githubmetrics collection');
  db.createCollection('githubmetrics');

  // Insert some sample GitHub metrics
  db.githubmetrics.insertMany([
    {
      metric_category: 'GitHub',
      metric_name: 'Pull Request Count',
      value: 2,
      timestamp: new Date(),
      unit: 'count',
      additional_info: 'Total PRs',
      source: 'GitHub',
    },
    {
      metric_category: 'GitHub',
      metric_name: 'Average Time to Merge',
      value: 48,
      timestamp: new Date(),
      unit: 'hours',
      additional_info: 'Based on 1 merged PR',
      source: 'GitHub',
    },
  ]);
} else {
  print('githubmetrics collection already exists');
}

// Google Sheets Metrics Collection
if (!db.getCollectionNames().includes('googlesheetsmetrics')) {
  print('Creating googlesheetsmetrics collection');
  db.createCollection('googlesheetsmetrics');

  // Insert some sample Google Sheets metrics
  db.googlesheetsmetrics.insertMany([
    {
      metric_category: 'Team Health',
      metric_name: 'Sprint Velocity',
      value: 45,
      timestamp: new Date(),
      unit: 'story points',
      additional_info: 'Last sprint velocity',
      source: 'Google Sheets',
    },
    {
      metric_category: 'Team Health',
      metric_name: 'Bug Count',
      value: 5,
      timestamp: new Date(),
      unit: 'count',
      additional_info: 'Open bugs',
      source: 'Google Sheets',
    },
  ]);
} else {
  print('googlesheetsmetrics collection already exists');
}

print('Creating indexes');
db.githubpullrequests.createIndex({ number: 1 }, { unique: true });
db.githubmetrics.createIndex({
  metric_category: 1,
  metric_name: 1,
  timestamp: 1,
});
db.googlesheetsmetrics.createIndex({
  metric_category: 1,
  metric_name: 1,
  timestamp: 1,
});

print('Initialization script completed');
