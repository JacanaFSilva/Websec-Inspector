package br.utfpr.websec.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.naming.NamingEnumeration;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Hashtable;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * RF03 — comprova a propriedade de um domínio checando, de fato, se o token de
 * verificação foi publicado pelo dono do site: via registro DNS TXT ou via
 * meta tag na home page. Basta um dos dois bater.
 */
@Service
public class DomainVerificationService {

    private static final Logger log = LoggerFactory.getLogger(DomainVerificationService.class);
    private static final Pattern META_TAG_PATTERN = Pattern.compile("<meta\\s+[^>]*>", Pattern.CASE_INSENSITIVE);
    private static final Duration HTTP_TIMEOUT = Duration.ofSeconds(6);

    public boolean isVerified(String hostname, String token) {
        if (hostname == null || token == null) {
            return false;
        }
        return checkDnsTxt(hostname, token) || checkMetaTag(hostname, token);
    }

    /** Consulta os registros TXT do domínio procurando o token de verificação. */
    private boolean checkDnsTxt(String hostname, String token) {
        try {
            Hashtable<String, String> env = new Hashtable<>();
            env.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");
            env.put("java.naming.provider.url", "dns:");
            env.put("com.sun.jndi.dns.timeout.initial", "3000");
            env.put("com.sun.jndi.dns.timeout.retries", "1");

            DirContext ctx = new InitialDirContext(env);
            try {
                Attributes attrs = ctx.getAttributes(hostname, new String[]{"TXT"});
                Attribute txt = attrs.get("TXT");
                if (txt == null) {
                    return false;
                }
                NamingEnumeration<?> values = txt.getAll();
                while (values.hasMore()) {
                    String value = String.valueOf(values.next()).replaceAll("^\"|\"$", "");
                    if (value.contains(token)) {
                        return true;
                    }
                }
            } finally {
                ctx.close();
            }
        } catch (Exception e) {
            log.debug("Falha ao consultar TXT de {}: {}", hostname, e.getMessage());
        }
        return false;
    }

    /** Busca a home page (https, depois http) procurando a meta tag de verificação. */
    private boolean checkMetaTag(String hostname, String token) {
        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(HTTP_TIMEOUT)
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();

        for (String scheme : List.of("https", "http")) {
            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(scheme + "://" + hostname + "/"))
                        .timeout(HTTP_TIMEOUT)
                        .GET()
                        .build();
                HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
                String body = response.body();
                if (body == null) {
                    continue;
                }
                Matcher m = META_TAG_PATTERN.matcher(body);
                while (m.find()) {
                    String tag = m.group();
                    if (tag.toLowerCase().contains("websec-verification") && tag.contains(token)) {
                        return true;
                    }
                }
            } catch (Exception e) {
                log.debug("Falha ao buscar {}://{}: {}", scheme, hostname, e.getMessage());
            }
        }
        return false;
    }
}
