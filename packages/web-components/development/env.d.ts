/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_DATASET_ID: string
    readonly VITE_API_KEY: string
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }