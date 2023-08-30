declare global {
    namespace NodeJS {
      interface ProcessEnv {
        INTEGRATION_TEST_API_KEY: string;
        INTEGRATION_TEST_DATASET_ID: string;
      }
    }
  }
  
export {}