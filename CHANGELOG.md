# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [3.1.0](https://github.com/hannasdev/team-health-dashboard/compare/v3.0.2...v3.1.0) (2025-01-19)


### Features

* add missing repository config ([9a4ae46](https://github.com/hannasdev/team-health-dashboard/commit/9a4ae46778a2b96722f4eb6c8e1fc63f9e36712f))
* add Repository, Controller and Service for new Repository entity ([bb8873f](https://github.com/hannasdev/team-health-dashboard/commit/bb8873fab098479f7b5fb1b4908a77522debda99))


### Bug Fixes

* add missing repository controller interface ([4d572b6](https://github.com/hannasdev/team-health-dashboard/commit/4d572b61d35df3ba010a9b3109ea5c636232165b))
* apply ratelimit only to /api ([99cdcfd](https://github.com/hannasdev/team-health-dashboard/commit/99cdcfdf06b866bb86b4baa9e275b4775abc18ed))
* import ([5312478](https://github.com/hannasdev/team-health-dashboard/commit/53124784de23ea678de70bd89f7a7808c8ab2971))
* solve nested routes ([da83bfe](https://github.com/hannasdev/team-health-dashboard/commit/da83bfe7effd594375635f01164e6cb26fc7530b))


### Maintenance

* remove codebase.md from tracking ([f3e36c6](https://github.com/hannasdev/team-health-dashboard/commit/f3e36c62c96b46b960e033cd7de873913e1ca3ce))

### [3.0.2](https://github.com/hannasdev/team-health-dashboard/compare/v3.0.1...v3.0.2) (2025-01-06)


### Bug Fixes

* add logging and correct cache key ([3459ec2](https://github.com/hannasdev/team-health-dashboard/commit/3459ec2f91b6a832f6fd882db295804eea532753))
* remove the auth middleware covering all endpoints ([67d107b](https://github.com/hannasdev/team-health-dashboard/commit/67d107bfe25ef2f464fd1f465e57cb878a32b7ab))
* use correct ratelimit config ([28313df](https://github.com/hannasdev/team-health-dashboard/commit/28313df314da21dab7168dc3c413a521c52485dd))
* use host env variable ([9564977](https://github.com/hannasdev/team-health-dashboard/commit/9564977346ba1a59d55c0414055d2ea026bbe414))
* use http types for req and res ([bded4a9](https://github.com/hannasdev/team-health-dashboard/commit/bded4a90e31f70c1290044fccbf2914f6fb6bc96))


### Maintenance

* fix authentication issue ([f4a3957](https://github.com/hannasdev/team-health-dashboard/commit/f4a395779731a0015ad76d69330fda4942f8dd3a))
* fix issue with running health check ([891d506](https://github.com/hannasdev/team-health-dashboard/commit/891d50601a510b4e33e80336924ba993e414618e))
* fix lint error ([3baea48](https://github.com/hannasdev/team-health-dashboard/commit/3baea488d8149dcad0111b2c1a2e239e40f4ffe2))
* fix pr workflow ([9de30e1](https://github.com/hannasdev/team-health-dashboard/commit/9de30e108d1a697a907789cc70fab80856683a66))
* fix pr workflow again ([c91691f](https://github.com/hannasdev/team-health-dashboard/commit/c91691f4c9cdfc477d28d7a327bab1057aa6dd45))
* fix scenario where e2e never runs for PRs ([07d3eeb](https://github.com/hannasdev/team-health-dashboard/commit/07d3eeb170785ec14872f541995e5afc88e013b3))
* improve check for e2e status ([c44c44b](https://github.com/hannasdev/team-health-dashboard/commit/c44c44b6ba0fb5cf6254cfb3597ec879205eb057))
* log app-test to file from e2e ([4b3da29](https://github.com/hannasdev/team-health-dashboard/commit/4b3da2914afb62f0355216e461474680fc0f2187))
* optimize pr workflow ([78e9011](https://github.com/hannasdev/team-health-dashboard/commit/78e90111d7d5383f58b5f6334062a2ac9832689f))
* remove comment from command ([43afebc](https://github.com/hannasdev/team-health-dashboard/commit/43afebcddae17e7dee02d89b1e250167096e43be))
* remove comments from command ([eda74a9](https://github.com/hannasdev/team-health-dashboard/commit/eda74a9b3433dc8572236a6f1a3e76a20bc7329e))
* replace app-test DATABASE_URL to hardcoded value ([5629932](https://github.com/hannasdev/team-health-dashboard/commit/5629932e486f35456650968b9e1d41eba660d771))
* use variable for DATABASE_URL in app-test ([1d77252](https://github.com/hannasdev/team-health-dashboard/commit/1d77252b2893eca00b372566267cee5e9436eeba))

### [3.0.1](https://github.com/hannasdev/team-health-dashboard/compare/v3.0.0...v3.0.1) (2024-12-30)


### Maintenance

* replace set-output in workflow ([9673010](https://github.com/hannasdev/team-health-dashboard/commit/9673010047c80af6190cf450b9cdb4139a3d2c3f))

## [3.0.0](https://github.com/hannasdev/team-health-dashboard/compare/v2.2.5...v3.0.0) (2024-12-30)


### ⚠ BREAKING CHANGES

* Refactoring Interfaces in Controllers, Routes and Middleware

### Maintenance

* add chores to CHANGELOG ([3a88402](https://github.com/hannasdev/team-health-dashboard/commit/3a8840207bb30d0846c0ad1d569848b043f357e3))
* fix lint errors ([67833bb](https://github.com/hannasdev/team-health-dashboard/commit/67833bba885a09cc53f51e5ca7b2d52ca8c25613))


* Merge pull request #26 from hannasdev/test/cleanup ([d07b9d7](https://github.com/hannasdev/team-health-dashboard/commit/d07b9d77df95ab994370468ad12a0c84db9100e4)), closes [#26](https://github.com/hannasdev/team-health-dashboard/issues/26)

### [2.2.5](https://github.com/hannasdev/team-health-dashboard/compare/v2.2.4...v2.2.5) (2024-12-23)


### Bug Fixes

* remove invalid comments inside run command ([3699cf1](https://github.com/hannasdev/team-health-dashboard/commit/3699cf12af8ce4c39f802c62df34248610294350))

### [2.2.4](https://github.com/hannasdev/team-health-dashboard/compare/v2.2.3...v2.2.4) (2024-12-23)

### [2.2.3](https://github.com/hannasdev/team-health-dashboard/compare/v2.2.2...v2.2.3) (2024-11-16)


### Bug Fixes

* replace placeholder urls ([2d91218](https://github.com/hannasdev/team-health-dashboard/commit/2d91218d93dacd8714789c366a965a70e7dcadd8))

### [2.2.2](https://github.com/your-username/your-repo/compare/v2.2.1...v2.2.2) (2024-11-16)

### [2.2.1](https://github.com/your-username/your-repo/compare/v2.2.0...v2.2.1) (2024-11-16)


### Bug Fixes

* catch circular dependency ([93cbd0f](https://github.com/your-username/your-repo/commit/93cbd0f3cdcf542bfd55cd6dda71c96f1b18ac23))
* improve header sanitization ([d95fa03](https://github.com/your-username/your-repo/commit/d95fa0335bccbea060a69422fb140ecb6584ccf3))

## [2.2.0](https://github.com/your-username/your-repo/compare/v2.1.1...v2.2.0) (2024-11-16)


### Features

* add new security middlewares ([473998f](https://github.com/your-username/your-repo/commit/473998fa66a6785d9b13fb761d38fd8fb526a19b))


### Bug Fixes

* add inject to security headers config ([8b94278](https://github.com/your-username/your-repo/commit/8b942780e63a969227de23d199b4dd850e4b9448))
* add missing inject for rate limit config ([8ea8769](https://github.com/your-username/your-repo/commit/8ea8769a3dc19caaafa19434376bd95e93bd5c95))

### [2.1.1](https://github.com/your-username/your-repo/compare/v2.1.0...v2.1.1) (2024-10-25)

## [2.1.0](https://github.com/your-username/your-repo/compare/v2.0.9...v2.1.0) (2024-10-13)


### Features

* add methods to reset metrics data ([3b90025](https://github.com/your-username/your-repo/commit/3b900252854db03f797c226b3b6b54f79dacc803))
* process github metrics ([f694741](https://github.com/your-username/your-repo/commit/f694741976426ead0abc2bf49932b5981f9a05dd))
* remove prs from database ([951419f](https://github.com/your-username/your-repo/commit/951419f1f3bade357740495a3f9989e585d0c52e))

### [2.0.9](https://github.com/your-username/your-repo/compare/v2.0.8...v2.0.9) (2024-10-02)


### Bug Fixes

* abstract config object ([c44fdc2](https://github.com/your-username/your-repo/commit/c44fdc2cd96a6466956c5292ce191075e85bef8d))
* add logs to help debug expiry ([e72b6d7](https://github.com/your-username/your-repo/commit/e72b6d7d6c9a355b46d287ddabe8ac5a5b5c465c))
* add validation for expiry ([f68a0af](https://github.com/your-username/your-repo/commit/f68a0afa8f39a7f2ff78b052592781faefcc5740))
* default to defaults and not undefined ([4ea127d](https://github.com/your-username/your-repo/commit/4ea127d0c93cd22cbf7d066ba5b3a362b5df38ca))
* use express json parser ([fee3170](https://github.com/your-username/your-repo/commit/fee317024cde040c2265996d895d3f991bef54f2))

### [2.0.8](https://github.com/your-username/your-repo/compare/v2.0.7...v2.0.8) (2024-10-01)


### Bug Fixes

* indentation ([cc9c200](https://github.com/your-username/your-repo/commit/cc9c20032d122060115cb5ae76376fc1eab96209))
* second attempt to fix CI on merge to main ([0845b7d](https://github.com/your-username/your-repo/commit/0845b7d0ce34e9c55af4b995652114e14e02400d))
* versioning on merge ([2fbc496](https://github.com/your-username/your-repo/commit/2fbc496b34a4546934d6c9ce3d8ded521be42f35))

### [2.0.7](https://github.com/your-username/your-repo/compare/v2.0.6...v2.0.7) (2024-09-22)


### Bug Fixes

* prevent push version bump loop ([82d39d8](https://github.com/your-username/your-repo/commit/82d39d8d23eaa951148a84851db730770435287f))

### [2.0.6](https://github.com/your-username/your-repo/compare/v2.0.5...v2.0.6) (2024-09-22)

### [2.0.5](https://github.com/your-username/your-repo/compare/v2.0.4...v2.0.5) (2024-09-22)

### [2.0.4](https://github.com/your-username/your-repo/compare/v2.0.3...v2.0.4) (2024-09-22)

### [2.0.3](https://github.com/your-username/your-repo/compare/v2.0.2...v2.0.3) (2024-09-22)

### [2.0.2](https://github.com/your-username/your-repo/compare/v2.0.1...v2.0.2) (2024-09-22)

### [2.0.1](https://github.com/your-username/your-repo/compare/v2.0.0...v2.0.1) (2024-09-22)

## 2.0.0 (2024-09-22)


### ⚠ BREAKING CHANGES

* Update broken bindings, write new E2E test for metrics, and update Unit Tests

### Features

* Add access token and refresh token and return user ([2f8991b](https://github.com/your-username/your-repo/commit/2f8991ba840c218b2c0c723139e1154c131bcbe6))
* add additional logging ([bc4b22a](https://github.com/your-username/your-repo/commit/bc4b22ac47d5a5a15cb94056378024514d60ecd0))
* add ai-digest ([0864900](https://github.com/your-username/your-repo/commit/0864900cdd1ea61e92a70d42bb09e6e8b47bfa7b))
* add cache service and stream PRs ([158a203](https://github.com/your-username/your-repo/commit/158a203c89d7c2a3312597a1cba232e3c6b9812e))
* add cache to GoogleSheetsService, refactor adapters and update tests ([f4506ef](https://github.com/your-username/your-repo/commit/f4506ef4ca317c09b043bfd586d7cfe7196cc092))
* Add cancel operations ([062daec](https://github.com/your-username/your-repo/commit/062daec23da0908b2c7984867d2112bd27355a87))
* add debugging steps ([5c871e8](https://github.com/your-username/your-repo/commit/5c871e87c6256ba72d45289288f2925e0ba2ab34))
* add ErrorHandler and implement in MetricsController ([507a953](https://github.com/your-username/your-repo/commit/507a9539b47adf68e0fb00f354da881dfe99c4bb))
* add github workflow ([e6f99d0](https://github.com/your-username/your-repo/commit/e6f99d09971c9b6630b2ab2c51633c7d7263c180))
* add health-check ([d21eda6](https://github.com/your-username/your-repo/commit/d21eda606a9d795cdc0ccb6feb599f954c8eeacb))
* Add heartbeat to avoid connection drop ([934b368](https://github.com/your-username/your-repo/commit/934b368608188f11da7ef7c99dcab1819f89c8d4))
* add in-memory user registration, login and authentication ([a1b8dd2](https://github.com/your-username/your-repo/commit/a1b8dd28201f109962aebc7f4e225054a8dfe3fb))
* add index ([7fb59b1](https://github.com/your-username/your-repo/commit/7fb59b192cbfae0196da38f1dc18e3f46aafe979))
* add interfaces ([3e19577](https://github.com/your-username/your-repo/commit/3e195779f31123a9deccbdb985b70032de7980ea))
* Add JobQueue and worker for processing Metrics ([8a96c2d](https://github.com/your-username/your-repo/commit/8a96c2dece1bf8093b059c47cc4e2f3154842e7f))
* Add JobQueue and worker for processing Metrics ([09e7ea9](https://github.com/your-username/your-repo/commit/09e7ea91ead8afb1b43aab7b146bbc26b26adc32))
* add json and error handling middlewares ([82e2b21](https://github.com/your-username/your-repo/commit/82e2b211c27a8246d86a12138d94e8fa553fc81b))
* Add jtw decode method ([f40ca10](https://github.com/your-username/your-repo/commit/f40ca10999a974c0788cb04238339203846f52ad))
* add log and check for missing DATABASE_URL ([5940717](https://github.com/your-username/your-repo/commit/5940717ba2d5f34508ccef2d27b07c09090a976a))
* add LoggingService ([5b8f331](https://github.com/your-username/your-repo/commit/5b8f33156fc6a787c00b3974aa23f320ffb2f839))
* add octokit, fix dep versions and add scripts ([ea9ad6c](https://github.com/your-username/your-repo/commit/ea9ad6c02cbd90bb03c2ea5b38d5cf9312f2d4b3))
* add progress tracker and use SSE for getAllMetrics() ([2b366ed](https://github.com/your-username/your-repo/commit/2b366ed9ce2830206dc8f18b7a0d867fb6a45047))
* add resetter ([a4bc036](https://github.com/your-username/your-repo/commit/a4bc0363a8def1ba9d3bfd632d13ef00030d5915))
* add services and controller, update route ([3d57a52](https://github.com/your-username/your-repo/commit/3d57a52b4fcf841ad71ea70040aacb04105aba7d))
* Add SSE_TIMEOUT ([7931240](https://github.com/your-username/your-repo/commit/793124013b096bc86fc23b6f4e06f660cb40ee91))
* Add TokenBlacklistService to manage token blacklist ([d8d4577](https://github.com/your-username/your-repo/commit/d8d4577247cbf75318b5418b2caa4eb1814eb43c))
* Add updatePassword method ([36726bc](https://github.com/your-username/your-repo/commit/36726bc896b08da676152d1e4220f13c5e91b3e3))
* Change file structure and add test coverage ([3d73dd3](https://github.com/your-username/your-repo/commit/3d73dd3f8489607220ea74821427d24bd1a8900d))
* configure for production build ([c9ee143](https://github.com/your-username/your-repo/commit/c9ee1434733d2cd8ec733fbd030db0eeff16a551))
* dockerize the app and add mongo ([6393f43](https://github.com/your-username/your-repo/commit/6393f430f55861a812a66015dc462e3f165e6c80))
* expand Logger class to use file logging ([48c15d3](https://github.com/your-username/your-repo/commit/48c15d3a130babe188b885bcbfaf54e3a241beae))
* extend scope of data from google sheets ([a28bf4b](https://github.com/your-username/your-repo/commit/a28bf4b64ae6a9875085feeb10dc38ccc9f13b1e))
* Flatten response ([2f09c8f](https://github.com/your-username/your-repo/commit/2f09c8f2b1faaf6c610dac69c066c9f543a58e4e))
* Handle refresh tokens ([c4e0d00](https://github.com/your-username/your-repo/commit/c4e0d004dd9c26d07656902d9b1713a17d78736c))
* Handle token expiry and bcrypt rounds ([bc00734](https://github.com/your-username/your-repo/commit/bc007340afecfca0665fee240aa4f3c280bf8ae5))
* implement partial progress caching ([a962027](https://github.com/your-username/your-repo/commit/a9620271e2f3ad69c8b6087afc5d3e5c2ab02b50))
* Improve createErrorResponse ([e53b092](https://github.com/your-username/your-repo/commit/e53b0925a400a46400f33d9777a8a5336e7d426b))
* Improve errors ([08c4d93](https://github.com/your-username/your-repo/commit/08c4d933e6953df37dd21759e3a42fa219ab16ea))
* Improve errors ([7660894](https://github.com/your-username/your-repo/commit/76608946f2328e7d7f7ef816fa1ac47e77d6fb82))
* Improve logging ([3d1ccd5](https://github.com/your-username/your-repo/commit/3d1ccd5ddf5e727d1f9b6d85f7129d0af8567d92))
* Improve testabiligy ([6a03ebf](https://github.com/your-username/your-repo/commit/6a03ebf5075483f57778871be842480063005fcd))
* Improve testability ([66e98e6](https://github.com/your-username/your-repo/commit/66e98e69eaf40012b4622af7a8c1b7a7b6f495f9))
* Improve testability ([a63dda2](https://github.com/your-username/your-repo/commit/a63dda29029abd62d3842a05c419c3ce91fcd631))
* make logger more resistent ([248cfe6](https://github.com/your-username/your-repo/commit/248cfe63976eb1e88d252095aa729dfe516fb8cb))
* Manage expired tokens and refresh token ([e713b12](https://github.com/your-username/your-repo/commit/e713b126753f37531f5322b1372b5cbc0f36920c))
* Return specific user data ([d06763f](https://github.com/your-username/your-repo/commit/d06763f1afb71bb3b77905bb5ea7b44c48627226))
* Store metrics for processing ([c2eefa2](https://github.com/your-username/your-repo/commit/c2eefa2eab01f7b751eb286473868a0b597b5e58))
* use Logger ([b82f954](https://github.com/your-username/your-repo/commit/b82f9544b577b110e23086d7a578b72e37d29195))
* use webpack for production build in Docker ([f14b7bd](https://github.com/your-username/your-repo/commit/f14b7bd30ed7d446a6783902e3f2ed79fc08d404))


### Bug Fixes

* Add .js for ts-node to run in container ([df0fa6e](https://github.com/your-username/your-repo/commit/df0fa6eee3e764f7e0bc72cd6b06b1b77a3f40de))
* add envs ([de06791](https://github.com/your-username/your-repo/commit/de067914becd88932cf11129b03879e5d07e1a2f))
* add more complete logger mock factory ([d320c3c](https://github.com/your-username/your-repo/commit/d320c3cc27a2fa81efe3c5f7a07f5693e047eb95))
* Add type for type imports ([e2794b5](https://github.com/your-username/your-repo/commit/e2794b5e6d98389957aadc74cd4543fcfb5423b0))
* adjust % count to not go above 100 ([b698fdc](https://github.com/your-username/your-repo/commit/b698fdc170025f6bfc23032f49bab96fec587f32))
* Align with expected behaviour in E2E tests ([d05f8fe](https://github.com/your-username/your-repo/commit/d05f8feb0f1ddc63f20bd5b234a7822b2941e584))
* Broken imports ([2f3a0c5](https://github.com/your-username/your-repo/commit/2f3a0c55e485816c93776f8dd6435579b77f8021))
* config ([8f2166b](https://github.com/your-username/your-repo/commit/8f2166b7f786d06cb918a87735abbbb68d8252f0))
* config errors ([1a65124](https://github.com/your-username/your-repo/commit/1a651246df8270336df35aa712f8b79d19b1b52f))
* consistent import with @ ([ac283e9](https://github.com/your-username/your-repo/commit/ac283e9d5900400f459a6c01328fc45c59fa188d))
* CORS issue ([71f3ec5](https://github.com/your-username/your-repo/commit/71f3ec59fdce61cdae45dfd99ea66cc291d8cdf3))
* db init ([15b735b](https://github.com/your-username/your-repo/commit/15b735be4e36715748654dc4a37306c0aa412fa4))
* dep injection and tests ([a07956c](https://github.com/your-username/your-repo/commit/a07956c83c0ff628bf86a7d152b4e0c2f2f5574c))
* e2e testing ([a5cbb94](https://github.com/your-username/your-repo/commit/a5cbb945a1d1d3b1712ca719c962fe40da9f4066))
* eslint ([8466a32](https://github.com/your-username/your-repo/commit/8466a32f3cf0bc5978d35350ed03eeaa9181b7c8))
* eslint config ([1464013](https://github.com/your-username/your-repo/commit/1464013fca421f83de40bf0b0e4c255ecb76f07a))
* ESM requires .js for imports ([35886a6](https://github.com/your-username/your-repo/commit/35886a628f0c93d67380d41075141a81f61ce255))
* Filename comment ([0301ff8](https://github.com/your-username/your-repo/commit/0301ff802d44f19c287aafe58847906094feeba2))
* getters from object ([9c97a9b](https://github.com/your-username/your-repo/commit/9c97a9b283f88338ee01da46b728bfc9b0b09a10))
* import issue due to lower case - step 1 ([e267934](https://github.com/your-username/your-repo/commit/e26793499172fc2c77f856d58532dd4d05b64adf))
* import issues - step 2 ([aa8876b](https://github.com/your-username/your-repo/commit/aa8876bc997da3ced3610893dd3f8f38a9e11ab0))
* imports ([9e68d8d](https://github.com/your-username/your-repo/commit/9e68d8d8b6ee38d8e51cd59129714291b09ef81d))
* inconsistencies ([40990a6](https://github.com/your-username/your-repo/commit/40990a6aaa7911757ca1a0737312063030864a7e))
* inconsistencies ([3c2136f](https://github.com/your-username/your-repo/commit/3c2136ffd6817d970075d0ebb4ad2e21a700114a))
* legacy peer deps ([24fcc24](https://github.com/your-username/your-repo/commit/24fcc2430b3c18501a6d9b6e668d6fc10059f9a3))
* lint errors ([dd5b9cd](https://github.com/your-username/your-repo/commit/dd5b9cddebbe62aa54e3f39adfd29883f330cdeb))
* lint issues ([ac41d21](https://github.com/your-username/your-repo/commit/ac41d21707b20e0632923c1c28c42e2fdceedddd))
* linting ([797d7e8](https://github.com/your-username/your-repo/commit/797d7e8bd37d08866bea1435d77becfe2f710ef6))
* linting ([126faab](https://github.com/your-username/your-repo/commit/126faab137cda19cbcf9b5412690bd3f4ec2ebac))
* linting ([f720c7a](https://github.com/your-username/your-repo/commit/f720c7a6021f58aff3cf225bb2838653a2ca56d9))
* linting ([ea35a75](https://github.com/your-username/your-repo/commit/ea35a75fb5ead850374c4d23280c9ef6cb845768))
* loading env variables ([274fd33](https://github.com/your-username/your-repo/commit/274fd339c1d513f08f1ea6f05b164a88b6af906b))
* make eslint work with legacy plugins ([9cb5d64](https://github.com/your-username/your-repo/commit/9cb5d64acae0b54ae63aa872a8f8b3698da3703f))
* Make sure headers aren't sent multiple times ([b15ffea](https://github.com/your-username/your-repo/commit/b15ffea563d892da45cad65330145e6515535a45))
* move back inside /src ([a6b8654](https://github.com/your-username/your-repo/commit/a6b86543247c87ec35853d47190d21ae54d1b0ef))
* permissions ([71e19c0](https://github.com/your-username/your-repo/commit/71e19c0fb8a714ad8a3b980cade41c924ddabbd7))
* proper use of ILogger and IConfig ([7545ce7](https://github.com/your-username/your-repo/commit/7545ce7d5acc184ffa52129f8c93c3e079870e78))
* reinstall ts-loader used by webpack ([6a31cde](https://github.com/your-username/your-repo/commit/6a31cde21a54d6776d229b9e9abe13556f7e49d6))
* remove emits from tsc ([ae67df7](https://github.com/your-username/your-repo/commit/ae67df7c95190900c74ccc93073565fb51068d48))
* remove failing postinstall script ([042d9bb](https://github.com/your-username/your-repo/commit/042d9bb01a52b6ee27c541e01038357b9b59db59))
* Remove function wrapper to run E2E ([4742406](https://github.com/your-username/your-repo/commit/4742406a540e89d337145bb8e9606ad3b2b0ad95))
* remove linting ([8307aef](https://github.com/your-username/your-repo/commit/8307aefe7b49531514c773d559072f49f54cba7c))
* Remove redundant import ([0fdf290](https://github.com/your-username/your-repo/commit/0fdf290ba7817adc08c3beaad97c9db50604e3f6))
* remove unnecessary steps ([0767258](https://github.com/your-username/your-repo/commit/0767258d3c87b80506eec509dbe621cf18ce4881))
* remove unused placeholders ([ae524d5](https://github.com/your-username/your-repo/commit/ae524d582bcf4db048f633fdf5f8289d4b070d2b))
* removed webpack ([bfefacf](https://github.com/your-username/your-repo/commit/bfefacfe5f4b153f704db3571479a0ab9106685e))
* rename for easier match ([96ed1a3](https://github.com/your-username/your-repo/commit/96ed1a36d3276622e948d7101ea1fa6ad5b7abb2))
* replace @ alias ([b084915](https://github.com/your-username/your-repo/commit/b084915f58cfef7d2c8fa4e76c2277df4fc1b450))
* revert to v8 of eslint to solve dep conflicts ([9b1ef74](https://github.com/your-username/your-repo/commit/9b1ef742dd0ddb1fac8e0aad30f081aead06cd6c))
* running e2e as part of unit test suite ([aca7eb9](https://github.com/your-username/your-repo/commit/aca7eb9a92d0d449b88aac36841282d0bbc8d300))
* set root dir to include root ([b82fd83](https://github.com/your-username/your-repo/commit/b82fd8306d21c39294e102034d2cc7745a75374b))
* start time and timeout ([e98d3dc](https://github.com/your-username/your-repo/commit/e98d3dcb50c5fae0522d87e0a83c98f3a8d8842e))
* test optimisation ([ffb0bf1](https://github.com/your-username/your-repo/commit/ffb0bf182695154c31b3e2b88f76d435b9fa8c50))
* tests and db connection ([22d07ab](https://github.com/your-username/your-repo/commit/22d07ab60267207407ed657a9f97d2e012e21cba))
* tests and interfaces implementation ([270457b](https://github.com/your-username/your-repo/commit/270457bef14b04979c19fe747dbe43832a007d1a))
* ts/webpack inconsistencies ([7d49def](https://github.com/your-username/your-repo/commit/7d49def66ea411ec65a17341ca804ec1568ec445))
* tsc script ([afce67e](https://github.com/your-username/your-repo/commit/afce67e3cbc9925e0421ed188fbb26b95f2b75be))
* type errors ([f53bd9d](https://github.com/your-username/your-repo/commit/f53bd9de915f86d59817b145d6dce7776cc1dcde))
* type errors ([c1a2fd4](https://github.com/your-username/your-repo/commit/c1a2fd46988c2ccebfc1b5c24017fa4826bac4d8))
* type import inconsistencies ([8cc627b](https://github.com/your-username/your-repo/commit/8cc627b5c3b4bda5120f0d505da1329d9c753449))
* update bindings and fix unit tests and e2e tests ([829cfde](https://github.com/your-username/your-repo/commit/829cfde3979f9a6b18853e24858a9ece1e5aec60))
* Update imports ([ade9038](https://github.com/your-username/your-repo/commit/ade90383123eb7d3cb96348d4dc0d8c5d649f401))
* Update tests and error messages ([737a2c1](https://github.com/your-username/your-repo/commit/737a2c14dc720cf555afed7e9f4d61f590b4131a))
* use config mock ([02b2df7](https://github.com/your-username/your-repo/commit/02b2df72e557a35f1fc7aa0ae7b7903ba96d7e5f))
* use of Logger ([7cde751](https://github.com/your-username/your-repo/commit/7cde7517b37df3e914eb7bd7b2656d4e1fe51fbb))
* Use type for interface imports ([fa9e369](https://github.com/your-username/your-repo/commit/fa9e3691e5734f0b3143e324494c529508261586))
* use webpack prod build ([63bb2d5](https://github.com/your-username/your-repo/commit/63bb2d5a63001acd81f387746203b7dd62d919df))
* webpack config ([d700cc1](https://github.com/your-username/your-repo/commit/d700cc185054f19c250049a5364f34ed36ad4f05))


* Merge pull request #6 from hannasdev/chore/update-broken-unit-tests ([5e35660](https://github.com/your-username/your-repo/commit/5e35660ae6b55e878340076cea3e6b5a25bbb3f6)), closes [#6](https://github.com/hannasdev/team-health-dashboard/issues/6)
