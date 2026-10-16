#ifndef ESIC_EXPORT_FORMATTER_HPP
#define ESIC_EXPORT_FORMATTER_HPP

#include "PayrollSlip.hpp"
#include <vector>
#include <string>

/**
 * @brief Formats monthly ESIC records into the official ESIC Portal Monthly Contribution CSV/Excel upload format.
 * Header: IP Number,IP Name,No of Days for which wages paid,Total Monthly Wages,Reason Code for Zero Working Days,Last Working Day
 */
class ESICExportFormatter {
public:
    static std::string formatSingleRecord(const PayrollSlip& slip);
    static std::string generateESICFile(const std::vector<PayrollSlip>& slips);
};

#endif // ESIC_EXPORT_FORMATTER_HPP
