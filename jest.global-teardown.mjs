import v8 from 'v8';

export default async () => {
  if (global.gc) {
    global.gc();
  }
  console.log(
    'Final heap used:',
    v8.getHeapStatistics().used_heap_size / 1024 / 1024,
    'MB',
  );
};
