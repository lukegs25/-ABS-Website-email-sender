# ABS Website Feature Roadmap

Roadmap for the features discussed: calendar, attendance, member logins/dashboards, admin stars, and job board.

---

## 1. Calendar (with Reed)

**Goal:** Get a good calendar and update it weekly.

**Tasks:**
- [ ] Coordinate with Reed on calendar source (Google Calendar, Calendly, custom?)
- [ ] Add a calendar component to the website (e.g., embed Google Calendar, or build with FullCalendar / React Big Calendar)
- [ ] Create admin interface to manage calendar events
- [ ] Set up weekly update process (manual or automated sync)
- [ ] Add calendar page/route to the site

**Tech options:** Google Calendar embed, FullCalendar, React Big Calendar, or Supabase `events` table + custom UI.

---

## 2. Member Logins & Attendance Tracking

**Goal:** Members can log in, show what they’ve done, and admins can track attendance.

**Tasks:**
- [ ] Design data model:
  - `users` or `members` (extends Supabase Auth or separate table)
  - `events` / `bootcamps` / `meetings`
  - `attendance` (member_id, event_id, attended_at)
  - `member_achievements` or `activity_log` (what they’ve done)
- [ ] Implement Supabase Auth for member signup/login
- [ ] Build attendance check-in flow (QR code, link, or admin manual mark)
- [ ] Admin UI to view attendance by event and by member
- [ ] Member profile that shows their attendance and activity

**Tech:** Supabase Auth, `events` and `attendance` tables, Next.js auth middleware.

---

## 3. Member Dashboard

**Goal:** Dashboard for bootcamps, speakers, subgroups, officer titles, learning tracking, and PDF export.

**Tasks:**
- [ ] Define data model:
  - `bootcamps` (id, name, date, description, etc.)
  - `speakers` (id, name, bio, events)
  - `subgroups` (e.g., by interest or role)
  - `officer_roles` (president, VP, etc.)
  - `member_learning` or `progress` (member_id, topic, completed_at)
- [ ] Build member dashboard that shows:
  - Bootcamps attended
  - Speakers they’ve seen
  - Subgroup membership
  - Officer role (if applicable)
  - Learning progress
- [ ] Add “Download PDF” for summary of activities
- [ ] Restrict visibility based on login and role

**Tech:** Next.js dashboard routes, Supabase for data, PDF generation (e.g., jsPDF, react-pdf, or server-side).

---

## 4. Admin “Stars” / Recognition

**Goal:** Admins can give stars to members for AI tool proficiency.

**Tasks:**
- [ ] Add `member_stars` (or similar) table: member_id, awarded_by, tool/skill, note, created_at
- [ ] Admin UI to award stars and select tool/skill
- [ ] Show stars on member profiles/dashboard
- [ ] Optional: leaderboard or “featured members” section

**Tech:** New Supabase table, admin-only API routes, dashboard updates.

---

## 5. Job Board

**Goal:** Companies can post jobs on the site.

**Tasks:**
- [ ] Data model: `jobs` (company, title, description, link, posted_at, audience_id?, etc.)
- [ ] Public job board page
- [ ] Company submission flow (form + optional approval)
- [ ] Admin UI to approve/edit/remove jobs
- [ ] Optional: email notifications when new jobs are posted (use existing Resend setup)

**Tech:** Supabase `jobs` table, Next.js job board page, form + API for submissions.

---

## Suggested Implementation Order

| Phase | Focus                         | Why first                                      |
|-------|-------------------------------|-------------------------------------------------|
| 1     | Calendar                      | Low complexity, high visibility, uses Reed’s input |
| 2     | Member logins + attendance    | Foundation for dashboards and stars             |
| 3     | Member dashboard              | Builds on attendance and roles                  |
| 4     | Admin stars                   | Depends on members and dashboards               |
| 5     | Job board                     | Independent feature, can be done in parallel    |

---

## Database Schema Sketch

```sql
-- New tables you'll likely need
CREATE TABLE members (...);           -- extends auth.users or links to it
CREATE TABLE events (...);            -- bootcamps, meetings, etc.
CREATE TABLE attendance (member_id, event_id, attended_at);
CREATE TABLE bootcamps (...);
CREATE TABLE speakers (...);
CREATE TABLE subgroups (...);
CREATE TABLE officer_roles (member_id, role, start_date, end_date);
CREATE TABLE member_learning (member_id, topic, completed_at);
CREATE TABLE member_stars (member_id, awarded_by, skill, note, created_at);
CREATE TABLE jobs (company, title, description, url, posted_at, status);
```

---

## Next Steps

1. **Calendar:** Talk to Reed, choose a calendar tool, add it to the site.
2. **Backups:** Complete setup in `SUPABASE_BACKUP_GUIDE.md`.
3. **Logins & attendance:** Pick one event type to pilot (e.g., bootcamps), then design and build from there.
