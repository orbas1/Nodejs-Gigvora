# Pages Inventory – Web Application Version 1.00

| Route | Purpose | Key Components | Primary Actions |
| --- | --- | --- | --- |
| `/` | Marketing homepage | HeroCanvas, FeatureGrid, MetricRow, OpportunityHighlights, Testimonials, CTA Band | Join the network, Browse opportunities |
| `/explorer` | Unified search & discovery | SearchBar, ChipToggleRow, ResultGrid, DataStatus, FilterDrawer | Search, Filter, Save, Share |
| `/jobs` | Jobs vertical list | HeroBand, FilterRow, OpportunityCardList, InsightsSidebar | Apply, Save |
| `/gigs` | Gig vertical list | Shared with jobs but emphasises `Gig` meta chips | Pitch, Save |
| `/projects` | Project workspace listings | OpportunityCards, TabSwitcher (Active/Archived/Templates), QuickActionBar | Join project, Bookmark |
| `/launchpad` | Program tracks | Hero, TrackCards, SuccessStories | View track, Register |
| `/volunteering` | Volunteer missions | MissionCards, ImpactStats, FilterStack | Apply, Share |
| `/feed` | Social/community feed | FeedComposer, PostCard, TrendingSidebar | Share update, Engage |
| `/groups` | Guild directory | GroupCards, FilterChips, DetailDrawer | Join group, Invite |
| `/connections` | Network management | SuggestedPeopleList, PendingInvites, ImportContactsCTA | Connect, Approve |
| `/profile/:username` | Profile view | ProfileHeader, SummaryPanels, ExperienceTimeline, PortfolioGrid | Message, Invite, Share profile |
| `/dashboard` | Auth landing (user/provider) | MetricCards, TaskList, LaunchpadProgress, NotificationFeed | View tasks, Complete steps |
| `/dashboard/provider` | Provider workspace | PipelineSummary, QuickActions, ComplianceBanner | Post opportunity, Review applications |
| `/settings` | Global settings | TabNavigation, AccountForm, NotificationsForm, BillingPanel | Update settings, Enable MFA |
| `/auth/login` | User login | LoginCard, SocialButtons, SupportLinks | Login |
| `/auth/register` | Registration | Stepper, FormSections, ProgressBar | Next step, Submit |
| `/auth/admin` | Admin login | SecurityNotice, LoginCard | Login |
| `/resources` | Knowledge base | ResourceCardGrid, Filters, SearchInput | Download, View |
| `/support` | Help centre | FAQAccordion, ContactCard, TicketForm | Submit ticket |
| `/legal/privacy` | Legal docs | RichTextContent | Scroll, Download |

## Additional Modals & Drawers
- `OpportunityApplyDrawer`
- `FilterDrawer`
- `SupportDrawer`
- `MobileNavDrawer`
- `ProfileShareModal`
