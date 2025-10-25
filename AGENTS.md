# Error Sweep Report

## Group 1 (Entries 1-30)
1. Backend discovery service tests fail because `searchIndexService` no longer exports `determineDurationCategory`, causing module import errors in `group29Services.test.js`. 
2. `projectWorkspaceService.js` triggers a syntax error when importing project gig management models due to unsupported export patterns under Jest's Babel transform. 
3. `companyController` suites cannot load `projectWorkspaceService.js` because of the same ESM import failure, halting dashboard tests. 
4. `companyEscrowController` test execution stops on the identical `projectWorkspaceService.js` parse error while preparing escrow scenarios. 
5. `companyJobManagementController` suites also abort on the `projectWorkspaceService.js` module syntax issue, preventing job workflow validation. 
6. `adminMessagingService` mocks fail with `Cannot find module './messagingService.js'`, leaving messaging admin tests unresolved. 
7. `adminProfileService` cannot mock `../domains/serviceCatalog.js`, so profile creation coverage does not run. 
8. `adminProjectManagementService` misses `../models/projectGigManagementModels.js`, blocking admin project summary checks. 
9. `adminSpeedNetworkingService` looks for `SpeedNetworkingParticipant` export in `models/index.js` and aborts when it is missing. 
10. `adminUserService` expects a `domainRegistry` export from `models/index.js`, causing metadata tests to throw. 
11. `adminWalletService` cannot resolve `../utils/errors.js`, breaking wallet account aggregation coverage. 
12. `agencyAdService` references the missing `AD_OBJECTIVES` constant export, so campaign listing tests crash. 
13. `agencyAiService` calls `template.toPublicObject()` on plain objects, producing a runtime `TypeError`. 
14. `agencyClientKanbanService` mocks fail because `../models/projectGigManagementModels.js` is unavailable in the testing context. 
15. `agencyCreationStudioService` attempts to mock `../utils/cache.js` and exits when the module cannot be located. 
16. `agencyDashboardService` cannot import the shared cache utility, preventing dashboard caching tests from running. 
17. `agencyEscrowService` also lacks `../utils/errors.js`, so escrow sanitisation coverage fails immediately. 
18. `messagingService` assignment tests blow up because `models/index.js` omits the `RuntimeSecurityAuditEvent` export required for audit logging. 
19. `mentorshipService` integration suites expect a `MentorAdCampaign` export from `models/index.js`; without it, all mission-control integration tests crash. 
20. `agencyIntegrationService` audit logging assertion fails—`WorkspaceIntegrationAuditLog.create` receives an undefined `integrationId`. 
21. Calendar service tests cannot mock `calendarProviderRegistry.js`, preventing provider coverage from running. 
22. `companyDashboardService.partnerships` needs a `VolunteerApplication` export from `models/index.js`, causing the suite to abort. 
23. `freelancerAgencyService` setup wipes `global.__mockSequelizeModels` when it is undefined, throwing `TypeError: Cannot convert undefined or null to object`. 
24. Authentication service coverage halts because `models/index.js` no longer exports the expected `domainRegistry`. 
25. The `20241205130000-site-homepage-experience` migration up-sequence fails—`queryInterface` is undefined during the seed bootstrap. 
26. The same migration cannot sanitise existing homepage records because `queryInterface.bulkInsert` is called on an undefined reference. 
27. Down migrations for the homepage experience also reference `queryInterface` without initialising it. 
28. Affiliate settings service mocks cannot resolve `../models/platformSetting.js`, so defaults and updates never run. 
29. Affiliate dashboard service tests miss the mocked `../affiliateSettingsService.js`, preventing aggregation checks. 
30. Admin two-factor service coverage cannot load `../utils/logger.js`, causing the fallback overview test to fail.

## Group 2 (Entries 31-60)
31. Admin volunteering service expects `VOLUNTEER_ASSIGNMENT_STATUSES` from `models/index.js`, breaking volunteering insights tests. 
32. Finance insights service requires `FreelancerCostBreakdown` export and aborts when it is missing. 
33. Agency networking service depends on `NETWORKING_CONNECTION_FOLLOW_STATUSES`; without the constant export, networking suite initialisation fails. 
34. Freelancer alliance service resets `global.__mockSequelizeModels` while it is undefined, mirroring the TypeError seen in agency setup. 
35. Platform settings service cannot return environment-derived defaults because `getNested` receives string paths and calls `path.reduce`. 
36. Administrative settings updates in the same service fail for the identical `path.reduce` TypeError. 
37. Commission guardrails never assert because the update helper throws `TypeError` before the `ValidationError` expectation executes. 
38. Escrow credential validation short-circuits with the `path.reduce` TypeError instead of emitting the documented error message. 
39. Secret preservation logic also dies on the `path.reduce` TypeError, so encrypted settings coverage is absent. 
40. Audit filtering tests are blocked by the same TypeError, leaving actor/change filters unverified. 
41. Homepage defaults loader fails to decrypt settings because of the `path.reduce` TypeError. 
42. Homepage persistence updates stop on the same TypeError, so homepage mutation coverage is lost. 
43. Agency project management controller expects an `AuthorizationError` but receives `AuthenticationError` when actor ids are missing. 
44. Creating agency projects throws `AuthorizationError` for missing roles, causing controller create flows to fail tests. 
45. Project tasks tab vitest cannot find a form control labelled “Description,” so task creation UI coverage aborts. 
46. Workspace managers modal dialog test spies record three invocations instead of one, flagging duplicate close handling. 
47. Jobs helper tests under `Group103Pages` call `formatPercent`, which is undefined in the current module context. 
48. Sequelize emits warnings about TEXT column options under SQLite, indicating schema portability issues during bootstrap. 
49. Node reports the `sqlite::memory` connection string as deprecated, signalling required runtime adjustments. 
50. React warns that `AgencyCreationStudioWizardSection` updates occur outside `act()`, exposing asynchronous state handling gaps. 
51. `AgencyCrmLeadPipelineSection` triggers the same `act()` warning, showing unwrapped state changes in CRM coverage. 
52. `AgencyInboxSection` reports both nested `<button>` elements and missing `act()` wrappers, pointing to markup and state issues. 
53. `AgencyPaymentsManagementSection` repeatedly mutates state outside `act()`, highlighting payments dashboard test gaps. 
54. `GigCreationSection` in agency dashboards spams `act()` warnings, signalling asynchronous creation flows without proper wrapping. 
55. `GigSubmissionsSection` produces persistent `act()` warnings during submission management tests. 
56. `GigTimelineSection` floods vitest logs with `act()` warnings while logging timeline events. 
57. `WorkspaceBudgetManager` emits repeated `act()` warnings when normalising budgets. 
58. `WorkspaceConversationCenter` updates threads outside `act()`, producing continuous warnings. 
59. `WorkspaceFileManager` tests mutate file state without `act()`, generating repeated warnings. 
60. `WorkspaceRoleManager` warns about future removal of `defaultProps` and missing `act()` wrappers, indicating pending React API updates.
