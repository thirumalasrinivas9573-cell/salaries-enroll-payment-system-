#include "../include/EPFCalculator.hpp"
#include <sstream>
#include <iomanip>
#include <algorithm>

EPFCalculator::EPFCalculator(bool isEligible,
                             bool limitCeiling,
                             bool isEpsActive,
                             double ceiling)
    : eligible(isEligible),
      restrictToCeiling(limitCeiling),
      epsEligible(isEpsActive),
      wageCeiling(ceiling > 0 ? ceiling : 15000.0),
      grossWage(0.0),
      epfWage(0.0),
      epsWage(0.0),
      edliWage(0.0),
      employeeShare(0.0),
      employerEPS(0.0),
      employerEPF(0.0),
      edliCharges(0.0),
      adminCharges(0.0) {}

void EPFCalculator::calculate(double earnedBasicDA, double earnedGross, int paidDays, int calendarDays) {
    (void)calendarDays; // Used if daily proration needed
    grossWage = (earnedGross > 0.0 ? earnedGross : 0.0);

    if (!eligible || paidDays <= 0 || earnedBasicDA <= 0.0) {
        epfWage = 0.0;
        epsWage = 0.0;
        edliWage = 0.0;
        employeeShare = 0.0;
        employerEPS = 0.0;
        employerEPF = 0.0;
        edliCharges = 0.0;
        adminCharges = 0.0;
        return;
    }

    // 1. Determine EPF Wages base (Basic + DA)
    if (restrictToCeiling) {
        epfWage = std::min(earnedBasicDA, wageCeiling);
    } else {
        epfWage = earnedBasicDA;
    }

    // 2. Determine EPS Wages (Pension wage ceiling strictly ₹15,000 as per EPFO rules)
    if (epsEligible) {
        epsWage = std::min(earnedBasicDA, wageCeiling);
    } else {
        epsWage = 0.0;
    }

    // 3. EDLI Wages (capped at statutory ceiling)
    edliWage = std::min(epfWage, wageCeiling);

    // 4. Employee PF Contribution (12% of EPF Wages, rounded to nearest rupee)
    employeeShare = std::round(epfWage * 0.12);

    // 5. Employer EPS Contribution (8.33% of EPS Wages, capped at max ₹1,250)
    if (epsEligible && epsWage > 0.0) {
        double rawEps = std::round(epsWage * (8.33 / 100.0));
        employerEPS = std::min(rawEps, 1250.0);
    } else {
        employerEPS = 0.0;
    }

    // 6. Employer EPF Contribution (A/c 01: Employee Share minus Employer EPS)
    employerEPF = std::max(0.0, employeeShare - employerEPS);

    // 7. EDLI Charges (A/c 21: 0.50% of EDLI Wages)
    edliCharges = std::round(edliWage * 0.0050);

    // 8. Admin Charges (A/c 02: 0.50% of EPF Wages)
    adminCharges = std::round(epfWage * 0.0050);
}

std::string EPFCalculator::toJSON() const {
    std::ostringstream ss;
    ss << std::fixed << std::setprecision(2);
    ss << "{"
       << "\"eligible\":" << (eligible ? "true" : "false") << ","
       << "\"restrictToCeiling\":" << (restrictToCeiling ? "true" : "false") << ","
       << "\"epsEligible\":" << (epsEligible ? "true" : "false") << ","
       << "\"wageCeiling\":" << wageCeiling << ","
       << "\"grossWage\":" << grossWage << ","
       << "\"epfWage\":" << epfWage << ","
       << "\"epsWage\":" << epsWage << ","
       << "\"edliWage\":" << edliWage << ","
       << "\"employeeShare\":" << employeeShare << ","
       << "\"employerEPS\":" << employerEPS << ","
       << "\"employerEPF\":" << employerEPF << ","
       << "\"edliCharges\":" << edliCharges << ","
       << "\"adminCharges\":" << adminCharges << ","
       << "\"totalEmployerPF\":" << getEmployerContribution()
       << "}";
    return ss.str();
}
