class CalendarTimeZoneOption {
  const CalendarTimeZoneOption(this.identifier, this.label);

  final String identifier;
  final String label;
}

const List<CalendarTimeZoneOption> supportedCalendarTimeZones = [
  CalendarTimeZoneOption('UTC', 'UTC'),
  CalendarTimeZoneOption('America/New_York', 'America/New_York (UTC-05:00)'),
  CalendarTimeZoneOption('America/Los_Angeles', 'America/Los_Angeles (UTC-08:00)'),
  CalendarTimeZoneOption('Europe/London', 'Europe/London (UTC+00:00)'),
  CalendarTimeZoneOption('Europe/Berlin', 'Europe/Berlin (UTC+01:00)'),
  CalendarTimeZoneOption('Asia/Singapore', 'Asia/Singapore (UTC+08:00)'),
  CalendarTimeZoneOption('Asia/Tokyo', 'Asia/Tokyo (UTC+09:00)'),
  CalendarTimeZoneOption('Australia/Sydney', 'Australia/Sydney (UTC+10:00)'),
];
