# Gigvora Mobile (Flutter)

The Gigvora Flutter application mirrors the combined freelance marketplace and professional network experience for mobile users. It includes authentication flows, timeline, explorer search, and marketplace browsing aligned with the web platform.

## Project Overview

- **Tech stack**: Flutter, Riverpod state management, GoRouter navigation, Google Fonts (Inter).
- **Screens**: Splash, onboarding, login, registration, feed, explorer search, jobs, gigs, projects, launchpad, volunteering, groups, profile, admin login.
- **Design**: Dark aesthetic with teal accents matching the Gigvora brand.

## Getting Started

1. Ensure Flutter SDK 3.2+ is installed.
2. Install dependencies:
   ```bash
   flutter pub get
   ```
3. Run the app:
   ```bash
   flutter run
   ```

## Directory Structure

- `lib/main.dart` – Entry point configuring theme and routes.
- `lib/router/app_router.dart` – Centralized route definitions with GoRouter.
- `lib/features/*` – Feature modules (auth, feed, explorer, marketplace, profile, admin).
- `assets/images/` – Placeholder directory for future imagery and logos.

This scaffold provides a production-ready starting point for extending the Gigvora mobile experience in tandem with the Node.js backend and React web frontend.
