/// <reference types="vite/client" />
interface ImportMetaEnv {
    readonly VITE_DATASET_ID: string
    readonly VITE_API_KEY: string
    readonly VITE_LANGUAGE: string
    readonly VITE_CURRENCY: string
    readonly VITE_SERVER_URL: string
  }
  
interface ImportMeta {
  readonly env: ImportMetaEnv
}