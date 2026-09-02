package br.utfpr.websec.dto;

public record FindingResponse(
        Long id,
        String owaspCategory,
        String description,
        Double cvssScore,
        String severity,
        String recommendation
) {}
