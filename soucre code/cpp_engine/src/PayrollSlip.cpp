#include "../include/PayrollSlip.hpp"
#include "../include/SimpleJson.hpp"
#include <sstream>
#include <iomanip>
#include <cmath>

PayrollSlip::PayrollSlip(int m,
                         int y,
                         const Employee& emp,
                         const AttendanceRecord& att,
                         const EPFCalculator& epf,
                         const ESICCalculator& esic,
                         double pt,
                         double tds)
    : month(m),
      year(y),
      employee(emp),
      attendance(att),
      earnedBasic(0.0),
      earnedDA(0.0),
      earnedHRA(0.0),
      earnedConveyance(0.0),
      earnedMedical(0.0),
      earnedSpecial(0.0),
      earnedOther(0.0),
      overtimeHours(att.getOvertimeHours()),
      overtimePay(0.0),
      grossEarned(0.0),
      pfWageBase(epf.getEpfWage()),
      esicWageBase(esic.getEsicWage()),
      epfEmployee(0.0),
      esicEmployee(0.0),
      professionalTax(pt >= 0 ? pt : 0.0),
      advanceDeducted(att.getAdvanceDeduction()),
      otherDeductions(att.getOtherDeductions()),
      incomeTaxTDS(tds >= 0 ? tds : 0.0),
      totalDeductions(0.0),
      netPayable(0.0),
      epfDetails(epf),
      esicDetails(esic) {

    int calDays = attendance.getCalendarDays();
    double paidDays = attendance.getPaidDays();
    const SalaryStructure& sal = employee.getSalaryStructure();

    // 1. Prorate earnings based on payable days vs calendar days
    earnedBasic = sal.getProratedBasic(paidDays, calDays);
    earnedDA = sal.getProratedDA(paidDays, calDays);
    earnedHRA = sal.getProratedHRA(paidDays, calDays);
    earnedConveyance = sal.getProratedConveyance(paidDays, calDays);
    earnedMedical = sal.getProratedMedical(paidDays, calDays);
    earnedSpecial = sal.getProratedSpecial(paidDays, calDays);
    earnedOther = sal.getProratedOther(paidDays, calDays);

    // 2. Overtime: explicit overtime amount takes precedence if provided (> 0);
    // otherwise calculated from overtime hours at double standard rate.
    if (attendance.getOvertimeAmount() > 0.0) {
        overtimePay = attendance.getOvertimeAmount();
    } else if (overtimeHours > 0.0 && paidDays > 0.0 && earnedBasic > 0.0) {
        double hourlyRate = earnedBasic / (paidDays * 8.0);
        overtimePay = std::round(hourlyRate * 2.0 * overtimeHours * 100.0) / 100.0;
    } else {
        overtimePay = 0.0;
    }

    grossEarned = earnedBasic + earnedDA + earnedHRA + earnedConveyance +
                  earnedMedical + earnedSpecial + earnedOther + overtimePay;

    // 3. Employee Statutory & Authorized Deductions
    epfEmployee = epfDetails.getEmployeeContribution();
    esicEmployee = esicDetails.getEmployeeContribution();

    // Standard Professional Tax: ₹200 if gross > ₹15,000 and pt not explicitly supplied
    if (professionalTax == 0.0 && grossEarned > 15000.0) {
        professionalTax = 200.0;
    }

    totalDeductions = epfEmployee + esicEmployee + professionalTax +
                      advanceDeducted + otherDeductions + incomeTaxTDS;

    // Net Take-Home Pay = Gross - Employee Deductions (ensuring no double deductions)
    netPayable = std::max(0.0, grossEarned - totalDeductions);
}

std::string PayrollSlip::toJSON() const {
    std::ostringstream ss;
    ss << std::fixed << std::setprecision(2);
    ss << "{"
       << "\"month\":" << month << ","
       << "\"year\":" << year << ","
       << "\"employee\":" << employee.toJSON() << ","
       << "\"attendance\":" << attendance.toJSON() << ","
       << "\"earnings\":{"
       << "\"earnedBasic\":" << earnedBasic << ","
       << "\"earnedDA\":" << earnedDA << ","
       << "\"earnedHRA\":" << earnedHRA << ","
       << "\"earnedConveyance\":" << earnedConveyance << ","
       << "\"earnedMedical\":" << earnedMedical << ","
       << "\"earnedSpecial\":" << earnedSpecial << ","
       << "\"earnedOther\":" << earnedOther << ","
       << "\"overtimeHours\":" << overtimeHours << ","
       << "\"overtimePay\":" << overtimePay << ","
       << "\"grossEarned\":" << grossEarned
       << "},"
       << "\"wageBases\":{"
       << "\"grossSalary\":" << grossEarned << ","
       << "\"pfWageBase\":" << pfWageBase << ","
       << "\"esicWageBase\":" << esicWageBase << ","
       << "\"areIdentical\":" << ((std::abs(grossEarned - pfWageBase) < 0.01 && std::abs(grossEarned - esicWageBase) < 0.01) ? "true" : "false")
       << "},"
       << "\"deductions\":{"
       << "\"epfEmployee\":" << epfEmployee << ","
       << "\"esicEmployee\":" << esicEmployee << ","
       << "\"professionalTax\":" << professionalTax << ","
       << "\"advanceDeducted\":" << advanceDeducted << ","
       << "\"otherDeductions\":" << otherDeductions << ","
       << "\"incomeTaxTDS\":" << incomeTaxTDS << ","
       << "\"totalDeductions\":" << totalDeductions
       << "},"
       << "\"netPayable\":" << netPayable << ","
       << "\"employerCosts\":{"
       << "\"employerEPF\":" << getEmployerEPF() << ","
       << "\"employerEPS\":" << getEmployerEPS() << ","
       << "\"employerEDLI\":" << getEmployerEDLI() << ","
       << "\"employerAdmin\":" << getEmployerAdmin() << ","
       << "\"employerESIC\":" << getEmployerESIC() << ","
       << "\"totalEmployerStatutory\":" << getTotalEmployerStatutory() << ","
       << "\"totalCTC\":" << getTotalCTC()
       << "},"
       << "\"epfBreakdown\":" << epfDetails.toJSON() << ","
       << "\"esicBreakdown\":" << esicDetails.toJSON()
       << "}";
    return ss.str();
}

