// Scheduling/communication status for maintenance appointments
// unplanned   = wartungsvertraege not yet in a published tour
// not_answered = in tour, customer not yet notified (kunden_status: ausstehend)
// contacted   = email sent, no reply yet (kunden_status: email_versendet)
// planned     = customer confirmed appointment (kunden_status: bestaetigt)
export type MaintenanceStatus = "unplanned" | "not_answered" | "contacted" | "planned";

// Calendar view options
export type CalendarViewRange = "1week" | "2weeks" | "3weeks" | "4weeks";
