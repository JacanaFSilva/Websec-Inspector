package br.utfpr.websec.repository;

import br.utfpr.websec.model.Domain;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DomainRepository extends JpaRepository<Domain, Long> {
    List<Domain> findByUserId(Long userId);
    Optional<Domain> findByVerificationToken(String token);
    Optional<Domain> findFirstByHostnameAndUserId(String hostname, Long userId);
    Optional<Domain> findByHostname(String hostname);
}
