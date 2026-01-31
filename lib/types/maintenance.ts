// Maintenance planning status
// "unplanned" = date set but not yet actively planned/contacted (cannot be assigned to technician)
// "not_answered" = contacted by mail but no response yet (can be assigned to technician)
// "contacted" = customer has been contacted and responded
// "planned" = appointment is confirmed and planned
export type MaintenanceStatus = "unplanned" | "not_answered" | "contacted" | "planned";

// Maintenance task
export interface MaintenanceTask {
  id: string;
  contactPerson: string;
  location: string;
  phoneNumber: string;
  email: string;
  scheduledDate: Date;
  maintenanceStatus: MaintenanceStatus;
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

// Calendar layout mode
export type CalendarViewMode = "columns" | "rows";
