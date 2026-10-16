#ifndef ECR_EXPORT_FORMATTER_HPP
#define ECR_EXPORT_FORMATTER_HPP

#include "PayrollSlip.hpp"
#include <vector>
#include <string>

/**
 * @brief Formats monthly PF records into the official EPFO ECR (Electronic Challan cum Return) text file format.
 * Format: UAN#~#MemberName#~#GrossWages#~#EPFWages#~#EPSWages#~#EDLIWages#~#EEShare#~#EPSContribution#~#ERShareDiff#~#NCPDays#~#RefundOfAdvances
 */
class ECRExportFormatter {
public:
    static std::string formatSingleRecord(const PayrollSlip& slip);
    static std::string generateECRFile(const std::vector<PayrollSlip>& slips);
};

#endif // ECR_EXPORT_FORMATTER_HPP
