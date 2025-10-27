export function readFileAsBase64(file) {
  if (!file) {
    return Promise.resolve(null);
  }
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const { result } = reader;
        if (typeof result !== 'string') {
          reject(new Error('Unsupported file result'));
          return;
        }
        const [, base64] = result.split('base64,');
        resolve(base64 ?? result);
      };
      reader.onerror = () => {
        reject(new Error('Unable to read file'));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      reject(error instanceof Error ? error : new Error('Unable to read file'));
    }
  });
}

export function humanFileSize(bytes, decimals = 1) {
  const size = typeof bytes === 'number' ? bytes : Number(bytes);

  if (!Number.isFinite(size) || size <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const exponent = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** exponent;
  const precision = Math.max(0, Math.min(3, Math.floor(decimals)));

  return `${value.toFixed(precision)} ${units[exponent]}`;
}

export default { readFileAsBase64, humanFileSize };
