package br.utfpr.websec.controller;

import br.utfpr.websec.dto.ScanRequest;
import br.utfpr.websec.dto.ScanResponse;
import br.utfpr.websec.service.ScanService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/scans")
@Tag(name = "Varreduras de Segurança")
public class ScanController {

    private final ScanService scanService;

    public ScanController(ScanService scanService) {
        this.scanService = scanService;
    }

    @PostMapping
    public ResponseEntity<ScanResponse> submit(Authentication auth, @Valid @RequestBody ScanRequest request) {
        return ResponseEntity.ok(scanService.submitUrl(auth.getName(), request));
    }

    @PostMapping("/{id}/confirm-verification")
    public ResponseEntity<ScanResponse> confirmVerification(@PathVariable Long id) {
        return ResponseEntity.ok(scanService.confirmVerificationAndQueue(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ScanResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(scanService.getScan(id));
    }

    @GetMapping("/domain/{domainId}/history")
    public ResponseEntity<List<ScanResponse>> history(@PathVariable Long domainId) {
        return ResponseEntity.ok(scanService.history(domainId));
    }
}
