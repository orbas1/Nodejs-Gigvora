export function readinessStatusToHttp(status) {
  if (status === 'ok') {
    return 200;
  }
  if (status === 'starting') {
    return 503;
  }
  if (status === 'error') {
    return 503;
  }
  return 503;
}

export default {
  readinessStatusToHttp,
};
