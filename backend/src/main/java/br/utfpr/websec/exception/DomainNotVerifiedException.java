package br.utfpr.websec.exception;

/**
 * Lançada quando o token de verificação de propriedade (registro DNS TXT ou
 * meta tag) ainda não foi encontrado para o domínio. Diferente de um erro de
 * validação comum: é um estado transitório esperado enquanto a propagação de
 * DNS acontece, então tem um código próprio (VERIFICATION_PENDING) para o
 * frontend saber que deve tentar novamente em vez de mostrar um erro fatal.
 */
public class DomainNotVerifiedException extends RuntimeException {
    public DomainNotVerifiedException(String message) {
        super(message);
    }
}
