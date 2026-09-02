package br.utfpr.websec.dto;

import java.time.Instant;
import java.util.List;

public record ScanResponse(
        Long id,
        String hostname,
        String status,
        String verificationToken,
        Instant createdAt,
        Instant finishedAt,
        List<FindingResponse> findings
) {}
