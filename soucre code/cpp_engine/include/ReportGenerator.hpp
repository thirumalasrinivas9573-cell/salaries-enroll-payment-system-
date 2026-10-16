#pragma once
#include <string>
#include <vector>
#include <fstream>
#include "PayrollSlip.hpp"
#include "SalaryRecord.hpp"
#include "ContributionRule.hpp"

/**
 * @class ReportGenerator
 * @brief Prepares structured payroll results and exports.
 *
 * OOP CONCEPTS DEMONSTRATED:
 * 1. Abstraction: Clean interface for generating multiple output representations
 *    (JSON, EPFO ECR 2.0, ESIC CSV, ASCII payslip register).
 * 2. File Handling: Safe C++ file I/O operations (std::ofstream, std::ifstream)
 *    to write reports, audit logs, and statutory portal files to disk safely.
 * 3. Security: Ensures sensitive credentials and employee documents are excluded.
 */
class ReportGenerator {
private:
    int month;
    int year;
    std::string companyName;
    std::string establishmentCode;

public:
    // Constructors
    ReportGenerator(int m = 10, int y = 2026,
                    const std::string& comp = "Apex Industrial Technologies Pvt Ltd",
                    const std::string& estCode = "DL/CPM/1982736");

    // Destructor
    virtual ~ReportGenerator() = default;

    // Report Generation Methods (String Outputs)
    std::string generateJSONResponse(const std::vector<PayrollSlip>& slips,
                                     const ContributionRule& rule) const;

    std::string generateASCIIReport(const std::vector<PayrollSlip>& slips) const;

    std::string generateECRText(const std::vector<PayrollSlip>& slips) const;

    std::string generateESICCSV(const std::vector<PayrollSlip>& slips) const;

    // File Handling Methods (Safe disk I/O)
    bool saveToFile(const std::string& filePath, const std::string& content, std::string& errorMsg) const;
    bool readFromFile(const std::string& filePath, std::string& content, std::string& errorMsg) const;

    // Getters and Setters
    void setPeriod(int m, int y) { month = m; year = y; }
    void setCompany(const std::string& c, const std::string& est) { companyName = c; establishmentCode = est; }
};
