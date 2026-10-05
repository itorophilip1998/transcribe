/// <reference types="vite/client" />
/// <reference types="chrome" />

declare module '*?inline' {
  const content: string;
  export default content;
}

declare module '*?worker' {
  const workerConstructor: {
    new (options?: WorkerOptions): Worker;
  };
  export default workerConstructor;
}
