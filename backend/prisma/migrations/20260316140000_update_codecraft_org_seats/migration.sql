-- Update all organizations owned by FREE_ACCESS_EMAILS users to have max seats
-- This covers the CodeCraftGenZ org specifically
UPDATE organizations o
JOIN organization_members om ON om.org_id = o.id AND om.role = 'OWNER'
JOIN users u ON u.id = om.user_id
SET o.max_members = 200
WHERE u.email IN ('codecraftgenz@gmail.com', 'ricardocoradini97@gmail.com');
