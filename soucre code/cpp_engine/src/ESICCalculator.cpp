#include "../include/ESICCalculator.hpp"
#include <sstream>
#include <iomanip>
#include <cmath>

ESICCalculator::ESICCalculator(bool isEligible,
                               double ceiling,
                               double dailyExempt)
    : eligible(isEligible),
      wageCeiling(ceiling > 0 ? ceiling : 21000.0),
      minDailyWageExempt(dailyExempt > 0 ? dailyExempt : 176.0),
      eeRate(0.75),
      erRate(3.25),
      esicWage(0.0),
      employeeShare(0.0),
      employerShare(0.0),
      totalContribution(0.0),
      isDailyWageExempt(false) {}

ESICCalculator::ESICCalculator(bool isEligible, const ContributionRule& rule)
    : eligible(isEligible),
      wageCeiling(rule.getEsicWageCeiling() > 0 ? rule.getEsicWageCeiling() : 21000.0),
      minDailyWageExempt(rule.getEsicMinDailyExempt() > 0 ? rule.getEsicMinDailyExempt() : 176.0),
      eeRate(rule.getEsicEeRate() > 0 ? rule.getEsicEeRate() : 0.75),
      erRate(rule.getEsicErRate() > 0 ? rule.getEsicErRate() : 3.25),
      esicWage(0.0),
      employeeShare(0.0),
      employerShare(0.0),
      totalContribution(0.0),
      isDailyWageExempt(false) {}

void ESICCalculator::calculate(double earnedBasicDA, double earnedGross, int paidDays, int calendarDays) {
    (void)earnedBasicDA;
    (void)calendarDays;

    if (!eligible || paidDays <= 0 || earnedGross <= 0.0) {
        esicWage = 0.0;
        employeeShare = 0.0;
        employerShare = 0.0;
        totalContribution = 0.0;
        isDailyWageExempt = false;
        return;
    }

    esicWage = earnedGross;

    // Check minimum daily wage exemption rule:
    // If average daily wage <= ₹176, the employee is exempt from employee share (0%)
    double avgDailyWage = (paidDays > 0) ? (earnedGross / static_cast<double>(paidDays)) : 0.0;
    if (avgDailyWage <= minDailyWageExempt) {
        isDailyWageExempt = true;
        employeeShare = 0.0;
    } else {
        isDailyWageExempt = false;
        // Employee share is 0.75%, rounded up to next higher rupee as per ESIC statutory standard
        long long wagePaise = MoneyUtil::toPaise(esicWage);
        long long rawEePaise = static_cast<long long>(std::ceil(static_cast<double>(wagePaise) * (eeRate / 100.0)));
        long long roundedEePaise = MoneyUtil::roundCeilRupee(rawEePaise);
        employeeShare = MoneyUtil::toRupees(roundedEePaise);
    }

    // Employer share is 3.25%, rounded up to next higher rupee
    long long wagePaise = MoneyUtil::toPaise(esicWage);
    long long rawErPaise = static_cast<long long>(std::ceil(static_cast<double>(wagePaise) * (erRate / 100.0)));
    long long roundedErPaise = MoneyUtil::roundCeilRupee(rawErPaise);
    employerShare = MoneyUtil::toRupees(roundedErPaise);

    totalContribution = employeeShare + employerShare;
}

std::string ESICCalculator::toJSON() const {
    std::ostringstream ss;
    ss << std::fixed << std::setprecision(2);
    ss << "{"
       << "\"eligible\":" << (eligible ? "true" : "false") << ","
       << "\"wageCeiling\":" << wageCeiling << ","
       << "\"minDailyWageExempt\":" << minDailyWageExempt << ","
       << "\"esicWage\":" << esicWage << ","
       << "\"isDailyWageExempt\":" << (isDailyWageExempt ? "true" : "false") << ","
       << "\"employeeShare\":" << employeeShare << ","
       << "\"employerShare\":" << employerShare << ","
       << "\"totalContribution\":" << totalContribution
       << "}";
    return ss.str();
}
