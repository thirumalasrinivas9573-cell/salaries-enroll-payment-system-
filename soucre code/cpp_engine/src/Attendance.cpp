#include "../include/Attendance.hpp"
#include <sstream>
#include <algorithm>

Attendance::Attendance(int calDays,
                       double present,
                       double leaves,
                       double offDays,
                       double absent)
    : calendarDays(calDays > 0 ? calDays : 30),
      presentDays(std::max(0.0, present)),
      paidLeaves(std::max(0.0, leaves)),
      weeklyOffs(std::max(0.0, offDays)),
      absentDays(std::max(0.0, absent)),
      ncpDays(0.0) {
    recalculate();
}

void Attendance::recalculate() {
    double totalPaid = presentDays + paidLeaves + weeklyOffs;
    if (absentDays > 0.0) {
        ncpDays = absentDays;
    } else {
        ncpDays = std::max(0.0, static_cast<double>(calendarDays) - totalPaid);
    }
}

bool Attendance::validate(std::string& errorMessage) const {
    if (calendarDays < 28 || calendarDays > 31) {
        errorMessage = "Calendar days must be between 28 and 31.";
        return false;
    }
    if (presentDays < 0.0 || paidLeaves < 0.0 || weeklyOffs < 0.0 || absentDays < 0.0 || ncpDays < 0.0) {
        errorMessage = "Attendance numbers cannot be negative.";
        return false;
    }
    double totalPaid = getPaidDays();
    if (totalPaid > static_cast<double>(calendarDays) + 0.001) {
        errorMessage = "Total paid days (" + std::to_string(totalPaid) +
                       ") cannot exceed calendar days (" + std::to_string(calendarDays) + ").";
        return false;
    }
    return true;
}

void Attendance::setCalendarDays(int days) {
    if (days < 28 || days > 31) throw std::invalid_argument("Calendar days must be between 28 and 31.");
    calendarDays = days;
    recalculate();
}

void Attendance::setPresentDays(double days) {
    if (days < 0.0) throw std::invalid_argument("Present days cannot be negative.");
    presentDays = days;
    recalculate();
}

void Attendance::setPaidLeaves(double leaves) {
    if (leaves < 0.0) throw std::invalid_argument("Paid leaves cannot be negative.");
    paidLeaves = leaves;
    recalculate();
}

void Attendance::setWeeklyOffs(double offDays) {
    if (offDays < 0.0) throw std::invalid_argument("Weekly offs cannot be negative.");
    weeklyOffs = offDays;
    recalculate();
}

void Attendance::setAbsentDays(double days) {
    if (days < 0.0) throw std::invalid_argument("Absent days cannot be negative.");
    absentDays = days;
    recalculate();
}

void Attendance::setNcpDays(double ncp) {
    if (ncp < 0.0) throw std::invalid_argument("NCP days cannot be negative.");
    ncpDays = ncp;
}

std::string Attendance::toJSON() const {
    std::ostringstream ss;
    ss << "{"
       << "\"calendarDays\":" << calendarDays << ","
       << "\"presentDays\":" << presentDays << ","
       << "\"paidLeaves\":" << paidLeaves << ","
       << "\"weeklyOffs\":" << weeklyOffs << ","
       << "\"absentDays\":" << absentDays << ","
       << "\"ncpDays\":" << ncpDays << ","
       << "\"paidDays\":" << getPaidDays()
       << "}";
    return ss.str();
}
