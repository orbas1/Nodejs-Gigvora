## Backend Test Execution Log

- 2024-11-20: `npm test -- --runTestsByPath tests/realtime/channelRegistry.test.js tests/realtime/connectionRegistry.test.js` – ❌ Fails because Jest aborts while parsing `src/models/messagingModels.js` (`Unexpected keyword 'export'`) under the VM modules runner, preventing the new realtime suites from executing. See run output for stack trace.
- 2024-11-21: `SKIP_SEQUELIZE_BOOTSTRAP=true npm test -- --runTestsByPath tests/realtime/channelRegistry.test.js tests/realtime/connectionRegistry.test.js` – ✅ Passes after reworking the Jest bootstrap to consume the raw Sequelize client and guard expensive model imports when schema resets are skipped. Confirms channel access rules and connection governance.
