#include "../include/AttendanceRecord.hpp"
#include <sstream>
#include <iomanip>

AttendanceRecord::AttendanceRecord(int calDays,
                                   double present,
                                   double leaves,
                                   double offDays,
                                   double absent,
                                   double otHours,
                                   double otAmount,
                                   double advance,
                                   double otherDed,
                                   double pfWage,
                                   double esicWage)
    : Attendance(calDays, present, leaves, offDays, absent),
      overtimeHours(otHours >= 0 ? otHours : 0.0),
      overtimeAmount(otAmount >= 0 ? otAmount : 0.0),
      advanceDeduction(advance >= 0 ? advance : 0.0),
      otherDeductions(otherDed >= 0 ? otherDed : 0.0),
      customPfWage(pfWage >= 0 ? pfWage : 0.0),
      customEsicWage(esicWage >= 0 ? esicWage : 0.0) {}

void AttendanceRecord::setOvertimeHours(double hours) {
    if (hours < 0.0) throw std::invalid_argument("Overtime hours cannot be negative.");
    overtimeHours = hours;
}

void AttendanceRecord::setOvertimeAmount(double amount) {
    if (amount < 0.0) throw std::invalid_argument("Overtime amount cannot be negative.");
    overtimeAmount = amount;
}

void AttendanceRecord::setAdvanceDeduction(double amount) {
    if (amount < 0.0) throw std::invalid_argument("Advance deduction cannot be negative.");
    advanceDeduction = amount;
}

void AttendanceRecord::setOtherDeductions(double amount) {
    if (amount < 0.0) throw std::invalid_argument("Other deductions cannot be negative.");
    otherDeductions = amount;
}

void AttendanceRecord::setCustomPfWage(double amount) {
    if (amount < 0.0) throw std::invalid_argument("Custom PF wage cannot be negative.");
    customPfWage = amount;
}

void AttendanceRecord::setCustomEsicWage(double amount) {
    if (amount < 0.0) throw std::invalid_argument("Custom ESIC wage cannot be negative.");
    customEsicWage = amount;
}

bool AttendanceRecord::validate(std::string& errorMessage) const {
    if (!Attendance::validate(errorMessage)) {
        return false;
    }
    if (overtimeHours < 0.0 || overtimeAmount < 0.0 || advanceDeduction < 0.0 ||
        otherDeductions < 0.0 || customPfWage < 0.0 || customEsicWage < 0.0) {
        errorMessage = "Wage, overtime, and deduction amounts cannot be negative.";
        return false;
    }
    return true;
}

std::string AttendanceRecord::toJSON() const {
    std::ostringstream ss;
    ss << "{"
       << "\"calendarDays\":" << calendarDays << ","
       << "\"presentDays\":" << presentDays << ","
       << "\"paidLeaves\":" << paidLeaves << ","
       << "\"weeklyOffs\":" << weeklyOffs << ","
       << "\"absentDays\":" << absentDays << ","
       << "\"ncpDays\":" << ncpDays << ","
       << "\"paidDays\":" << getPaidDays() << ","
       << "\"overtimeHours\":" << overtimeHours << ","
       << "\"overtimeAmount\":" << overtimeAmount << ","
       << "\"advanceDeduction\":" << advanceDeduction << ","
       << "\"otherDeductions\":" << otherDeductions << ","
       << "\"customPfWage\":" << customPfWage << ","
       << "\"customEsicWage\":" << customEsicWage
       << "}";
    return ss.str();
}
