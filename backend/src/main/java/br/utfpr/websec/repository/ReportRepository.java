package br.utfpr.websec.repository;

import br.utfpr.websec.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ReportRepository extends JpaRepository<Report, Long> {
    Optional<Report> findByScanId(Long scanId);
}
