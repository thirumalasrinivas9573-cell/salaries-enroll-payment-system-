#ifndef PAYROLL_SLIP_HPP
#define PAYROLL_SLIP_HPP

#include "Employee.hpp"
#include "AttendanceRecord.hpp"
#include "EPFCalculator.hpp"
#include "ESICCalculator.hpp"
#include <string>

/**
 * @brief Represents the processed salary slip for one employee in a given month.
 * Aggregates attendance, prorated earnings, separate statutory wage bases,
 * employee deductions, employer costs, and net take-home pay.
 */
class PayrollSlip {
private:
    int month;
    int year;
    Employee employee;
    AttendanceRecord attendance;

    // Prorated Earnings
    double earnedBasic;
    double earnedDA;
    double earnedHRA;
    double earnedConveyance;
    double earnedMedical;
    double earnedSpecial;
    double earnedOther;
    double overtimeHours;
    double overtimePay;
    double grossEarned;

    // Distinct Statutory Wage Bases
    double pfWageBase;
    double esicWageBase;

    // Employee Deductions
    double epfEmployee;
    double esicEmployee;
    double professionalTax;
    double advanceDeducted;
    double otherDeductions;
    double incomeTaxTDS;
    double totalDeductions;

    // Net Payable (Gross - Employee Deductions)
    double netPayable;

    // Statutory Calculator instances (Polymorphic results)
    EPFCalculator epfDetails;
    ESICCalculator esicDetails;

public:
    PayrollSlip(int m,
                int y,
                const Employee& emp,
                const AttendanceRecord& att,
                const EPFCalculator& epf,
                const ESICCalculator& esic,
                double pt = 0.0,
                double tds = 0.0);

    // Getters
    int getMonth() const { return month; }
    int getYear() const { return year; }
    const Employee& getEmployee() const { return employee; }
    const AttendanceRecord& getAttendance() const { return attendance; }
    const EPFCalculator& getEPFDetails() const { return epfDetails; }
    const ESICCalculator& getESICDetails() const { return esicDetails; }

    double getEarnedBasic() const { return earnedBasic; }
    double getEarnedDA() const { return earnedDA; }
    double getEarnedHRA() const { return earnedHRA; }
    double getEarnedConveyance() const { return earnedConveyance; }
    double getEarnedMedical() const { return earnedMedical; }
    double getEarnedSpecial() const { return earnedSpecial; }
    double getEarnedOther() const { return earnedOther; }
    double getOvertimeHours() const { return overtimeHours; }
    double getOvertimePay() const { return overtimePay; }
    double getGrossEarned() const { return grossEarned; }

    double getPfWageBase() const { return pfWageBase; }
    double getEsicWageBase() const { return esicWageBase; }

    double getEpfEmployee() const { return epfEmployee; }
    double getEsicEmployee() const { return esicEmployee; }
    double getProfessionalTax() const { return professionalTax; }
    double getAdvanceDeducted() const { return advanceDeducted; }
    double getOtherDeductions() const { return otherDeductions; }
    double getIncomeTaxTDS() const { return incomeTaxTDS; }
    double getTotalDeductions() const { return totalDeductions; }
    double getNetPayable() const { return netPayable; }

    // Employer Liabilities (Kept strictly separate from employee deductions)
    double getEmployerEPF() const { return epfDetails.getEmployerEPF(); }
    double getEmployerEPS() const { return epfDetails.getEmployerEPS(); }
    double getEmployerEDLI() const { return epfDetails.getEdliCharges(); }
    double getEmployerAdmin() const { return epfDetails.getAdminCharges(); }
    double getEmployerESIC() const { return esicDetails.getEmployerContribution(); }
    double getTotalEmployerStatutory() const {
        return epfDetails.getEmployerContribution() + esicDetails.getEmployerContribution();
    }
    double getTotalCTC() const {
        return grossEarned + getTotalEmployerStatutory();
    }

    std::string toJSON() const;
    std::string toFormattedString() const;
};

#endif // PAYROLL_SLIP_HPP
