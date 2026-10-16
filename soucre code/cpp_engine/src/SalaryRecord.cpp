#include "../include/SalaryRecord.hpp"
#include <algorithm>
#include <iomanip>

SalaryRecord::SalaryRecord()
    : basicPaise(0LL), daPaise(0LL), hraPaise(0LL), conveyancePaise(0LL),
      medicalPaise(0LL), specialPaise(0LL), otherEarningsPaise(0LL),
      overtimePaise(0LL), grossEarnedPaise(0LL),
      epfEmployeePaise(0LL), esicEmployeePaise(0LL), ptPaise(0LL),
      advanceDeductedPaise(0LL), otherDeductionsPaise(0LL), tdsPaise(0LL),
      totalDeductionsPaise(0LL), netPayablePaise(0LL) {}

SalaryRecord::SalaryRecord(double basic, double da, double hra, double conveyance,
                           double medical, double special, double otherEarnings,
                           double overtimePay, double epfEE, double esicEE,
                           double pt, double advance, double otherDed, double tds)
    : basicPaise(MoneyUtil::toPaise(basic)),
      daPaise(MoneyUtil::toPaise(da)),
      hraPaise(MoneyUtil::toPaise(hra)),
      conveyancePaise(MoneyUtil::toPaise(conveyance)),
      medicalPaise(MoneyUtil::toPaise(medical)),
      specialPaise(MoneyUtil::toPaise(special)),
      otherEarningsPaise(MoneyUtil::toPaise(otherEarnings)),
      overtimePaise(MoneyUtil::toPaise(overtimePay)),
      grossEarnedPaise(0LL),
      epfEmployeePaise(MoneyUtil::toPaise(epfEE)),
      esicEmployeePaise(MoneyUtil::toPaise(esicEE)),
      ptPaise(MoneyUtil::toPaise(pt)),
      advanceDeductedPaise(MoneyUtil::toPaise(advance)),
      otherDeductionsPaise(MoneyUtil::toPaise(otherDed)),
      tdsPaise(MoneyUtil::toPaise(tds)),
      totalDeductionsPaise(0LL),
      netPayablePaise(0LL) {
    computeNetPay();
}

void SalaryRecord::computeNetPay() {
    // 1. Gross Earnings = Basic + DA + HRA + Conveyance + Medical + Special + Other + Overtime
    grossEarnedPaise = basicPaise + daPaise + hraPaise + conveyancePaise +
                       medicalPaise + specialPaise + otherEarningsPaise + overtimePaise;

    // 2. Total Deductions = EPF (EE) + ESIC (EE) + PT + Advance + Other Deductions + TDS
    // Ensures each deduction is counted strictly once
    totalDeductionsPaise = epfEmployeePaise + esicEmployeePaise + ptPaise +
                           advanceDeductedPaise + otherDeductionsPaise + tdsPaise;

    // 3. Net Pay = Gross Earnings - Employee Deductions (guaranteed non-negative)
    if (grossEarnedPaise >= totalDeductionsPaise) {
        netPayablePaise = grossEarnedPaise - totalDeductionsPaise;
    } else {
        netPayablePaise = 0LL;
    }
}

void SalaryRecord::setOvertimePay(double otPay) {
    overtimePaise = MoneyUtil::toPaise(otPay);
    computeNetPay();
}

void SalaryRecord::setEpfEmployee(double epf) {
    epfEmployeePaise = MoneyUtil::toPaise(epf);
    computeNetPay();
}

void SalaryRecord::setEsicEmployee(double esic) {
    esicEmployeePaise = MoneyUtil::toPaise(esic);
    computeNetPay();
}

void SalaryRecord::setAdvanceDeducted(double adv) {
    advanceDeductedPaise = MoneyUtil::toPaise(adv);
    computeNetPay();
}

void SalaryRecord::setOtherDeductions(double other) {
    otherDeductionsPaise = MoneyUtil::toPaise(other);
    computeNetPay();
}

std::string SalaryRecord::toJSON() const {
    std::ostringstream ss;
    ss << "{"
       << "\"earnedBasic\":" << getEarnedBasic() << ","
       << "\"earnedDA\":" << getEarnedDA() << ","
       << "\"earnedHRA\":" << getEarnedHRA() << ","
       << "\"earnedConveyance\":" << getEarnedConveyance() << ","
       << "\"earnedMedical\":" << getEarnedMedical() << ","
       << "\"earnedSpecial\":" << getEarnedSpecial() << ","
       << "\"earnedOther\":" << getEarnedOther() << ","
       << "\"overtimePay\":" << getOvertimePay() << ","
       << "\"grossEarned\":" << getGrossEarned() << ","
       << "\"epfEmployee\":" << getEpfEmployee() << ","
       << "\"esicEmployee\":" << getEsicEmployee() << ","
       << "\"professionalTax\":" << getProfessionalTax() << ","
       << "\"advanceDeducted\":" << getAdvanceDeducted() << ","
       << "\"otherDeductions\":" << getOtherDeductions() << ","
       << "\"incomeTaxTDS\":" << getIncomeTaxTDS() << ","
       << "\"totalDeductions\":" << getTotalDeductions() << ","
       << "\"netPayable\":" << getNetPayable()
       << "}";
    return ss.str();
}
