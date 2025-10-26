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

export default { readFileAsBase64 };
