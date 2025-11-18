-- ================================================
-- DEBUG QUERIES FOR CHECKING SUBSCRIBER STATUS
-- Run these in your Supabase SQL Editor
-- ================================================

-- Query 1: Check if deanbean@student.byu.edu exists and what they're subscribed to
-- ================================================
SELECT 
    ns.email,
    ns.audience_id,
    a.name as audience_name,
    ns.major,
    ns.is_student,
    ns.other_text,
    ns.created_at as subscribed_at
FROM new_subscribers ns
LEFT JOIN audiences a ON ns.audience_id = a.id
WHERE ns.email = 'deanbean@student.byu.edu'
ORDER BY ns.audience_id;

-- Expected result: Will show all audiences this email is subscribed to
-- If empty = email not in database at all


-- Query 2: List ALL audiences in the system
-- ================================================
SELECT 
    id,
    name,
    Resend_ID,
    (SELECT COUNT(*) FROM new_subscribers WHERE audience_id = a.id) as subscriber_count
FROM audiences a
ORDER BY id;

-- This shows all available audiences and their subscriber counts


-- Query 3: Check for Greg Michaelsen or event-related audiences
-- ================================================
SELECT 
    id,
    name,
    Resend_ID,
    (SELECT COUNT(*) FROM new_subscribers WHERE audience_id = a.id) as subscriber_count
FROM audiences a
WHERE 
    LOWER(name) LIKE '%greg%' 
    OR LOWER(name) LIKE '%michaelsen%'
    OR LOWER(name) LIKE '%event%'
ORDER BY id;

-- This shows any audiences with "Greg", "Michaelsen", or "Event" in the name


-- Query 4: Check if deanbean is subscribed to ANY event audiences
-- ================================================
SELECT 
    ns.email,
    ns.audience_id,
    a.name as audience_name,
    ns.created_at as subscribed_at
FROM new_subscribers ns
LEFT JOIN audiences a ON ns.audience_id = a.id
WHERE 
    ns.email = 'deanbean@student.byu.edu'
    AND (
        LOWER(a.name) LIKE '%greg%' 
        OR LOWER(a.name) LIKE '%michaelsen%'
        OR LOWER(a.name) LIKE '%event%'
    );

-- This specifically checks if deanbean is subscribed to Greg Michaelsen/event audiences
-- If empty = they are NOT subscribed to any event-related audiences


-- Query 5: Who IS subscribed to Greg Michaelsen/event audiences?
-- ================================================
SELECT 
    a.name as audience_name,
    COUNT(ns.email) as subscriber_count,
    STRING_AGG(ns.email, ', ') as sample_emails
FROM audiences a
LEFT JOIN new_subscribers ns ON ns.audience_id = a.id
WHERE 
    LOWER(a.name) LIKE '%greg%' 
    OR LOWER(a.name) LIKE '%michaelsen%'
    OR LOWER(a.name) LIKE '%event%'
GROUP BY a.id, a.name;

-- This shows who is subscribed to event-related audiences


-- Query 6: Find the audience ID you used to send the Greg Michaelsen email
-- ================================================
-- You'll need to tell me which audience ID or name you sent to!
-- Common possibilities:
--   - Main ABS audience (ID 8)
--   - A specific event audience
-- Replace ??? with the actual audience ID below:

SELECT 
    ns.email,
    ns.major,
    ns.is_student,
    ns.created_at as subscribed_at
FROM new_subscribers ns
WHERE 
    ns.audience_id = ???  -- Replace with actual audience ID
    AND ns.email = 'deanbean@student.byu.edu';


-- ================================================
-- TROUBLESHOOTING CHECKLIST
-- ================================================

-- 1. Is deanbean@student.byu.edu in the database at all? → Run Query 1
-- 2. What audiences exist? → Run Query 2
-- 3. Is there a Greg Michaelsen specific audience? → Run Query 3
-- 4. Is deanbean subscribed to that audience? → Run Query 4
-- 5. Which audience did you actually send the email to today?
-- 6. Does that audience ID match what deanbean is subscribed to?







