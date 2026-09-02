package br.utfpr.websec.model;

import jakarta.persistence.*;

@Entity
@Table(name = "findings")
public class Finding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "scan_id")
    private Scan scan;

    @Column(name = "owasp_category", nullable = false)
    private String owaspCategory; // ex: "A03:2021 - Injection"

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(name = "cvss_score", nullable = false)
    private Double cvssScore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Severity severity;

    @Column(length = 2000)
    private String recommendation;

    public enum Severity { LOW, MEDIUM, HIGH, CRITICAL }

    public static Severity severityFromScore(double score) {
        if (score >= 9.0) return Severity.CRITICAL;
        if (score >= 7.0) return Severity.HIGH;
        if (score >= 4.0) return Severity.MEDIUM;
        return Severity.LOW;
    }

    public Long getId() { return id; }
    public Scan getScan() { return scan; }
    public void setScan(Scan scan) { this.scan = scan; }
    public String getOwaspCategory() { return owaspCategory; }
    public void setOwaspCategory(String owaspCategory) { this.owaspCategory = owaspCategory; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Double getCvssScore() { return cvssScore; }
    public void setCvssScore(Double cvssScore) {
        this.cvssScore = cvssScore;
        this.severity = severityFromScore(cvssScore);
    }
    public Severity getSeverity() { return severity; }
    public String getRecommendation() { return recommendation; }
    public void setRecommendation(String recommendation) { this.recommendation = recommendation; }
}
