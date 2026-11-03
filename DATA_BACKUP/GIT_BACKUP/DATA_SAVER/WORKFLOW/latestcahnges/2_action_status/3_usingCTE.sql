WITH action_meta AS (
      SELECT 
        a.ischainable, 
        ec.final_status
      FROM workflow.wfactions a
      LEFT JOIN workflow.echain ec ON ec.cecode = a.ecode
      WHERE a.aid = $3
    ),
    status_counts AS (
      SELECT 
        COUNT(*) FILTER (WHERE hstatus = 'PROCESSED') AS processed_count,
        COUNT(*) FILTER (WHERE hstatus = 'FAILURE') AS failure_count,
        COUNT(*) FILTER (WHERE hstatus = 'PROCESSING') AS processing_count,
        COUNT(*) AS total_count
      FROM workflow.wfhlog
      WHERE eid = $1
    ),
    final_status AS (
      SELECT 
        CASE 
          WHEN action_meta.ischainable THEN
            CASE 
              WHEN status_counts.processed_count = status_counts.total_count THEN 'PROCESSING'
              WHEN status_counts.failure_count > 0 THEN 'FAILURE'
              ELSE 'PROCESSING'
            END
          ELSE
            CASE 
              WHEN status_counts.processed_count = status_counts.total_count THEN 'PROCESSED'
              WHEN status_counts.failure_count > 0 THEN 'FAILURE'
              WHEN status_counts.processing_count > 0 THEN 'PROCESSING'
              ELSE 'PROCESSING'
            END
        END AS status
      FROM action_meta, status_counts
    ),
    update_current AS (
      UPDATE workflow.wfalog
      SET astatus = final_status.status::workflow.alogstatus
      FROM final_status
      WHERE lid = $2
      RETURNING peid
    ),
    latest_status AS (
      SELECT hstatus
      FROM workflow.wfhlog
      WHERE eid = $1
      LIMIT 1
    )
    UPDATE workflow.wfalog
    SET astatus = 
      CASE 
        WHEN latest_status.hstatus = 'PROCESSED' THEN 'PROCESSED'::workflow.alogstatus
        ELSE 'PROCESSING'::workflow.alogstatus
      END
    FROM action_meta, latest_status, update_current
    WHERE update_current.peid IS NOT NULL
      AND action_meta.final_status
      AND eid = update_current.peid;
  