package br.utfpr.websec.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ScanRequest(
        @NotBlank
        @Pattern(regexp = "^(https?://.+|[\\w-]+(\\.[\\w-]+)+.*)$", message = "URL invalida. Informe um hostname (ex.: example.com) ou URL completa (ex.: https://example.com)")
        String url
) {}
