package com.nirikshak.repository;

import com.nirikshak.model.Violation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface ViolationRepository extends JpaRepository<Violation, UUID> {

    List<Violation> findBySessionIdOrderByTimestampAsc(UUID sessionId);

    @Query("SELECT COUNT(v) FROM Violation v WHERE v.sessionId = :sessionId AND v.alertType = :alertType")
    long countBySessionIdAndAlertType(UUID sessionId, String alertType);

    long countBySessionId(UUID sessionId);

    /**
     * Returns a list of Object[]{alertType (String), count (Long)} for all
     * alert types in one single GROUP BY query — 3× cheaper than 3 separate COUNTs.
     */
    @Query("SELECT v.alertType, COUNT(v) FROM Violation v WHERE v.sessionId = :sessionId GROUP BY v.alertType")
    List<Object[]> groupedCountsBySessionId(@Param("sessionId") UUID sessionId);
}
