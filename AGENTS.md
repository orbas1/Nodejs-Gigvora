# Error Sweep Report

## Group 1 (Entries 1-30)
1. [Backend config validation] Failed to load .env file: ENOENT: no such file or directory, open '/workspace/Nodejs-Gigvora/gigvora-backend-nodejs/.env'. Falling back to process environment.
2. [Backend database verification] Command exited with code 1
3. [Backend database verification] Error: Database configuration missing required values: DB_HOST, DB_USER, DB_NAME
4. [Backend database verification] Failed to load .env file: ENOENT: no such file or directory, open '/workspace/Nodejs-Gigvora/gigvora-backend-nodejs/.env'. Falling back to process environment.
5. [Backend database verification] throw new Error(
6. [Backend lint] 1:1   warning  There should be at least one empty line between import groups                                import/order
7. [Backend lint] 10:1  warning  `./config/httpSecurity.js` import should occur before import of `./routes/index.js`    import/order
8. [Backend lint] 10:1  warning  There should be at least one empty line between import groups    import/order
9. [Backend lint] 10:8  error    Parse errors in imported module '../services/adminTwoFactorService.js': Logical expressions and coalesce expressions cannot be mixed. Wrap either by parentheses (285:70)  import/namespace
10. [Backend lint] 11:1  warning  `./middleware/webApplicationFirewall.js` import should occur before import of `./routes/index.js`  import/order
11. [Backend lint] 11:10  warning  'ValidationError' is defined but never used. Allowed unused vars must match /^ignored/u  no-unused-vars
12. [Backend lint] 12:1  warning  `../services/affiliateSettingsService.js` import should occur before import of `../services/platformSettingsService.js`       import/order
13. [Backend lint] 12:1  warning  `./config/runtimeConfig.js` import should occur before import of `./routes/index.js`     import/order
14. [Backend lint] 122:8  warning  Prefer named exports  import/no-default-export
15. [Backend lint] 13:1   warning  `../utils/adminRequestContext.js` import should occur before import of `../utils/errors.js`  import/order
16. [Backend lint] 136:8  warning  Prefer named exports                                                    import/no-default-export
17. [Backend lint] 14:1  warning  `../services/pageSettingsService.js` import should occur before import of `../services/platformSettingsService.js`            import/order
18. [Backend lint] 14:24  warning  Caution: `adminWalletService` also has a named export `listWalletAccounts`. Check if you meant to write `import {listWalletAccounts} from '../services/adminWalletService.js'` instead            import/no-named-as-default-member
19. [Backend lint] 144:9   warning  Unused eslint-disable directive (no problems were reported from 'no-await-in-loop')
20. [Backend lint] 15:1  warning  `../utils/adminRequestContext.js` import should occur before import of `../utils/logger.js`  import/order
21. [Backend lint] 15:1  warning  `../utils/agencyWorkspaceAccess.js` import should occur before import of `../utils/controllerUtils.js`  import/order
22. [Backend lint] 16:8   error    Parse errors in imported module '../services/blogService.js': 'import' and 'export' may only appear at the top level (393:1)  import/namespace
23. [Backend lint] 165:11  warning  'actor' is assigned a value but never used. Allowed unused vars must match /^ignored/u  no-unused-vars
24. [Backend lint] 166:13  warning  'outputPath' is assigned a value but never used. Allowed unused vars must match /^ignored/u  no-unused-vars
25. [Backend lint] 17:1   warning  `../models/index.js` import should occur before import of `../services/blogService.js`                                 import/order
26. [Backend lint] 18:1  warning  `../models/projectGigManagementModels.js` import should occur before import of `../services/agencyProjectManagementService.js`  import/order
27. [Backend lint] 186:8  warning  Prefer named exports      import/no-default-export
28. [Backend lint] 188:11  warning  Caution: `notificationService` also has a named export `queueNotification`. Check if you meant to write `import {queueNotification} from '../services/notificationService.js'` instead                        import/no-named-as-default-member
29. [Backend lint] 19:1   warning  `../utils/controllerUtils.js` import should occur before import of `../utils/errors.js`                                 import/order
30. [Backend lint] 2:1  warning  There should be at least one empty line between import groups           import/order

## Group 2 (Entries 31-60)
31. [Backend lint] 2:1  warning  There should be at least one empty line between import groups  import/order
32. [Backend lint] 20:1  warning  `../services/gdprSettingsService.js` import should occur before import of `../services/platformSettingsService.js`            import/order
33. [Backend lint] 20:1  warning  `../utils/adminRequestContext.js` import should occur before import of `../utils/errors.js`  import/order
34. [Backend lint] 20:25  warning  Caution: `adminWalletService` also has a named export `getWalletAccountById`. Check if you meant to write `import {getWalletAccountById} from '../services/adminWalletService.js'` instead        import/no-named-as-default-member
35. [Backend lint] 207:8  warning  Prefer named exports                                 import/no-default-export
36. [Backend lint] 21:1  warning  `../services/seoSettingsService.js` import should occur before import of `../services/systemSettingsService.js`               import/order
37. [Backend lint] 22:1   warning  `../models/seoSetting.js` import should occur before import of `../models/sequelizeClient.js`                                                                                                        import/order
38. [Backend lint] 22:1  warning  `../services/runtimeObservabilityService.js` import should occur before import of `../services/systemSettingsService.js`      import/order
39. [Backend lint] 22:8   warning  Using exported name 'SeoSetting' as identifier for default import                                                                                                        import/no-named-as-default
40. [Backend lint] 22:8  warning  Prefer named exports  import/no-default-export
41. [Backend lint] 220:8   warning  Prefer named exports                                  import/no-default-export
42. [Backend lint] 225:13  warning  Caution: `projectService` also has a named export `recordAutoAssignFailure`. Check if you meant to write `import {recordAutoAssignFailure} from '../services/projectService.js'` instead                      import/no-named-as-default-member
43. [Backend lint] 23:1   warning  `../models/siteManagementModels.js` import should occur before import of `../models/volunteeringModels.js`                                                                                           import/order
44. [Backend lint] 24:1   warning  `../models/storageManagementModels.js` import should occur before import of `../models/volunteeringModels.js`                                                                                        import/order
45. [Backend lint] 246:1   error    'describe' is not defined                                                                                                         no-undef
46. [Backend lint] 247:3   error    'test' is not defined                                                                                                         no-undef
47. [Backend lint] 25:1   warning  `../models/systemSetting.js` import should occur before import of `../models/volunteeringModels.js`                                                                                                  import/order
48. [Backend lint] 25:25  warning  Caution: `adminWalletService` also has a named export `createWalletAccount`. Check if you meant to write `import {createWalletAccount} from '../services/adminWalletService.js'` instead          import/no-named-as-default-member
49. [Backend lint] 25:8   warning  Using exported name 'SystemSetting' as identifier for default import                                                                                                        import/no-named-as-default
50. [Backend lint] 251:5   error    'expect' is not defined                                                                                                         no-undef
51. [Backend lint] 26:1   warning  `../models/runtimeAnnouncement.js` import should occur before import of `../models/sequelizeClient.js`                                                                                               import/order
52. [Backend lint] 26:8   warning  Using exported name 'RuntimeAnnouncement' as identifier for default import                                                                                                        import/no-named-as-default
53. [Backend lint] 27:1   warning  `../utils/agencyWorkspaceAccess.js` import should occur before import of `../utils/errors.js`                                 import/order
54. [Backend lint] 3:1  warning  `../services/authService.js` import should occur before import of `../utils/location.js`  import/order
55. [Backend lint] 3:1  warning  `@opentelemetry/api` import should occur before import of `express`    import/order
56. [Backend lint] 3:1  warning  `compression` import should occur before import of `cors`      import/order
57. [Backend lint] 3:1  warning  `node:crypto` import should occur before import of `node:path`  import/order
58. [Backend lint] 3:1  warning  `node:fs` import should occur before import of `node:fs/promises`  import/order
59. [Backend lint] 3:1  warning  `stream/promises` import should occur after import of `process`  import/order
60. [Backend lint] 3:1  warning  There should be at least one empty line between import groups  import/order

## Group 3 (Entries 61-90)
61. [Backend lint] 30:1  warning  `../models/volunteeringModels.js` import should occur before import of `../models/volunteerApplicant.js`                                                                                             import/order
62. [Backend lint] 30:8   warning  Using exported name 'VolunteerApplicant' as identifier for default import                                                                                                        import/no-named-as-default
63. [Backend lint] 31:1   warning  `../models/volunteerAssignment.js` import should occur before import of `../models/volunteeringModels.js`                                                                                             import/order
64. [Backend lint] 31:8   warning  Using exported name 'VolunteerAssignment' as identifier for default import                                                                                                        import/no-named-as-default
65. [Backend lint] 32:1   warning  `../models/volunteerProgram.js` import should occur before import of `../models/volunteeringModels.js`                                                                                             import/order
66. [Backend lint] 32:8   warning  Using exported name 'VolunteerProgram' as identifier for default import                                                                                                        import/no-named-as-default
67. [Backend lint] 33:1   warning  `../models/volunteerTeam.js` import should occur before import of `../models/volunteeringModels.js`                                                                                             import/order
68. [Backend lint] 33:8   warning  Using exported name 'VolunteerTeam' as identifier for default import                                                                                                        import/no-named-as-default
69. [Backend lint] 34:1   warning  `../models/volunteerTimeslot.js` import should occur before import of `../models/volunteeringModels.js`                                                                                             import/order
70. [Backend lint] 34:8   warning  Using exported name 'VolunteerTimeslot' as identifier for default import                                                                                                        import/no-named-as-default
71. [Backend lint] 35:1   warning  `../models/volunteerVolunteer.js` import should occur before import of `../models/volunteeringModels.js`                                                                                             import/order
72. [Backend lint] 35:8   warning  Using exported name 'VolunteerVolunteer' as identifier for default import                                                                                                        import/no-named-as-default
73. [Backend lint] 36:1   warning  `../models/volunteeringDashboard.js` import should occur before import of `../models/volunteeringModels.js`                                                                                             import/order
74. [Backend lint] 36:8   warning  Using exported name 'VolunteeringDashboard' as identifier for default import                                                                                                        import/no-named-as-default
75. [Backend lint] 37:1   warning  `../models/volunteeringEngagement.js` import should occur before import of `../models/volunteeringModels.js`                                                                                             import/order
76. [Backend lint] 37:8   warning  Using exported name 'VolunteeringEngagement' as identifier for default import                                                                                                        import/no-named-as-default
77. [Backend lint] 38:1   warning  `../models/volunteeringEvent.js` import should occur before import of `../models/volunteeringModels.js`                                                                                             import/order
78. [Backend lint] 38:8   warning  Using exported name 'VolunteeringEvent' as identifier for default import                                                                                                        import/no-named-as-default
79. [Backend lint] 39:1   warning  `../models/volunteeringGroup.js` import should occur before import of `../models/volunteeringModels.js`                                                                                             import/order
80. [Backend lint] 39:8   warning  Using exported name 'VolunteeringGroup' as identifier for default import                                                                                                        import/no-named-as-default
81. [Backend lint] 4:1  warning  `../services/agencyEscrowService.js` import should occur before import of `../services/platformSettingsService.js`            import/order
82. [Backend lint] 40:1   warning  `../models/volunteeringImpact.js` import should occur before import of `../models/volunteeringModels.js`                                                                                             import/order
83. [Backend lint] 40:8   warning  Using exported name 'VolunteeringImpact' as identifier for default import                                                                                                        import/no-named-as-default
84. [Backend lint] 41:1   warning  `../models/volunteeringInsight.js` import should occur before import of `../models/volunteeringModels.js`                                                                                             import/order
85. [Backend lint] 41:8   warning  Using exported name 'VolunteeringInsight' as identifier for default import                                                                                                        import/no-named-as-default
86. [Backend lint] 42:1   warning  `../models/volunteeringMission.js` import should occur before import of `../models/volunteeringModels.js`                                                                                             import/order
87. [Backend lint] 42:8   warning  Using exported name 'VolunteeringMission' as identifier for default import                                                                                                        import/no-named-as-default
88. [Backend lint] 43:1   warning  `../models/volunteeringProgram.js` import should occur before import of `../models/volunteeringModels.js`                                                                                             import/order
89. [Backend lint] 43:8   warning  Using exported name 'VolunteeringProgram' as identifier for default import                                                                                                        import/no-named-as-default
90. [Backend lint] 44:1   warning  `../models/volunteeringRecruitment.js` import should occur before import of `../models/volunteeringModels.js`                                                                                             import/order

## Group 4 (Entries 91-120)
91. [Backend lint] 44:8   warning  Using exported name 'VolunteeringRecruitment' as identifier for default import                                                                                                        import/no-named-as-default
92. [Backend lint] 45:1   warning  `../models/volunteeringSchedule.js` import should occur before import of `../models/volunteeringModels.js`                                                                                             import/order
93. [Backend lint] 45:8   warning  Using exported name 'VolunteeringSchedule' as identifier for default import                                                                                                        import/no-named-as-default
94. [Backend lint] 46:1   warning  `../models/volunteeringVolunteer.js` import should occur before import of `../models/volunteeringModels.js`                                                                                             import/order
95. [Backend lint] 46:8   warning  Using exported name 'VolunteeringVolunteer' as identifier for default import                                                                                                        import/no-named-as-default
96. [Backend lint] 47:1   warning  `../models/volunteeringWorkspace.js` import should occur before import of `../models/volunteeringModels.js`                                                                                             import/order
97. [Backend lint] 47:8   warning  Using exported name 'VolunteeringWorkspace' as identifier for default import                                                                                                        import/no-named-as-default
98. [Backend lint] 48:1   warning  `../models/volunteeringWorkspaceInvitation.js` import should occur before import of `../models/volunteeringModels.js`                                                                                             import/order
99. [Backend lint] 48:8   warning  Using exported name 'VolunteeringWorkspaceInvitation' as identifier for default import                                                                                                        import/no-named-as-default
100. [Backend lint] 49:1   warning  `../models/volunteeringWorkspaceMember.js` import should occur before import of `../models/volunteeringModels.js`                                                                                             import/order
101. [Backend lint] 49:8   warning  Using exported name 'VolunteeringWorkspaceMember' as identifier for default import                                                                                                        import/no-named-as-default
102. [Backend lint] 5:1  warning  `../services/agencyIntegrationService.js` import should occur before import of `../services/platformSettingsService.js`            import/order
103. [Backend lint] 50:1   warning  `../models/volunteeringWorkspaceRole.js` import should occur before import of `../models/volunteeringModels.js`                                                                                             import/order
104. [Backend lint] 50:8   warning  Using exported name 'VolunteeringWorkspaceRole' as identifier for default import                                                                                                        import/no-named-as-default
105. [Backend lint] 51:1   warning  `../models/volunteeringWorkspaceTeam.js` import should occur before import of `../models/volunteeringModels.js`                                                                                             import/order
106. [Backend lint] 51:8   warning  Using exported name 'VolunteeringWorkspaceTeam' as identifier for default import                                                                                                        import/no-named-as-default
107. [Backend lint] 52:1   warning  `../models/volunteeringWorkspaceTimeline.js` import should occur before import of `../models/volunteeringModels.js`                                                                                             import/order
108. [Backend lint] 52:8   warning  Using exported name 'VolunteeringWorkspaceTimeline' as identifier for default import                                                                                                        import/no-named-as-default
109. [Backend lint] 53:1   warning  `../models/volunteeringWorkspaceVisitor.js` import should occur before import of `../models/volunteeringModels.js`                                                                                             import/order
110. [Backend lint] 53:8   warning  Using exported name 'VolunteeringWorkspaceVisitor' as identifier for default import                                                                                                        import/no-named-as-default
111. [Backend lint] 54:1   warning  `../models/volunteeringWorkspaceWorkflow.js` import should occur before import of `../models/volunteeringModels.js`                                                                                             import/order
112. [Backend lint] 54:8   warning  Using exported name 'VolunteeringWorkspaceWorkflow' as identifier for default import                                                                                                        import/no-named-as-default
113. [Backend lint] 55:1   warning  `../models/volunteeringWorkspaceWorkflowStep.js` import should occur before import of `../models/volunteeringModels.js`                                                                                             import/order
114. [Backend lint] 55:8   warning  Using exported name 'VolunteeringWorkspaceWorkflowStep' as identifier for default import                                                                                                        import/no-named-as-default
115. [Backend lint] 56:1   warning  `../models/volunteeringWorkspaceWorkflowTransition.js` import should occur before import of `../models/volunteeringModels.js`                                                                                             import/order
116. [Backend lint] 56:8   warning  Using exported name 'VolunteeringWorkspaceWorkflowTransition' as identifier for default import                                                                                                        import/no-named-as-default
117. [Backend lint] 57:1   warning  `../models/volunteeringWorkspaceWorkflowTransitionRule.js` import should occur before import of `../models/volunteeringModels.js`                                                                                             import/order
118. [Backend lint] 57:8   warning  Using exported name 'VolunteeringWorkspaceWorkflowTransitionRule' as identifier for default import                                                                                                        import/no-named-as-default
119. [Backend lint] 58:1   warning  `../models/volunteeringWorkspaceWorkflowTransitionStep.js` import should occur before import of `../models/volunteeringModels.js`                                                                                             import/order
120. [Backend lint] 58:8   warning  Using exported name 'VolunteeringWorkspaceWorkflowTransitionStep' as identifier for default import                                                                                                        import/no-named-as-default

## Group 5 (Entries 121-150)
121. [Backend lint] 9:1   warning  `../models/runtimeSecurityAuditEvent.js` import should occur before import of `../models/sequelizeClient.js`                                                                                         import/order
122. [Backend lint] 9:1  warning  `./middleware/rateLimiter.js` import should occur before import of `./routes/index.js`     import/order
123. [Backend lint] 9:8  warning  Using exported name 'createInstrumentedRateLimiter' as identifier for default import     import/no-named-as-default
124. [Backend lint] 92:8  warning  Prefer named exports           import/no-default-export
125. [Backend lint] 99:8  warning  Prefer named exports                                   import/no-default-export
126. [Backend schema CI] Command exited with code 1
127. [Backend schema CI] Contract version assertion failed Error: Contract manifest reports pending changes. Bump the contract version and update the changelog before merging.
128. [Backend tests] (Use `node --trace-warnings ...` to show where the warning was created)
129. [Backend tests] ● careerDocumentController › rejects requests missing a numeric user id
130. [Backend tests] Command exited with code 1
131. [Backend tests] SyntaxError: The requested module '../models/index.js' does not provide an export named 'PROJECT_MILESTONE_STATUSES'
132. [Backend tests] Test Suites: 1 failed, 1 passed, 2 of 122 total
133. [Backend tests] Tests:       44 failed, 26 passed, 70 total
134. [Flutter melos verify] spawn melos ENOENT
135. [Frontend build] [vite:esbuild] Transform failed with 1 error:
136. [Frontend build] /workspace/Nodejs-Gigvora/gigvora-frontend-reactjs/src/pages/dashboards/FreelancerPipelinePage.jsx:346:25: ERROR: Syntax error "`"
137. [Frontend build] Command exited with code 1
138. [Frontend build] error during build:
139. [Frontend build] Syntax error "`"
140. [Frontend build] x Build failed in 16.13s
141. [Frontend lint] 11:1   error  'vi' is not defined        no-undef
142. [Frontend lint] 110:9  warning  The 'memberships' logical expression could make the dependencies of useMemo Hook (at line 195) change on every render. Move it inside the useMemo callback. Alternatively, wrap the initialization of 'memberships' in its own useMemo() Hook  react-hooks/exhaustive-deps
143. [Frontend lint] 111:9  warning  The 'workflows' logical expression could make the dependencies of useMemo Hook (at line 195) change on every render. Move it inside the useMemo callback. Alternatively, wrap the initialization of 'workflows' in its own useMemo() Hook      react-hooks/exhaustive-deps
144. [Frontend lint] 112:9  warning  The 'notices' logical expression could make the dependencies of useMemo Hook (at line 195) change on every render. Move it inside the useMemo callback. Alternatively, wrap the initialization of 'notices' in its own useMemo() Hook          react-hooks/exhaustive-deps
145. [Frontend lint] 120:11  error  'controller' is assigned a value but never used  no-unused-vars
146. [Frontend lint] 13:1   error  'describe' is not defined  no-undef
147. [Frontend lint] 14:3   error  'it' is not defined        no-undef
148. [Frontend lint] 191:5  warning  React Hook useMemo has an unnecessary dependency: 'acknowledgeGigChatMessage'. Either exclude it or remove the dependency array. Outer scope values like 'acknowledgeGigChatMessage' aren't valid dependencies because mutating them doesn't re-render the component  react-hooks/exhaustive-deps
149. [Frontend lint] 2:10  error  'afterEach' is defined but never used  no-unused-vars
150. [Frontend lint] 29:5   error  'expect' is not defined    no-undef

## Group 6 (Entries 151-164)
151. [Frontend lint] 3:1  error  'describe' is not defined  no-undef
152. [Frontend lint] 356:49  error  'tag' is assigned a value but never used            no-unused-vars
153. [Frontend lint] 39:19  error  '_ignoredParams' is assigned a value but never used  no-unused-vars
154. [Frontend lint] 4:3  error  'it' is not defined        no-undef
155. [Frontend lint] 4:3  error  Unnecessary try/catch wrapper  no-useless-catch
156. [Frontend lint] 5:3  error  'BriefcaseIcon' is defined but never used  no-unused-vars
157. [Frontend lint] 5:5  error  'expect' is not defined    no-undef
158. [Frontend lint] 96:9  warning  The 'blueprints' logical expression could make the dependencies of useMemo Hook (at line 173) change on every render. Move it inside the useMemo callback. Alternatively, wrap the initialization of 'blueprints' in its own useMemo() Hook  react-hooks/exhaustive-deps
159. [Frontend lint] 98:3  error  'afterEach' is not defined  no-undef
160. [Frontend lint] 99:3   error  'includeShifts' is assigned a value but never used  no-unused-vars
161. [Frontend lint] Command exited with code 1
162. [Frontend test: src/components/__tests__/WorkspaceBudgetManager.test.jsx] Command exited with code 1
163. [Frontend test: src/components/__tests__/WorkspaceManagersModal.test.jsx] Command exited with code 1
164. [Frontend test: src/pages/__tests__/Group103Pages.test.jsx] Command exited with code 1
