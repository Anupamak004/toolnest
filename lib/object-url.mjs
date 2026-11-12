/** Create a revocable browser URL lease, injectable for lifecycle tests. */
export function createObjectUrlLease(value, urlApi = URL) {
  if (!value) return { url: null, release() {} };
  const url = urlApi.createObjectURL(value);
  let released = false;
  return {
    url,
    release() {
      if (released) return;
      released = true;
      urlApi.revokeObjectURL(url);
    },
  };
}
