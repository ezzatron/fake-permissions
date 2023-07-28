// detect whether Jest has been invoked with specific test file(s)
const isTestFile = process.argv.some((arg) => arg.endsWith(".spec.ts"));

/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest/presets/default-esm",
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  testMatch: [isTestFile ? "**/*.spec.ts" : "<rootDir>/test/**/*.spec.*"],
  resetMocks: true,
  collectCoverageFrom: ["<rootDir>/src/**/*"],
  coverageDirectory: "artifacts/coverage/jest",
};

export default config;
