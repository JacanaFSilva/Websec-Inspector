-- Verifica quais (hostname, user_id) estão duplicados
SELECT hostname, user_id, COUNT(*) AS total
FROM domains
GROUP BY hostname, user_id
HAVING COUNT(*) > 1;

-- Reaponta os scans das linhas duplicadas para a linha mais antiga (menor id)
WITH ranked AS (
    SELECT id, hostname, user_id,
           ROW_NUMBER() OVER (PARTITION BY hostname, user_id ORDER BY id) AS rn,
           FIRST_VALUE(id) OVER (PARTITION BY hostname, user_id ORDER BY id) AS keep_id
    FROM domains
)
UPDATE scans s
SET domain_id = r.keep_id
FROM ranked r
WHERE s.domain_id = r.id AND r.rn > 1;

-- Remove as linhas duplicadas (mantendo a mais antiga)
DELETE FROM domains d
USING (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY hostname, user_id ORDER BY id) AS rn
    FROM domains
) dup
WHERE d.id = dup.id AND dup.rn > 1;
