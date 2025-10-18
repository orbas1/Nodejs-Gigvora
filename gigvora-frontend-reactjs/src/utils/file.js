export async function readFileAsBase64(file) {
  if (!file) {
    return null;
  }

  if (typeof window === 'undefined' || typeof FileReader === 'undefined') {
    throw new Error('File uploads are not supported in this environment.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        const base64 = result.includes(',') ? result.split(',').pop() : result;
        resolve(base64);
      } else {
        reject(new Error('Unable to read file contents.'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

export function humanFileSize(bytes) {
  if (!bytes || Number.isNaN(Number(bytes))) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = Number(bytes);
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export default {
  readFileAsBase64,
  humanFileSize,
};
