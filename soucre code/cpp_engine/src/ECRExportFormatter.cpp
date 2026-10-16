#include "../include/ECRExportFormatter.hpp"
#include <sstream>
#include <iomanip>
#include <cmath>

std::string ECRExportFormatter::formatSingleRecord(const PayrollSlip& slip) {
    const Employee& emp = slip.getEmployee();
    const EPFCalculator& epf = slip.getEPFDetails();
    const AttendanceRecord& att = slip.getAttendance();

    // If employee is not enrolled in PF or has no UAN, return empty
    if (!epf.isEligible() || emp.isPfOptOut()) {
        return "";
    }

    std::ostringstream ss;
    // EPFO ECR format requires integer rounded values for wage and contribution columns
    long gross = static_cast<long>(std::round(epf.getGrossWage()));
    long epfWage = static_cast<long>(std::round(epf.getEpfWage()));
    long epsWage = static_cast<long>(std::round(epf.getEpsWage()));
    long edliWage = static_cast<long>(std::round(epf.getEdliWage()));
    long eeShare = static_cast<long>(std::round(epf.getEmployeeContribution()));
    long epsShare = static_cast<long>(std::round(epf.getEmployerEPS()));
    long erDiff = static_cast<long>(std::round(epf.getEmployerEPF()));
    int ncpDays = static_cast<int>(std::round(att.getNcpDays()));
    long refund = 0;

    // Delimiter: #~#
    ss << emp.getUan() << "#~#"
       << emp.getFullName() << "#~#"
       << gross << "#~#"
       << epfWage << "#~#"
       << epsWage << "#~#"
       << edliWage << "#~#"
       << eeShare << "#~#"
       << epsShare << "#~#"
       << erDiff << "#~#"
       << ncpDays << "#~#"
       << refund;

    return ss.str();
}

std::string ECRExportFormatter::generateECRFile(const std::vector<PayrollSlip>& slips) {
    std::ostringstream out;
    bool first = true;
    for (const auto& slip : slips) {
        std::string line = formatSingleRecord(slip);
        if (!line.empty()) {
            if (!first) out << "\n";
            out << line;
            first = false;
        }
    }
    return out.str();
}
