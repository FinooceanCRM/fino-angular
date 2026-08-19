# Notifications Audit

Overview of notifications, emails, alerts and activity logs.

Notifications
- NotificationService is used in LeadService to notify stakeholders on lead creation, assignment and status changes (see [backend/app/Services/LeadService.php](/C:/fino-angular/fino-angular/backend/app/Services/LeadService.php)).
- NotificationController exists and routes notifications endpoints (see [backend/routes/api.php](/C:/fino-angular/fino-angular/backend/routes/api.php)).

Emails
- Email notification mechanism likely implemented via NotificationService; search for mail channel usage in Notifications classes under app/Notifications.

Alerts & Activity logs
- Application uses Log::info and Log::error in LeadController during creation to record success/failure traces. Activity audit for leads is captured via status history and assignment records stored in dedicated tables.

Recommendations
- Verify NotificationService implementation to confirm channels (email, in-app, SMS) and that users' preferences (email_notifications & sms_notifications on User) are honored.

References
- [backend/app/Services/NotificationService.php](/C:/fino-angular/fino-angular/backend/app/Services/NotificationService.php) (inspect implementation)
- [backend/app/Services/LeadService.php](/C:/fino-angular/fino-angular/backend/app/Services/LeadService.php) (notification usage)
- [backend/app/Models/Notification.php](/C:/fino-angular/fino-angular/backend/app/Models/Notification.php) (if present)