std::string PayrollSlip::toFormattedString() const {
    std::ostringstream ss;
    ss << std::fixed << std::setprecision(2);
    ss << "=======================================================================\n";
    ss << "                     SALARY ENROLL PAY SYSTEM SLIP                     \n";
    ss << "=======================================================================\n";
    ss << " Employee Code : " << std::left << std::setw(15) << employee.getEmpCode()
       << " Name        : " << employee.getFullName() << "\n";
    ss << " Designation   : " << std::left << std::setw(15) << employee.getDesignation()
       << " Department  : " << employee.getDepartment() << "\n";
    ss << " UAN Number    : " << std::left << std::setw(15) << (employee.getUan().empty() ? "N/A" : employee.getUan())
       << " ESIC IP No  : " << (employee.getEsicIp().empty() ? "N/A" : employee.getEsicIp()) << "\n";
    ss << " Bank Account  : " << std::left << std::setw(15) << employee.getBankAccount()
       << " IFSC Code   : " << employee.getIfsc() << "\n";
    ss << " Month / Year  : " << month << " / " << year
       << "       Paid Days    : " << attendance.getPaidDays() << " / " << attendance.getCalendarDays() << "\n";
    ss << " NCP (Absent)  : " << attendance.getNcpDays()
       << " Days          Overtime     : " << overtimeHours << " hrs (INR " << overtimePay << ")\n";
    ss << "-----------------------------------------------------------------------\n";
    ss << " STATUTORY WAGE BASES (INR): Gross=" << grossEarned
       << " | PF Wage=" << pfWageBase << " | ESIC Wage=" << esicWageBase << "\n";
    ss << "-----------------------------------------------------------------------\n";
    ss << " EARNINGS (INR)                        DEDUCTIONS (INR)                \n";
    ss << "-----------------------------------------------------------------------\n";
    ss << " Basic Wage        : " << std::right << std::setw(10) << earnedBasic
       << "     EPF Employee (12%) : " << std::setw(10) << epfEmployee << "\n";
    ss << " Dearness Allow(DA): " << std::setw(10) << earnedDA
       << "     ESIC Employee(0.75): " << std::setw(10) << esicEmployee << "\n";
    ss << " House Rent (HRA)  : " << std::setw(10) << earnedHRA
       << "     Professional Tax   : " << std::setw(10) << professionalTax << "\n";
    ss << " Conveyance Allow  : " << std::setw(10) << earnedConveyance
       << "     Advance Recovery   : " << std::setw(10) << advanceDeducted << "\n";
    ss << " Medical / Special : " << std::setw(10) << (earnedMedical + earnedSpecial + earnedOther)
       << "     Other Authorized   : " << std::setw(10) << otherDeductions << "\n";
    ss << " Overtime Pay      : " << std::setw(10) << overtimePay
       << "     TDS / Income Tax   : " << std::setw(10) << incomeTaxTDS << "\n";
    ss << "-----------------------------------------------------------------------\n";
    ss << " GROSS EARNED      : " << std::setw(10) << grossEarned
       << "     TOTAL DEDUCTIONS   : " << std::setw(10) << totalDeductions << "\n";
    ss << "=======================================================================\n";
    ss << " NET TAKE-HOME PAY : INR " << netPayable << "\n";
    ss << "=======================================================================\n";
    ss << " EMPLOYER STATUTORY CONTRIBUTIONS (NOT DEDUCTED FROM EMPLOYEE PAY):\n";
    ss << "   • EPF (A/c 01)     : INR " << getEmployerEPF() << "\n";
    ss << "   • EPS Pension (10) : INR " << getEmployerEPS() << "\n";
    ss << "   • EDLI (A/c 21)    : INR " << getEmployerEDLI() << "\n";
    ss << "   • Admin (A/c 02)   : INR " << getEmployerAdmin() << "\n";
    ss << "   • ESIC (3.25%)     : INR " << getEmployerESIC() << "\n";
    ss << "   • TOTAL EMPLOYER   : INR " << getTotalEmployerStatutory() << "\n";
    ss << "   • TOTAL CTC        : INR " << getTotalCTC() << "\n";
    ss << "=======================================================================\n";
    return ss.str();
}
