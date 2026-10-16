#include "../include/PayrollProcessor.hpp"
#include <iostream>
#include <algorithm>
#include <cmath>

PayrollProcessor::PayrollProcessor(const ContributionRule& ruleConfig)
    : rule(ruleConfig) {}

PayrollSlip PayrollProcessor::processEmployee(int month,
                                              int year,
                                              const Employee& emp,
                                              const AttendanceRecord& att,
                                              double pt,
                                              double tds) {
    std::string errMsg;
    if (!att.validate(errMsg)) {
        throw std::invalid_argument("Attendance validation failed: " + errMsg);
    }
    if (month < 1 || month > 12) {
        throw std::invalid_argument("Invalid payroll month (must be 1-12).");
    }
    if (year < 2000 || year > 2100) {
        throw std::invalid_argument("Invalid payroll year.");
    }

    const SalaryStructure& sal = emp.getSalaryStructure();
    int calDays = att.getCalendarDays();
    double paidDays = att.getPaidDays();

    // 1. Prorated regular earnings
    double earnedBasic = sal.getProratedBasic(paidDays, calDays);
    double earnedDA = sal.getProratedDA(paidDays, calDays);
    double earnedHRA = sal.getProratedHRA(paidDays, calDays);
    double earnedConv = sal.getProratedConveyance(paidDays, calDays);
    double earnedMed = sal.getProratedMedical(paidDays, calDays);
    double earnedSpecial = sal.getProratedSpecial(paidDays, calDays);
    double earnedOther = sal.getProratedOther(paidDays, calDays);
    double earnedBasicDA = earnedBasic + earnedDA;
    double earnedGrossBase = earnedBasic + earnedDA + earnedHRA + earnedConv + earnedMed + earnedSpecial + earnedOther;

    // 2. Overtime calculation using Overtime class
    Overtime ot(att.getOvertimeHours(), att.getOvertimeAmount());
    double otPay = ot.calculate(earnedBasic, paidDays);
    double totalEarnedGross = earnedGrossBase + otPay;

    // 3. Determine Distinct PF Wage Base
    double pfBase = 0.0;
    if (att.getCustomPfWage() > 0.0) {
        pfBase = att.getCustomPfWage();
    } else {
        pfBase = earnedBasicDA;
    }

    // 4. Calculate EPF using PFCalculator with injected ContributionRule
    bool pfEligible = !emp.isPfOptOut() && !emp.getUan().empty();
    PFCalculator pfCalc(pfEligible, rule);
    pfCalc.calculate(pfBase, totalEarnedGross, static_cast<int>(paidDays), calDays);

    // 5. Determine Distinct ESIC Wage Base
    // Employee is covered if fixed monthly gross <= ESIC ceiling, not opted out, and IP present
    bool esicEligible = !emp.isEsicOptOut() && !emp.getEsicIp().empty() && (sal.getMonthlyGross() <= rule.getEsicWageCeiling());
    double esicBase = 0.0;
    if (esicEligible) {
        if (att.getCustomEsicWage() > 0.0) {
            esicBase = att.getCustomEsicWage();
        } else {
            esicBase = totalEarnedGross;
        }
    }
    ESICCalculator esicCalc(esicEligible, rule);
    esicCalc.calculate(pfBase, esicBase, static_cast<int>(paidDays), calDays);

    // 6. Assemble SalaryRecord (paise-precision calculations and Net Pay logic)
    SalaryRecord record(
        earnedBasic, earnedDA, earnedHRA, earnedConv, earnedMed, earnedSpecial, earnedOther,
        otPay,
        pfCalc.getEmployeeContribution(),
        esicCalc.getEmployeeContribution(),
        pt,
        att.getAdvanceDeduction(),
        att.getOtherDeductions(),
        tds
    );

    // 7. Assemble PayrollSlip for report generation and backward compatibility
    // Map PFCalculator fields into EPFCalculator interface for PayrollSlip
    EPFCalculator epfShim(pfEligible, rule.isRestrictPfCeiling(), true, rule.getPfWageCeiling());
    epfShim.calculate(pfBase, totalEarnedGross, static_cast<int>(paidDays), calDays);

    PayrollSlip slip(month, year, emp, att, epfShim, esicCalc, pt, tds);

    salaryRecords.push_back(record);
    payrollSlips.push_back(slip);

    return slip;
}

void PayrollProcessor::processBatch(int month,
                                     int year,
                                     const std::vector<Employee>& employees,
                                     const std::vector<AttendanceRecord>& attendances) {
    clear();
    size_t count = std::min(employees.size(), attendances.size());
    for (size_t i = 0; i < count; ++i) {
        if (employees[i].isActive()) {
            processEmployee(month, year, employees[i], attendances[i]);
        }
    }
}

double PayrollProcessor::getTotalGrossEarned() const {
    double total = 0.0;
    for (const auto& r : salaryRecords) total += r.getGrossEarned();
    return total;
}

double PayrollProcessor::getTotalNetPayable() const {
    double total = 0.0;
    for (const auto& r : salaryRecords) total += r.getNetPayable();
    return total;
}

double PayrollProcessor::getTotalEmployeeDeductions() const {
    double total = 0.0;
    for (const auto& r : salaryRecords) total += r.getTotalDeductions();
    return total;
}

double PayrollProcessor::getTotalEmployeePF() const {
    double total = 0.0;
    for (const auto& r : salaryRecords) total += r.getEpfEmployee();
    return total;
}

double PayrollProcessor::getTotalEmployeeESIC() const {
    double total = 0.0;
    for (const auto& r : salaryRecords) total += r.getEsicEmployee();
    return total;
}

double PayrollProcessor::getTotalEmployerStatutory() const {
    double total = 0.0;
    for (const auto& slip : payrollSlips) {
        total += slip.getTotalEmployerStatutory();
    }
    return total;
}
