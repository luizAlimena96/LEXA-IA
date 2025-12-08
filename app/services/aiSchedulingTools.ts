// AI Scheduling Tools - Function definitions for OpenAI

export const schedulingTools = [
    {
        name: "check_meeting_availability",
        description: "Check if a specific date and time is available for scheduling a meeting. Use this when the lead suggests a specific time.",
        parameters: {
            type: "object",
            properties: {
                date: {
                    type: "string",
                    description: "Date in YYYY-MM-DD format (e.g., '2025-12-10')"
                },
                time: {
                    type: "string",
                    description: "Time in HH:MM format, 24-hour (e.g., '14:00')"
                }
            },
            required: ["date", "time"]
        }
    },
    {
        name: "suggest_meeting_slots",
        description: "Suggest 3 available time slots for a meeting. Use this when the lead asks for available times or when their preferred time is not available.",
        parameters: {
            type: "object",
            properties: {
                preferredDate: {
                    type: "string",
                    description: "Optional preferred date in YYYY-MM-DD format. If not provided, will suggest slots starting from tomorrow."
                }
            }
        }
    },
    {
        name: "book_meeting",
        description: "Book a meeting at the specified date and time. Only use this after confirming availability and getting lead's confirmation.",
        parameters: {
            type: "object",
            properties: {
                date: {
                    type: "string",
                    description: "Date in YYYY-MM-DD format"
                },
                time: {
                    type: "string",
                    description: "Time in HH:MM format (24-hour)"
                },
                leadName: {
                    type: "string",
                    description: "Lead's full name"
                },
                notes: {
                    type: "string",
                    description: "Additional notes or purpose of the meeting"
                }
            },
            required: ["date", "time", "leadName"]
        }
    },
    {
        name: "reschedule_meeting",
        description: "Reschedule an existing meeting to a new date and time. Use this when the lead wants to change an existing appointment.",
        parameters: {
            type: "object",
            properties: {
                appointmentId: {
                    type: "string",
                    description: "ID of the appointment to reschedule"
                },
                newDate: {
                    type: "string",
                    description: "New date in YYYY-MM-DD format"
                },
                newTime: {
                    type: "string",
                    description: "New time in HH:MM format (24-hour)"
                }
            },
            required: ["appointmentId", "newDate", "newTime"]
        }
    },
    {
        name: "cancel_meeting",
        description: "Cancel an existing meeting. Use this when the lead wants to cancel their appointment.",
        parameters: {
            type: "object",
            properties: {
                appointmentId: {
                    type: "string",
                    description: "ID of the appointment to cancel"
                },
                reason: {
                    type: "string",
                    description: "Reason for cancellation (optional)"
                }
            },
            required: ["appointmentId"]
        }
    },
    {
        name: "list_lead_appointments",
        description: "List all appointments for the current lead. Use this when the lead asks about their scheduled meetings.",
        parameters: {
            type: "object",
            properties: {}
        }
    }
];
