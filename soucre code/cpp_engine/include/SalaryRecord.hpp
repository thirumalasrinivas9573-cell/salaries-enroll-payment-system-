#pragma once
#include <string>
#include <sstream>
#include "MoneyUtil.hpp"

/**
 * @class SalaryRecord
 * @brief Encapsulates monthly prorated earnings, statutory/authorized deductions, and net pay.
 *
 * OOP CONCEPTS DEMONSTRATED:
 * 1. Encapsulation: All monetary figures are stored in integer paise internally,
 *    preventing floating-point accumulation inaccuracies. Access is strictly
 *    controlled through validated getters.
 * 2. Abstraction: Provides clear methods to compute Net Pay:
 *    Net Pay = Gross Earnings - Employee Deductions - Authorized Advances/Deductions,
 *    ensuring deductions are subtracted exactly once and net pay never goes negative.
 */
class SalaryRecord {
private:
    // Earnings in paise
    long long basicPaise;
    long long daPaise;
    long long hraPaise;
    long long conveyancePaise;
    long long medicalPaise;
    long long specialPaise;
    long long otherEarningsPaise;
    long long overtimePaise;
    long long grossEarnedPaise;

    // Deductions in paise
    long long epfEmployeePaise;
    long long esicEmployeePaise;
    long long ptPaise;
    long long advanceDeductedPaise;
    long long otherDeductionsPaise;
    long long tdsPaise;
    long long totalDeductionsPaise;

    // Net Payable in paise
    long long netPayablePaise;

public:
    // Constructors
    SalaryRecord();
    SalaryRecord(double basic, double da, double hra, double conveyance,
                 double medical, double special, double otherEarnings,
                 double overtimePay, double epfEE, double esicEE,
                 double pt, double advance, double otherDed, double tds);

    // Destructor
    virtual ~SalaryRecord() = default;

    // Recompute subtotals and net pay ensuring single deduction count and non-negative net pay
    void computeNetPay();

    // Earnings Getters (in Rupees)
    double getEarnedBasic() const { return MoneyUtil::toRupees(basicPaise); }
    double getEarnedDA() const { return MoneyUtil::toRupees(daPaise); }
    double getEarnedHRA() const { return MoneyUtil::toRupees(hraPaise); }
    double getEarnedConveyance() const { return MoneyUtil::toRupees(conveyancePaise); }
    double getEarnedMedical() const { return MoneyUtil::toRupees(medicalPaise); }
    double getEarnedSpecial() const { return MoneyUtil::toRupees(specialPaise); }
    double getEarnedOther() const { return MoneyUtil::toRupees(otherEarningsPaise); }
    double getOvertimePay() const { return MoneyUtil::toRupees(overtimePaise); }
    double getGrossEarned() const { return MoneyUtil::toRupees(grossEarnedPaise); }

    // Deductions Getters (in Rupees)
    double getEpfEmployee() const { return MoneyUtil::toRupees(epfEmployeePaise); }
    double getEsicEmployee() const { return MoneyUtil::toRupees(esicEmployeePaise); }
    double getProfessionalTax() const { return MoneyUtil::toRupees(ptPaise); }
    double getAdvanceDeducted() const { return MoneyUtil::toRupees(advanceDeductedPaise); }
    double getOtherDeductions() const { return MoneyUtil::toRupees(otherDeductionsPaise); }
    double getIncomeTaxTDS() const { return MoneyUtil::toRupees(tdsPaise); }
    double getTotalDeductions() const { return MoneyUtil::toRupees(totalDeductionsPaise); }

    // Net Payable Getter (in Rupees)
    double getNetPayable() const { return MoneyUtil::toRupees(netPayablePaise); }

    // Paise Getters (for exact arithmetic)
    long long getGrossEarnedPaise() const { return grossEarnedPaise; }
    long long getTotalDeductionsPaise() const { return totalDeductionsPaise; }
    long long getNetPayablePaise() const { return netPayablePaise; }

    // Setters
    void setOvertimePay(double otPay);
    void setEpfEmployee(double epf);
    void setEsicEmployee(double esic);
    void setAdvanceDeducted(double adv);
    void setOtherDeductions(double other);

    std::string toJSON() const;
};
