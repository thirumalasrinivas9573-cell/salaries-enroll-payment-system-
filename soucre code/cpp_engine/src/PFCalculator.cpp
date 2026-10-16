#include "../include/PFCalculator.hpp"
#include <sstream>
#include <algorithm>
#include <cmath>

PFCalculator::PFCalculator(bool isEligible, const ContributionRule& rules)
    : eligible(isEligible),
      rule(rules),
      grossWage(0.0),
      pfWage(0.0),
      epsWage(0.0),
      edliWage(0.0),
      employeeShare(0.0),
      employerEPS(0.0),
      employerEPF(0.0),
      edliCharges(0.0),
      adminCharges(0.0) {}

void PFCalculator::calculate(double earnedBasicDA, double earnedGross, int paidDays, int calendarDays) {
    if (!eligible || paidDays <= 0 || earnedBasicDA <= 0.0) {
        grossWage = earnedGross;
        pfWage = 0.0;
        epsWage = 0.0;
        edliWage = 0.0;
        employeeShare = 0.0;
        employerEPS = 0.0;
        employerEPF = 0.0;
        edliCharges = 0.0;
        adminCharges = 0.0;
        return;
    }

    grossWage = earnedGross;

    // 1. Determine PF Wage Base
    if (rule.isRestrictPfCeiling() && earnedBasicDA > rule.getPfWageCeiling()) {
        pfWage = rule.getPfWageCeiling();
    } else {
        pfWage = earnedBasicDA;
    }

    // 2. Prorate EPS and EDLI wage based on paid attendance days if partial month
    double effectiveEpsCeil = rule.getPfWageCeiling();
    if (calendarDays > 0 && paidDays < calendarDays) {
        effectiveEpsCeil = std::round((rule.getPfWageCeiling() / static_cast<double>(calendarDays)) * static_cast<double>(paidDays));
    }
    epsWage = std::min(pfWage, effectiveEpsCeil);
    edliWage = epsWage;

    // Convert to paise for exact rounding
    long long pfWagePaise = MoneyUtil::toPaise(pfWage);
    long long epsWagePaise = MoneyUtil::toPaise(epsWage);

    // 3. Employee Share: 12% of PF Wage (rounded to nearest Rupee per EPFO rule)
    long long rawEePaise = static_cast<long long>(std::round(static_cast<double>(pfWagePaise) * (rule.getPfEeRate() / 100.0)));
    long long roundedEePaise = MoneyUtil::roundToNearestRupee(rawEePaise);
    employeeShare = MoneyUtil::toRupees(roundedEePaise);

    // 4. Employer EPS: 8.33% of EPS Wage (capped at rule.getEpsCeilingAmount())
    long long rawEpsPaise = static_cast<long long>(std::round(static_cast<double>(epsWagePaise) * (rule.getEpsErRate() / 100.0)));
    long long roundedEpsPaise = MoneyUtil::roundToNearestRupee(rawEpsPaise);
    long long maxEpsPaise = MoneyUtil::toPaise(rule.getEpsCeilingAmount());
    if (roundedEpsPaise > maxEpsPaise) {
        roundedEpsPaise = maxEpsPaise;
    }
    employerEPS = MoneyUtil::toRupees(roundedEpsPaise);

    // 5. Employer EPF: Total 12% of PF Wage - Employer EPS
    long long totalEr12Paise = MoneyUtil::roundToNearestRupee(
        static_cast<long long>(std::round(static_cast<double>(pfWagePaise) * 0.12))
    );
    long long employerEpfPaise = totalEr12Paise - roundedEpsPaise;
    if (employerEpfPaise < 0LL) employerEpfPaise = 0LL;
    employerEPF = MoneyUtil::toRupees(employerEpfPaise);

    // 6. EDLI (0.5%) & Admin (0.5%)
    long long rawEdliPaise = static_cast<long long>(std::round(static_cast<double>(epsWagePaise) * (rule.getEdliRate() / 100.0)));
    long long rawAdminPaise = static_cast<long long>(std::round(static_cast<double>(pfWagePaise) * (rule.getAdminRate() / 100.0)));
    edliCharges = MoneyUtil::toRupees(MoneyUtil::roundToNearestRupee(rawEdliPaise));
    adminCharges = MoneyUtil::toRupees(MoneyUtil::roundToNearestRupee(rawAdminPaise));
}

std::string PFCalculator::toJSON() const {
    std::ostringstream ss;
    ss << "{"
       << "\"eligible\":" << (eligible ? "true" : "false") << ","
       << "\"grossWage\":" << grossWage << ","
       << "\"epfWage\":" << pfWage << ","
       << "\"epsWage\":" << epsWage << ","
       << "\"edliWage\":" << edliWage << ","
       << "\"employeeShare\":" << employeeShare << ","
       << "\"employerEPS\":" << employerEPS << ","
       << "\"employerEPF\":" << employerEPF << ","
       << "\"edliCharges\":" << edliCharges << ","
       << "\"adminCharges\":" << adminCharges << ","
       << "\"totalEmployerShare\":" << getEmployerContribution()
       << "}";
    return ss.str();
}
