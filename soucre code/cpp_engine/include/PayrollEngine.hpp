#ifndef PAYROLL_ENGINE_HPP
#define PAYROLL_ENGINE_HPP

#include "Employee.hpp"
#include "AttendanceRecord.hpp"
#include "PayrollSlip.hpp"
#include "ECRExportFormatter.hpp"
#include "ESICExportFormatter.hpp"
#include <vector>
#include <map>
#include <string>

/**
 * @brief Facade class that orchestrates batch payroll processing,
 * statutory calculations, summary generation, and portal export file preparation.
 */
class PayrollEngine {
private:
    double pfCeiling;
    double esicCeiling;
    bool restrictPfCeiling;
    std::vector<PayrollSlip> processedSlips;

public:
    PayrollEngine(double pfLimit = 15000.0,
                  double esicLimit = 21000.0,
                  bool limitPf = true);

    // Core processing methods
    PayrollSlip processEmployee(int month,
                                int year,
                                const Employee& emp,
                                const AttendanceRecord& att,
                                double pt = 0.0,
                                double tds = 0.0);

    void processBatch(int month,
                      int year,
                      const std::vector<Employee>& employees,
                      const std::vector<AttendanceRecord>& attendances);

    // Accessors
    const std::vector<PayrollSlip>& getProcessedSlips() const { return processedSlips; }
    void clear() { processedSlips.clear(); }

    // Summary calculations
    double getTotalGrossEarned() const;
    double getTotalNetPayable() const;
    double getTotalEmployeePF() const;
    double getTotalEmployerPF() const;
    double getTotalEmployerEPS() const;
    double getTotalEmployeeESIC() const;
    double getTotalEmployerESIC() const;
    double getTotalEDLI() const;
    double getTotalAdminCharges() const;

    // Export formats
    std::string generateECRText() const;
    std::string generateESICCSV() const;
    std::string getBatchSummaryJSON(int month, int year) const;

    // JSON IPC Handler (invoked by Node.js backend)
    std::string processJSONInput(const std::string& inputJson);

    // Self-test suite (for terminal evaluation / college viva)
    static bool runSelfTestSuite();
};

#endif // PAYROLL_ENGINE_HPP
