SELECT 
    p.id,
    p.role,
    p.display_name,
    p.org_id,
    o.name as org_name
FROM profiles p
LEFT JOIN organizations o ON o.id = p.org_id
WHERE p.role IN ('company', 'admin')
ORDER BY p.created_at DESC;

SELECT id, slug, name 
FROM organizations 
WHERE slug = 'sasol-chemicals-la';

UPDATE profiles
SET org_id = (
    SELECT id FROM organizations WHERE slug = 'sasol-chemicals-la' LIMIT 1
),
    updated_at = NOW()
WHERE role IN ('company', 'admin')
  AND org_id IS NULL;

SELECT 
    p.id,
    p.role,
    p.display_name,
    p.org_id,
    o.name as org_name,
    o.slug as org_slug
FROM profiles p
LEFT JOIN organizations o ON o.id = p.org_id
WHERE p.role IN ('company', 'admin')
ORDER BY p.created_at DESC;

