#include "../include/ContributionRule.hpp"
#include <sstream>

ContributionRule::ContributionRule()
    : version("v2026.1"),
      ruleName("Indian Statutory Schedule 2026"),
      effectiveFrom("2026-04-01"),
      pfWageCeiling(15000.0),
      restrictPfCeiling(true),
      pfEeRate(12.0),
      epsErRate(8.33),
      epsCeilingAmount(1250.0),
      edliRate(0.5),
      adminRate(0.5),
      pfRoundingRule("nearest"),
      esicWageCeiling(21000.0),
      esicEeRate(0.75),
      esicErRate(3.25),
      esicMinDailyExempt(176.0),
      esicRoundingRule("ceil"),
      verified(true),
      verifiedBy("Compliance Officer") {
    validate();
}

ContributionRule::ContributionRule(const std::string& ver,
                                   const std::string& name,
                                   const std::string& effectiveDate,
                                   double pfCeil,
                                   bool restrictCeil,
                                   double pfRate,
                                   double epsRate,
                                   double epsCap,
                                   double edli,
                                   double admin,
                                   double esicCeil,
                                   double esicEe,
                                   double esicEr,
                                   double esicExempt,
                                   bool isVerified,
                                   const std::string& auditor)
    : version(ver.empty() ? "v2026.1" : ver),
      ruleName(name.empty() ? "Statutory Rules" : name),
      effectiveFrom(effectiveDate.empty() ? "2026-04-01" : effectiveDate),
      pfWageCeiling(pfCeil),
      restrictPfCeiling(restrictCeil),
      pfEeRate(pfRate),
      epsErRate(epsRate),
      epsCeilingAmount(epsCap),
      edliRate(edli),
      adminRate(admin),
      pfRoundingRule("nearest"),
      esicWageCeiling(esicCeil),
      esicEeRate(esicEe),
      esicErRate(esicEr),
      esicMinDailyExempt(esicExempt),
      esicRoundingRule("ceil"),
      verified(isVerified),
      verifiedBy(auditor) {
    validate();
}

void ContributionRule::validate() const {
    if (pfWageCeiling < 0.0) throw std::invalid_argument("PF Wage Ceiling cannot be negative.");
    if (pfEeRate < 0.0 || pfEeRate > 100.0) throw std::invalid_argument("PF EE Rate must be between 0% and 100%.");
    if (epsErRate < 0.0 || epsErRate > 100.0) throw std::invalid_argument("EPS Rate must be between 0% and 100%.");
    if (esicWageCeiling < 0.0) throw std::invalid_argument("ESIC Wage Ceiling cannot be negative.");
    if (esicEeRate < 0.0 || esicEeRate > 100.0) throw std::invalid_argument("ESIC EE Rate must be between 0% and 100%.");
    if (esicErRate < 0.0 || esicErRate > 100.0) throw std::invalid_argument("ESIC ER Rate must be between 0% and 100%.");
}

void ContributionRule::setPfWageCeiling(double val) {
    if (val < 0.0) throw std::invalid_argument("PF ceiling cannot be negative.");
    pfWageCeiling = val;
}

void ContributionRule::setEsicWageCeiling(double val) {
    if (val < 0.0) throw std::invalid_argument("ESIC ceiling cannot be negative.");
    esicWageCeiling = val;
}

void ContributionRule::setVerified(bool val, const std::string& auditor) {
    verified = val;
    verifiedBy = auditor;
}

std::string ContributionRule::toJSON() const {
    std::ostringstream ss;
    ss << "{"
       << "\"version\":\"" << version << "\","
       << "\"ruleName\":\"" << ruleName << "\","
       << "\"effectiveFrom\":\"" << effectiveFrom << "\","
       << "\"pfWageCeiling\":" << pfWageCeiling << ","
       << "\"restrictPfCeiling\":" << (restrictPfCeiling ? "true" : "false") << ","
       << "\"pfEeRate\":" << pfEeRate << ","
       << "\"epsErRate\":" << epsErRate << ","
       << "\"epsCeilingAmount\":" << epsCeilingAmount << ","
       << "\"edliRate\":" << edliRate << ","
       << "\"adminRate\":" << adminRate << ","
       << "\"esicWageCeiling\":" << esicWageCeiling << ","
       << "\"esicEeRate\":" << esicEeRate << ","
       << "\"esicErRate\":" << esicErRate << ","
       << "\"esicMinDailyExempt\":" << esicMinDailyExempt << ","
       << "\"pfRoundingRule\":\"" << pfRoundingRule << "\","
       << "\"esicRoundingRule\":\"" << esicRoundingRule << "\","
       << "\"verified\":" << (verified ? "true" : "false") << ","
       << "\"verifiedBy\":\"" << verifiedBy << "\""
       << "}";
    return ss.str();
}
