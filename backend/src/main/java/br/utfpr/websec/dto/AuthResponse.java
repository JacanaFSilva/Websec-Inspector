package br.utfpr.websec.dto;

public record AuthResponse(String token, String tokenType) {
    public AuthResponse(String token) {
        this(token, "Bearer");
    }
}
