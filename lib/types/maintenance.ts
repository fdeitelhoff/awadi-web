// Maintenance scheduling status types
export type SchedulingStatus =
  | "not_contacted"
  | "email_sent"
  | "email_confirmed"
  | "phone_called"
  | "confirmed"
  | "cancelled";

// Traffic light confirmation status
export type ConfirmationStatus = "pending" | "tentative" | "confirmed" | "cancelled";

// Maintenance task
export interface MaintenanceTask {
  id: string;
  contactPerson: string;
  location: string;
  phoneNumber: string;
  email: string;
  scheduledDate: Date;
  schedulingStatus: SchedulingStatus;
  confirmationStatus: ConfirmationStatus;
  technicianId?: string;
  technicianName?: string;
  notes?: string;
}

// Service ticket/order
export interface ServiceTicket {
  id: string;
  title: string;
  contactPerson: string;
  location: string;
  phoneNumber: string;
  email: string;
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: Date;
  description?: string;
}

// Technician
export interface Technician {
  id: string;
  name: string;
  color: string;
  initials: string;
}

// Calendar view options
export type CalendarViewRange = "1week" | "2weeks" | "3weeks" | "4weeks";
