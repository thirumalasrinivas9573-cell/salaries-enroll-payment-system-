#include "../include/ESICExportFormatter.hpp"
#include <sstream>
#include <iomanip>
#include <cmath>

std::string ESICExportFormatter::formatSingleRecord(const PayrollSlip& slip) {
    const Employee& emp = slip.getEmployee();
    const ESICCalculator& esic = slip.getESICDetails();
    const AttendanceRecord& att = slip.getAttendance();

    // If employee is not eligible/enrolled for ESIC, skip
    if (!esic.isEligible() || emp.isEsicOptOut()) {
        return "";
    }

    std::ostringstream ss;
    long paidDays = static_cast<long>(std::round(att.getPaidDays()));
    long esicWage = static_cast<long>(std::round(esic.getEsicWage()));
    
    // Reason code for zero working days
    std::string reasonCode = "0";
    if (paidDays == 0) {
        reasonCode = "9"; // 9 = Leave Without Pay / NCP
    }

    std::string lastWorkingDay = ""; // Optional / empty for active

    ss << emp.getEsicIp() << ","
       << "\"" << emp.getFullName() << "\","
       << paidDays << ","
       << esicWage << ","
       << reasonCode << ","
       << lastWorkingDay;

    return ss.str();
}

std::string ESICExportFormatter::generateESICFile(const std::vector<PayrollSlip>& slips) {
    std::ostringstream out;
    out << "IP Number,IP Name,No of Days for which wages paid,Total Monthly Wages,Reason Code for Zero Working Days,Last Working Day\n";
    for (const auto& slip : slips) {
        std::string line = formatSingleRecord(slip);
        if (!line.empty()) {
            out << line << "\n";
        }
    }
    return out.str();
}
