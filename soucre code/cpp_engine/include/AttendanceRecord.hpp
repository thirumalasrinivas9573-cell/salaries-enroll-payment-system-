#ifndef ATTENDANCE_RECORD_HPP
#define ATTENDANCE_RECORD_HPP

#include "Attendance.hpp"
#include <string>

/**
 * @class AttendanceRecord
 * @brief Extends Attendance with monthly wage inputs and statutory base overrides.
 *
 * OOP CONCEPTS DEMONSTRATED:
 * 1. Inheritance: AttendanceRecord inherits calendar days, present days, leaves,
 *    and NCP days from the Attendance base class, adding wage base overrides.
 * 2. Encapsulation: Protects wage base inputs, overtime pay, and advance deductions.
 */
class AttendanceRecord : public Attendance {
private:
    double overtimeHours;
    double overtimeAmount;       // Explicit overtime pay override if > 0
    double advanceDeduction;
    double otherDeductions;      // Other authorized deductions (loan, canteen, union, etc.)
    double customPfWage;         // Configured/custom PF wage base (0 = default calculated)
    double customEsicWage;       // Configured/custom ESIC wage base (0 = default calculated)

public:
    AttendanceRecord(int calDays = 30,
                     double present = 26.0,
                     double leaves = 0.0,
                     double offDays = 4.0,
                     double absent = 0.0,
                     double otHours = 0.0,
                     double otAmount = 0.0,
                     double advance = 0.0,
                     double otherDed = 0.0,
                     double pfWage = 0.0,
                     double esicWage = 0.0);

    virtual ~AttendanceRecord() override = default;

    // Additional Getters
    double getOvertimeHours() const { return overtimeHours; }
    double getOvertimeAmount() const { return overtimeAmount; }
    double getAdvanceDeduction() const { return advanceDeduction; }
    double getOtherDeductions() const { return otherDeductions; }
    double getCustomPfWage() const { return customPfWage; }
    double getCustomEsicWage() const { return customEsicWage; }

    // Additional Setters
    void setOvertimeHours(double hours);
    void setOvertimeAmount(double amount);
    void setAdvanceDeduction(double amount);
    void setOtherDeductions(double amount);
    void setCustomPfWage(double amount);
    void setCustomEsicWage(double amount);

    // Validation (overrides Attendance::validate)
    virtual bool validate(std::string& errorMessage) const override;

    virtual std::string toJSON() const override;
};

#endif // ATTENDANCE_RECORD_HPP
