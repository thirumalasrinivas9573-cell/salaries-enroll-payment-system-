#pragma once
#include <vector>
#include <string>
#include <memory>
#include "Employee.hpp"
#include "AttendanceRecord.hpp"
#include "Overtime.hpp"
#include "SalaryRecord.hpp"
#include "ContributionRule.hpp"
#include "PFCalculator.hpp"
#include "ESICCalculator.hpp"
#include "PayrollSlip.hpp"

/**
 * @class PayrollProcessor
 * @brief Combines prorated regular earnings, overtime, statutory deductions,
 *        and authorized deductions into final net payable records.
 *
 * OOP CONCEPTS DEMONSTRATED:
 * 1. Abstraction: High-level orchestration hiding complex prorating algorithms,
 *    statutory ceilings, distinct wage bases, and double-entry deduction rules.
 * 2. Dependency Injection: Receives a ContributionRule object, avoiding static rates.
 * 3. STL Containers: Uses std::vector to manage collections of Employee records,
 *    Attendance inputs, SalaryRecords, and PayrollSlips.
 * 4. Encapsulation: Accumulators and intermediate records are private members.
 */
class PayrollProcessor {
private:
    ContributionRule rule;
    std::vector<SalaryRecord> salaryRecords;
    std::vector<PayrollSlip> payrollSlips;

public:
    // Constructors
    explicit PayrollProcessor(const ContributionRule& ruleConfig = ContributionRule());

    // Destructor
    virtual ~PayrollProcessor() = default;

    // Process single employee
    PayrollSlip processEmployee(int month,
                                int year,
                                const Employee& emp,
                                const AttendanceRecord& att,
                                double pt = 0.0,
                                double tds = 0.0);

    // Process batch of employees using STL containers
    void processBatch(int month,
                      int year,
                      const std::vector<Employee>& employees,
                      const std::vector<AttendanceRecord>& attendances);

    // Getters for processed results
    const std::vector<SalaryRecord>& getSalaryRecords() const { return salaryRecords; }
    const std::vector<PayrollSlip>& getPayrollSlips() const { return payrollSlips; }
    const ContributionRule& getContributionRule() const { return rule; }

    // Summary totals (Rupees)
    double getTotalGrossEarned() const;
    double getTotalNetPayable() const;
    double getTotalEmployeeDeductions() const;
    double getTotalEmployeePF() const;
    double getTotalEmployeeESIC() const;
    double getTotalEmployerStatutory() const;
    size_t getProcessedCount() const { return payrollSlips.size(); }

    void clear() {
        salaryRecords.clear();
        payrollSlips.clear();
    }
};
