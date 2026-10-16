#include "../include/ReportGenerator.hpp"
#include "../include/ECRExportFormatter.hpp"
#include "../include/ESICExportFormatter.hpp"
#include <sstream>
#include <iomanip>

ReportGenerator::ReportGenerator(int m, int y,
                                 const std::string& comp,
                                 const std::string& estCode)
    : month(m), year(y), companyName(comp), establishmentCode(estCode) {}

std::string ReportGenerator::generateJSONResponse(const std::vector<PayrollSlip>& slips,
                                                  const ContributionRule& rule) const {
    double totalGross = 0.0, totalNet = 0.0, totalDeductions = 0.0;
    double totalEEPF = 0.0, totalEEESIC = 0.0, totalPFLiab = 0.0, totalESICLiab = 0.0;
    double totalEmployerStatutory = 0.0;

    for (const auto& slip : slips) {
        totalGross += slip.getGrossEarned();
        totalNet += slip.getNetPayable();
        totalDeductions += slip.getTotalDeductions();
        totalEEPF += slip.getEpfEmployee();
        totalEEESIC += slip.getEsicEmployee();
        totalPFLiab += slip.getEPFDetails().getEmployeeContribution() + slip.getEPFDetails().getEmployerContribution();
        totalESICLiab += slip.getESICDetails().getEmployeeContribution() + slip.getESICDetails().getEmployerContribution();
        totalEmployerStatutory += slip.getTotalEmployerStatutory();
    }

    std::ostringstream ss;
    ss << std::fixed << std::setprecision(2);
    ss << "{"
       << "\"success\":true,"
       << "\"month\":" << month << ","
       << "\"year\":" << year << ","
       << "\"company\":\"" << companyName << "\","
       << "\"establishmentCode\":\"" << establishmentCode << "\","
       << "\"ruleVersion\":\"" << rule.getVersion() << "\","
       << "\"rulesUsed\":" << rule.toJSON() << ","
       << "\"summary\":{"
       << "\"totalEmployees\":" << slips.size() << ","
       << "\"totalGrossEarned\":" << totalGross << ","
       << "\"totalNetPayable\":" << totalNet << ","
       << "\"totalEmployeeDeductions\":" << totalDeductions << ","
       << "\"totalEmployeePF\":" << totalEEPF << ","
       << "\"totalEmployeeESIC\":" << totalEEESIC << ","
       << "\"totalPFLiability\":" << totalPFLiab << ","
       << "\"totalESICLiability\":" << totalESICLiab << ","
       << "\"totalEmployerContributions\":" << totalEmployerStatutory
       << "},"
       << "\"slips\":[";

    for (size_t i = 0; i < slips.size(); ++i) {
        if (i > 0) ss << ",";
        ss << slips[i].toJSON();
    }
    ss << "]}";

    return ss.str();
}

std::string ReportGenerator::generateASCIIReport(const std::vector<PayrollSlip>& slips) const {
    std::ostringstream ss;
    ss << "========================================================================================\n";
    ss << "  SALARY ENROLL PAY SYSTEM — MONTHLY PAYROLL REGISTER: " << month << "/" << year << "\n";
    ss << "  Establishment: " << companyName << " (" << establishmentCode << ")\n";
    ss << "========================================================================================\n";
    ss << std::left
       << std::setw(10) << "EMP CODE"
       << std::setw(22) << "EMPLOYEE NAME"
       << std::right
       << std::setw(6)  << "DAYS"
       << std::setw(12) << "GROSS"
       << std::setw(12) << "PF BASE"
       << std::setw(10) << "EE PF"
       << std::setw(10) << "EE ESIC"
       << std::setw(12) << "NET PAY"
       << "\n";
    ss << "----------------------------------------------------------------------------------------\n";

    double sumGross = 0.0, sumNet = 0.0;
    for (const auto& s : slips) {
        sumGross += s.getGrossEarned();
        sumNet += s.getNetPayable();
        ss << std::left
           << std::setw(10) << s.getEmployee().getEmpCode()
           << std::setw(22) << s.getEmployee().getFullName().substr(0, 20)
           << std::right
           << std::setw(6)  << s.getAttendance().getPaidDays()
           << std::setw(12) << std::fixed << std::setprecision(2) << s.getGrossEarned()
           << std::setw(12) << s.getPfWageBase()
           << std::setw(10) << s.getEpfEmployee()
           << std::setw(10) << s.getEsicEmployee()
           << std::setw(12) << s.getNetPayable()
           << "\n";
    }
    ss << "----------------------------------------------------------------------------------------\n";
    ss << std::left << std::setw(38) << "TOTALS (" + std::to_string(slips.size()) + " EMPLOYEES)"
       << std::right
       << std::setw(12) << sumGross
       << std::setw(32) << ""
       << std::setw(12) << sumNet
       << "\n";
    ss << "========================================================================================\n";
    return ss.str();
}

std::string ReportGenerator::generateECRText(const std::vector<PayrollSlip>& slips) const {
    return ECRExportFormatter::generateECRFile(slips);
}

std::string ReportGenerator::generateESICCSV(const std::vector<PayrollSlip>& slips) const {
    return ESICExportFormatter::generateESICFile(slips);
}

bool ReportGenerator::saveToFile(const std::string& filePath,
                                 const std::string& content,
                                 std::string& errorMsg) const {
    std::ofstream outFile(filePath, std::ios::out | std::ios::trunc);
    if (!outFile.is_open()) {
        errorMsg = "Failed to open file for writing: " + filePath;
        return false;
    }
    outFile << content;
    if (outFile.fail()) {
        errorMsg = "I/O failure while writing content to file: " + filePath;
        return false;
    }
    outFile.close();
    return true;
}

bool ReportGenerator::readFromFile(const std::string& filePath,
                                   std::string& content,
                                   std::string& errorMsg) const {
    std::ifstream inFile(filePath, std::ios::in);
    if (!inFile.is_open()) {
        errorMsg = "Failed to open file for reading: " + filePath;
        return false;
    }
    std::stringstream buffer;
    buffer << inFile.rdbuf();
    content = buffer.str();
    inFile.close();
    return true;
}
