#pragma once
#include <string>
#include <stdexcept>

/**
 * @class ContributionRule
 * @brief Versioned and configurable statutory rules for EPFO and ESIC.
 *
 * OOP CONCEPTS DEMONSTRATED:
 * 1. Encapsulation: All statutory percentages, ceilings, and audit states are
 *    private members with validation logic in constructors and setters.
 * 2. Dependency Injection: Objects of this class are passed into statutory
 *    calculators and payroll processors, eliminating hard-coded rates and global state.
 */
class ContributionRule {
private:
    std::string version;             // e.g., "v2026.1"
    std::string ruleName;            // e.g., "Indian Statutory Schedule 2026"
    std::string effectiveFrom;       // ISO Date e.g., "2026-04-01"
    
    // EPFO parameters
    double pfWageCeiling;            // Standard: ₹15,000.00
    bool restrictPfCeiling;          // true = cap base at ceiling; false = uncapped
    double pfEeRate;                 // Employee rate %: 12.0
    double epsErRate;                // Pension rate %: 8.33
    double epsCeilingAmount;         // Monthly cap: ₹1,250.00
    double edliRate;                 // EDLI %: 0.50
    double adminRate;                // EPF Admin %: 0.50
    std::string pfRoundingRule;      // "nearest" or "exact"

    // ESIC parameters
    double esicWageCeiling;          // Standard: ₹21,000.00
    double esicEeRate;               // Employee rate %: 0.75
    double esicErRate;               // Employer rate %: 3.25
    double esicMinDailyExempt;       // Daily wage exemption: ₹176.00
    std::string esicRoundingRule;    // "ceil", "nearest", or "exact"

    // Verification & Audit
    bool verified;                   // Legal audit compliance check
    std::string verifiedBy;          // Compliance officer name

public:
    // Constructors
    ContributionRule();
    ContributionRule(const std::string& ver,
                     const std::string& name,
                     const std::string& effectiveDate,
                     double pfCeil = 15000.0,
                     bool restrictCeil = true,
                     double pfRate = 12.0,
                     double epsRate = 8.33,
                     double epsCap = 1250.0,
                     double edli = 0.5,
                     double admin = 0.5,
                     double esicCeil = 21000.0,
                     double esicEe = 0.75,
                     double esicEr = 3.25,
                     double esicExempt = 176.0,
                     bool isVerified = true,
                     const std::string& auditor = "Compliance Auditor");

    // Destructor
    virtual ~ContributionRule() = default;

    // Validation
    void validate() const;

    // Getters
    const std::string& getVersion() const { return version; }
    const std::string& getRuleName() const { return ruleName; }
    const std::string& getEffectiveFrom() const { return effectiveFrom; }
    double getPfWageCeiling() const { return pfWageCeiling; }
    bool isRestrictPfCeiling() const { return restrictPfCeiling; }
    double getPfEeRate() const { return pfEeRate; }
    double getEpsErRate() const { return epsErRate; }
    double getEpsCeilingAmount() const { return epsCeilingAmount; }
    double getEdliRate() const { return edliRate; }
    double getAdminRate() const { return adminRate; }
    const std::string& getPfRoundingRule() const { return pfRoundingRule; }

    double getEsicWageCeiling() const { return esicWageCeiling; }
    double getEsicEeRate() const { return esicEeRate; }
    double getEsicErRate() const { return esicErRate; }
    double getEsicMinDailyExempt() const { return esicMinDailyExempt; }
    const std::string& getEsicRoundingRule() const { return esicRoundingRule; }

    bool isVerified() const { return verified; }
    const std::string& getVerifiedBy() const { return verifiedBy; }

    // Setters with validation
    void setPfWageCeiling(double val);
    void setEsicWageCeiling(double val);
    void setVerified(bool val, const std::string& auditor);

    // Serialization for Audit Trail
    std::string toJSON() const;
};
