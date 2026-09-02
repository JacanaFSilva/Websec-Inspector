package br.utfpr.websec.repository;

import br.utfpr.websec.model.Finding;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FindingRepository extends JpaRepository<Finding, Long> {
    List<Finding> findByScanId(Long scanId);
}
