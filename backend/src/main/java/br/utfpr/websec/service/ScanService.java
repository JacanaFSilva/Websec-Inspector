package br.utfpr.websec.service;

import br.utfpr.websec.dto.*;
import br.utfpr.websec.exception.DomainNotVerifiedException;
import br.utfpr.websec.model.*;
import br.utfpr.websec.repository.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.List;

@Service
public class ScanService {

    private static final String QUEUE_KEY = "scan-queue";

    private final UserRepository userRepository;
    private final DomainRepository domainRepository;
    private final ScanRepository scanRepository;
    private final FindingRepository findingRepository;
    private final StringRedisTemplate redisTemplate;
    private final DomainVerificationService domainVerificationService;

    public ScanService(UserRepository userRepository,
                        DomainRepository domainRepository,
                        ScanRepository scanRepository,
                        FindingRepository findingRepository,
                        StringRedisTemplate redisTemplate,
                        DomainVerificationService domainVerificationService) {
        this.userRepository = userRepository;
        this.domainRepository = domainRepository;
        this.scanRepository = scanRepository;
        this.findingRepository = findingRepository;
        this.redisTemplate = redisTemplate;
        this.domainVerificationService = domainVerificationService;
    }

    /** RF02/RF03 — cria (ou reaproveita) domínio e inicia o fluxo de verificação de propriedade. */
    public ScanResponse submitUrl(String userEmail, ScanRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalStateException("Usuário não encontrado"));

        String url = normalizeUrl(request.url());
        String rawHost = URI.create(url).getHost();
        if (rawHost == null) {
            throw new IllegalArgumentException("Não foi possível extrair o host da URL informada");
        }
        final String hostname = rawHost.startsWith("www.") ? rawHost.substring(4) : rawHost;

        ensureHostnameExists(hostname);

        Domain domain = findOrCreateDomain(hostname, user);

        Scan scan = new Scan();
        scan.setDomain(domain);
        scan.setStatus(Scan.Status.PENDING_VERIFICATION);
        scanRepository.save(scan);

        return toResponse(scan, List.of());
    }

    /**
     * Busca o domínio existente ou cria um novo, protegido contra a corrida
     * de duas requisições simultâneas tentando criar o mesmo (hostname, user):
     * se o insert falhar por violar a constraint única, é porque outra
     * requisição venceu a corrida — nesse caso, apenas reaproveita o
     * registro que ela acabou de criar em vez de propagar o erro.
     */
    private Domain findOrCreateDomain(String hostname, User user) {
        Domain domain = domainRepository.findFirstByHostnameAndUserId(hostname, user.getId())
                .orElseGet(() -> {
                    Domain d = new Domain();
                    d.setUser(user);
                    d.setHostname(hostname);
                    d.setVerificationToken(generateVerificationToken());
                    return d;
                });

        if (!domain.isVerified()) {
            domain.setVerificationToken(generateVerificationToken());
        }

        try {
            domainRepository.save(domain);
            return domain;
        } catch (DataIntegrityViolationException e) {
            return domainRepository.findFirstByHostnameAndUserId(hostname, user.getId())
                    .orElseThrow(() -> e);
        }
    }

    /** RF03 — confirma verificação de propriedade e enfileira o scan (RF12/US05). */
    public ScanResponse confirmVerificationAndQueue(Long scanId) {
        Scan scan = scanRepository.findById(scanId)
                .orElseThrow(() -> new IllegalStateException("Scan não encontrado"));

        if (scan.getStatus() != Scan.Status.PENDING_VERIFICATION) {
            throw new IllegalStateException("Scan não está aguardando verificação (status atual: " + scan.getStatus() + ")");
        }

        Domain domain = scan.getDomain();
        boolean verified = domainVerificationService.isVerified(domain.getHostname(), domain.getVerificationToken());
        if (!verified) {
            throw new DomainNotVerifiedException(
                    "Ainda não encontramos o registro TXT ou a meta tag de verificação para \"" +
                            domain.getHostname() + "\". A propagação de DNS pode levar alguns minutos.");
        }
        domain.setVerifiedAt(Instant.now());
        domainRepository.save(domain);

        scan.setStatus(Scan.Status.QUEUED);
        scanRepository.save(scan);

        redisTemplate.opsForList().leftPush(QUEUE_KEY, scan.getId().toString());

        return toResponse(scan, List.of());
    }

    public ScanResponse getScan(Long scanId) {
        Scan scan = scanRepository.findById(scanId)
                .orElseThrow(() -> new IllegalStateException("Scan não encontrado"));
        List<FindingResponse> findings = findingRepository.findByScanId(scanId).stream()
                .map(f -> new FindingResponse(f.getId(), f.getOwaspCategory(), f.getDescription(),
                        f.getCvssScore(), f.getSeverity().name(), f.getRecommendation()))
                .toList();
        return toResponse(scan, findings);
    }

    public List<ScanResponse> history(Long domainId) {
        return scanRepository.findByDomainIdOrderByCreatedAtDesc(domainId).stream()
                .map(s -> getScan(s.getId()))
                .toList();
    }

    private ScanResponse toResponse(Scan scan, List<FindingResponse> findings) {
        Domain domain = scan.getDomain();
        return new ScanResponse(
                scan.getId(),
                domain.getHostname(),
                scan.getStatus().name(),
                scan.getStatus() == Scan.Status.PENDING_VERIFICATION ? domain.getVerificationToken() : null,
                scan.getCreatedAt(),
                scan.getFinishedAt(),
                findings
        );
    }

    /**
     * RF02 — confirma que o domínio realmente existe (resolve via DNS) antes de aceitar
     * a varredura. Tenta o hostname informado e, como alternativa, a variante com "www.",
     * já que alguns domínios só respondem em um dos dois formatos.
     */
    private void ensureHostnameExists(String hostname) {
        try {
            InetAddress.getByName(hostname);
        } catch (UnknownHostException e) {
            try {
                InetAddress.getByName("www." + hostname);
            } catch (UnknownHostException e2) {
                throw new IllegalArgumentException(
                        "O domínio \"" + hostname + "\" não foi encontrado. Verifique se a URL está correta.");
            }
        }
    }

    private String generateVerificationToken() {
        byte[] bytes = new byte[24];
        new SecureRandom().nextBytes(bytes);
        return "websec-verify-" + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String normalizeUrl(String input) {
        String url = input.trim();
        if (!url.matches("(?i)^https?://.*")) {
            url = "https://" + url;
        }
        return url;
    }
}
