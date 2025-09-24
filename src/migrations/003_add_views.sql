CREATE OR REPLACE VIEW job_listings AS
SELECT 
    j.id,
    j.title,
    j.description,
    j.budget_min,
    j.budget_max,
    j.deadline,
    j.location,
    j.is_remote,
    j.created_at,
    j.updated_at,
    u.full_name AS employer_name,
    ep.company_name,
    ep.average_rating AS employer_rating,
    c.name AS category_name,
    array_agg(DISTINCT s.name) AS required_skills
FROM jobs j
JOIN employer_profiles ep ON j.employer_id = ep.id
JOIN users u ON ep.user_id = u.id
LEFT JOIN categories c ON j.category_id = c.id
LEFT JOIN job_skills js ON j.id = js.job_id
LEFT JOIN skills s ON js.skill_id = s.id
WHERE j.status = 'active'
GROUP BY j.id, u.full_name, ep.company_name, ep.average_rating, c.name;

CREATE OR REPLACE VIEW student_profiles_with_skills AS
SELECT 
    sp.id,
    sp.university,
    sp.major,
    sp.year_of_study,
    sp.student_id,
    sp.bio,
    sp.portfolio_url,
    sp.linkedin_url,
    sp.github_url,
    sp.hourly_rate,
    sp.availability_status,
    sp.total_jobs_completed,
    sp.total_earnings,
    sp.average_rating,
    u.full_name,
    u.email,
    u.avatar_url,
    array_agg(DISTINCT s.name) AS skills
FROM student_profiles sp
JOIN users u ON sp.user_id = u.id
LEFT JOIN student_skills ss ON sp.id = ss.student_id
LEFT JOIN skills s ON ss.skill_id = s.id
WHERE u.is_active = true
GROUP BY sp.id, u.full_name, u.email, u.avatar_url;