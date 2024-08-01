# How to implement SSE

SSE - Server-Sent Events is an alternative to polling an endpoint by utilising event sourcing.

```js
const eventSource = new EventSource('/api/metrics');

eventSource.onmessage = event => {
  const data = JSON.parse(event.data);
  console.log('Received data:', data);
};

eventSource.addEventListener('progress', event => {
  const { progress, message } = JSON.parse(event.data);
  console.log(`Progress: ${progress}%, Message: ${message}`);
  // Update your UI to show progress
});

eventSource.addEventListener('result', event => {
  const { success, data, errors, status } = JSON.parse(event.data);
  console.log('Final result:', { success, data, errors, status });
  // Process the final data and update your UI
  eventSource.close(); // Close the connection after receiving the final result
});

eventSource.addEventListener('error', event => {
  const { success, errors, status } = JSON.parse(event.data);
  console.error('Error:', { success, errors, status });
  // Handle the error in your UI
  eventSource.close(); // Close the connection on error
});

eventSource.onerror = error => {
  console.error('EventSource failed:', error);
  eventSource.close();
};
```
