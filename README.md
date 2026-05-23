📝 Project Overview
The DevDynamos Blood Bank Application is a full-stack system designed to efficiently manage blood donations, inventory, and emergencies. It serves three main types of users: Donors, Medical Staff, and Administrators.

Frontend: React (built with Vite), styled using Tailwind CSS.
Backend: Python with Django, using SQLite3 as the database.
🚀 Recently Completed Work (Admin Panel)
Based on the implementation summaries, the most recent focus has been on completing the Doctor Management System within the Admin Dashboard. The following features were successfully implemented:

Add Doctor: Fully functional form with validation, error handling, and API integration.
Edit Doctor: Pre-fills existing doctor data (disabling sensitive fields like email/username) and allows updating information (name, phone, specialization, hospital).
Data Table Enhancements:
Pagination: Added functionality to navigate through lists (e.g., 10 doctors per page).
Sorting: Added abilities to sort by Name, Email, and Date Created (Ascending/Descending).
Search/Filtering: Functional search bars to quickly lookup medical officers.
🔑 Key Features of the System
1. Donor Portal

Dashboard & Eligibility: Personalized dashboard showing donation statistics, history, status badges, and an interactive eligibility quiz.
Appointments: Camp/Hospital locator with a map, scheduling donations, and generating QR code confirmations.
Certificates: Printable digital certificates for completed donations.
2. Medical Staff (Doctor) Portal

Analytics & Inventory: Dashboard for tracking donor metrics and inventory filters.
Donation Records: Donor verification, entering vitals, and recording specific blood bag information after a donation.
3. Administrator & Camp Host Portal

User Management: Approving and managing Medical Officers and Camp Hosts.
Camp & Volunteer Tracking: Organizing blood donation camps and managing assigned volunteers.
Stock & Requests: Handling blood component requests and managing stock transfers between facilities.
4. Special Technical Features

Location-based Matching: Matches donors for emergencies using latitude/longitude mapping.
Automated Notifications: Triggers SMS/Email system notifications for critical updates and emergencies.
Role-Based Access Control: Secure routing (PrivateRoute, RoleRoute) to ensure donors, doctors, and admins only see their respective interfaces.
