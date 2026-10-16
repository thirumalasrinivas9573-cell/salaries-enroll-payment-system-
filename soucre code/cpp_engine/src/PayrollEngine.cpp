#include "../include/PayrollEngine.hpp"
#include "../include/SimpleJson.hpp"
#include "../include/ContributionRule.hpp"
#include "../include/Overtime.hpp"
#include "../include/Attendance.hpp"
#include "../include/SalaryRecord.hpp"
#include "../include/PFCalculator.hpp"
#include "../include/PayrollProcessor.hpp"
#include "../include/ReportGenerator.hpp"
#include <sstream>
#include <iomanip>
#include <iostream>
#include <cmath>
#include <cassert>

PayrollEngine::PayrollEngine(double pfLimit, double esicLimit, bool limitPf)
    : pfCeiling(pfLimit > 0 ? pfLimit : 15000.0),
      esicCeiling(esicLimit > 0 ? esicLimit : 21000.0),
      restrictPfCeiling(limitPf) {}

PayrollSlip PayrollEngine::processEmployee(int month,
                                           int year,
                                           const Employee& emp,
                                           const AttendanceRecord& att,
                                           double pt,
                                           double tds) {
    const SalaryStructure& sal = emp.getSalaryStructure();
    int calDays = att.getCalendarDays();
    double paidDays = att.getPaidDays();

    // 1. Prorated regular earnings
    double earnedBasic = sal.getProratedBasic(paidDays, calDays);
    double earnedDA = sal.getProratedDA(paidDays, calDays);
    double earnedBasicDA = earnedBasic + earnedDA;
    double earnedGrossBase = sal.getProratedGross(paidDays, calDays);

    // 2. Overtime calculation
    double otPay = 0.0;
    if (att.getOvertimeAmount() > 0.0) {
        otPay = att.getOvertimeAmount();
    } else if (att.getOvertimeHours() > 0.0 && paidDays > 0.0 && earnedBasic > 0.0) {
        double hourly = earnedBasic / (paidDays * 8.0);
        otPay = std::round(hourly * 2.0 * att.getOvertimeHours() * 100.0) / 100.0;
    }
    double totalEarnedGross = earnedGrossBase + otPay;

    // 3. Determine Distinct PF Wage Base
    // If company configured a custom/explicit PF wage base, use it;
    // otherwise use default earned Basic + DA
    double pfBase = 0.0;
    if (att.getCustomPfWage() > 0.0) {
        pfBase = att.getCustomPfWage();
    } else {
        pfBase = earnedBasicDA;
    }

    // 4. EPF Calculator
    bool pfEligible = !emp.isPfOptOut() && !emp.getUan().empty();
    EPFCalculator epfCalc(pfEligible, restrictPfCeiling, true, pfCeiling);
    epfCalc.calculate(pfBase, totalEarnedGross, static_cast<int>(paidDays), calDays);

    // 5. Determine Distinct ESIC Wage Base
    // An employee is covered under ESIC if fixed monthly gross <= ₹21,000 ceiling, not opted out, and IP present.
    // If company configured a custom ESIC wage base, use it; otherwise use total earned gross.
    bool esicEligible = !emp.isEsicOptOut() && !emp.getEsicIp().empty() && (sal.getMonthlyGross() <= esicCeiling);
    double esicBase = 0.0;
    if (esicEligible) {
        if (att.getCustomEsicWage() > 0.0) {
            esicBase = att.getCustomEsicWage();
        } else {
            esicBase = totalEarnedGross;
        }
    }
    ESICCalculator esicCalc(esicEligible, esicCeiling, 176.0);
    esicCalc.calculate(pfBase, esicBase, static_cast<int>(paidDays), calDays);

    // 6. Construct and return PayrollSlip
    return PayrollSlip(month, year, emp, att, epfCalc, esicCalc, pt, tds);
}

void PayrollEngine::processBatch(int month,
                                 int year,
                                 const std::vector<Employee>& employees,
                                 const std::vector<AttendanceRecord>& attendances) {
    processedSlips.clear();
    size_t count = std::min(employees.size(), attendances.size());
    for (size_t i = 0; i < count; ++i) {
        if (employees[i].isActive()) {
            processedSlips.push_back(processEmployee(month, year, employees[i], attendances[i]));
        }
    }
}

double PayrollEngine::getTotalGrossEarned() const {
    double total = 0.0;
    for (const auto& slip : processedSlips) total += slip.getGrossEarned();
    return total;
}

double PayrollEngine::getTotalNetPayable() const {
    double total = 0.0;
    for (const auto& slip : processedSlips) total += slip.getNetPayable();
    return total;
}

double PayrollEngine::getTotalEmployeePF() const {
    double total = 0.0;
    for (const auto& slip : processedSlips) total += slip.getEpfEmployee();
    return total;
}

double PayrollEngine::getTotalEmployerPF() const {
    double total = 0.0;
    for (const auto& slip : processedSlips) total += slip.getEmployerEPF();
    return total;
}

double PayrollEngine::getTotalEmployerEPS() const {
    double total = 0.0;
    for (const auto& slip : processedSlips) total += slip.getEmployerEPS();
    return total;
}

double PayrollEngine::getTotalEmployeeESIC() const {
    double total = 0.0;
    for (const auto& slip : processedSlips) total += slip.getEsicEmployee();
    return total;
}

double PayrollEngine::getTotalEmployerESIC() const {
    double total = 0.0;
    for (const auto& slip : processedSlips) total += slip.getEmployerESIC();
    return total;
}

double PayrollEngine::getTotalEDLI() const {
    double total = 0.0;
    for (const auto& slip : processedSlips) total += slip.getEmployerEDLI();
    return total;
}

double PayrollEngine::getTotalAdminCharges() const {
    double total = 0.0;
    for (const auto& slip : processedSlips) total += slip.getEmployerAdmin();
    return total;
}

std::string PayrollEngine::generateECRText() const {
    return ECRExportFormatter::generateECRFile(processedSlips);
}

std::string PayrollEngine::generateESICCSV() const {
    return ESICExportFormatter::generateESICFile(processedSlips);
}

std::string PayrollEngine::getBatchSummaryJSON(int month, int year) const {
    double totalEEPF = getTotalEmployeePF();
    double totalERPF = getTotalEmployerPF();
    double totalEREPS = getTotalEmployerEPS();
    double totalEDLI = getTotalEDLI();
    double totalAdmin = getTotalAdminCharges();
    double totalPFLiability = totalEEPF + totalERPF + totalEREPS + totalEDLI + totalAdmin;

    double totalEEESIC = getTotalEmployeeESIC();
    double totalERESIC = getTotalEmployerESIC();
    double totalESICLiability = totalEEESIC + totalERESIC;

    double totalDeductions = 0.0;
    for (const auto& slip : processedSlips) {
        totalDeductions += slip.getTotalDeductions();
    }

    double totalEmployerStatutory = (totalERPF + totalEREPS + totalEDLI + totalAdmin) + totalERESIC;
    double totalCTC = getTotalGrossEarned() + totalEmployerStatutory;

    std::ostringstream ss;
    ss << std::fixed << std::setprecision(2);
    ss << "{"
       << "\"month\":" << month << ","
       << "\"year\":" << year << ","
       << "\"totalEmployees\":" << processedSlips.size() << ","
       << "\"totalGrossEarned\":" << getTotalGrossEarned() << ","
       << "\"totalNetPayable\":" << getTotalNetPayable() << ","
       << "\"totalEmployeeDeductions\":" << totalDeductions << ","
       << "\"totalEmployerContributions\":" << totalEmployerStatutory << ","
       << "\"totalEmployeePF\":" << totalEEPF << ","
       << "\"totalEmployerPF\":" << totalERPF << ","
       << "\"totalEmployerEPS\":" << totalEREPS << ","
       << "\"totalEDLI\":" << totalEDLI << ","
       << "\"totalAdminCharges\":" << totalAdmin << ","
       << "\"totalPFLiability\":" << totalPFLiability << ","
       << "\"totalEmployeeESIC\":" << totalEEESIC << ","
       << "\"totalEmployerESIC\":" << totalERESIC << ","
       << "\"totalESICLiability\":" << totalESICLiability << ","
       << "\"totalCTC\":" << totalCTC
       << "}";
    return ss.str();
}

std::string PayrollEngine::processJSONInput(const std::string& inputJson) {
    int month = static_cast<int>(json_utils::getNumber(inputJson, "month", 10));
    int year = static_cast<int>(json_utils::getNumber(inputJson, "year", 2026));

    // Validate period
    if (month < 1 || month > 12) {
        return "{\"success\":false,\"error\":\"Invalid payroll month: " + std::to_string(month) + ". Must be between 1 and 12.\"}";
    }
    if (year < 2000 || year > 2100) {
        return "{\"success\":false,\"error\":\"Invalid payroll year: " + std::to_string(year) + ".\"}";
    }

    double pfLimit = json_utils::getNumber(inputJson, "pfCeiling", 15000.0);
    double esicLimit = json_utils::getNumber(inputJson, "esicCeiling", 21000.0);
    bool restrictPf = json_utils::getBool(inputJson, "restrictPfCeiling", true);
    std::string ruleVersion = json_utils::getString(inputJson, "ruleVersion", "v2026.1");

    pfCeiling = pfLimit;
    esicCeiling = esicLimit;
    restrictPfCeiling = restrictPf;

    std::vector<std::string> itemObjects = json_utils::getObjectArray(inputJson, "items");
    if (itemObjects.empty()) {
        return "{\"success\":false,\"error\":\"No employee records provided in items array.\"}";
    }

    std::vector<Employee> employees;
    std::vector<AttendanceRecord> attendances;

    for (size_t idx = 0; idx < itemObjects.size(); ++idx) {
        const auto& item = itemObjects[idx];

        int id = static_cast<int>(json_utils::getNumber(item, "id", 0));
        std::string code = json_utils::getString(item, "empCode", "");
        if (code.empty()) {
            code = "EMP" + std::to_string(idx + 1);
        }
        std::string name = json_utils::getString(item, "fullName", "Worker");
        std::string desig = json_utils::getString(item, "designation", "Staff");
        std::string dept = json_utils::getString(item, "department", "Operations");
        std::string uan = json_utils::getString(item, "uan", "");
        std::string esicIp = json_utils::getString(item, "esicIp", "");
        bool pfOpt = json_utils::getBool(item, "pfOptOut", false);
        bool esicOpt = json_utils::getBool(item, "esicOptOut", false);
        bool active = json_utils::getBool(item, "active", true);

        // Wage structure inputs
        double basic = json_utils::getNumber(item, "basicWage", 0.0);
        double da = json_utils::getNumber(item, "dearnessAllowance", 0.0);
        double hra = json_utils::getNumber(item, "houseRentAllowance", 0.0);
        double conveyance = json_utils::getNumber(item, "conveyanceAllowance", 0.0);
        double medical = json_utils::getNumber(item, "medicalAllowance", 0.0);
        double special = json_utils::getNumber(item, "specialAllowance", 0.0);
        double other = json_utils::getNumber(item, "otherAllowance", 0.0);

        // Wage negative check
        if (basic < 0.0 || da < 0.0 || hra < 0.0 || conveyance < 0.0 || medical < 0.0 || special < 0.0 || other < 0.0) {
            return "{\"success\":false,\"error\":\"Wage component cannot be negative for employee " + code + " (" + name + ").\"}";
        }

        SalaryStructure sal(basic, da, hra, conveyance, medical, special, other);
        Employee emp(id, code, name, desig, dept, uan, esicIp, sal);
        emp.setPfOptOut(pfOpt);
        emp.setEsicOptOut(esicOpt);
        emp.setActive(active);
        emp.setBankName(json_utils::getString(item, "bankName", ""));
        emp.setBankAccount(json_utils::getString(item, "bankAccount", ""));
        emp.setIfsc(json_utils::getString(item, "ifsc", ""));
        emp.setPan(json_utils::getString(item, "pan", ""));

        // Attendance inputs
        int calDays = static_cast<int>(json_utils::getNumber(item, "calendarDays", 30));
        double present = json_utils::getNumber(item, "presentDays", 26.0);
        double leaves = json_utils::getNumber(item, "paidLeaves", 0.0);
        double weeklyOffs = json_utils::getNumber(item, "weeklyOffs", 4.0);
        double absent = json_utils::getNumber(item, "absentDays", 0.0);
        double otHours = json_utils::getNumber(item, "overtimeHours", 0.0);
        double otAmount = json_utils::getNumber(item, "overtimeAmount", 0.0);
        double advance = json_utils::getNumber(item, "advanceDeduction", 0.0);
        double otherDed = json_utils::getNumber(item, "otherDeductions", 0.0);
        double pfWage = json_utils::getNumber(item, "pfWageBase", 0.0);
        double esicWage = json_utils::getNumber(item, "esicWageBase", 0.0);

        AttendanceRecord att(calDays, present, leaves, weeklyOffs, absent, otHours, otAmount, advance, otherDed, pfWage, esicWage);

        // Attendance Validation
        std::string attError;
        if (!att.validate(attError)) {
            return "{\"success\":false,\"error\":\"Validation failed for employee " + code + ": " + attError + "\"}";
        }

        employees.push_back(emp);
        attendances.push_back(att);
    }

    processBatch(month, year, employees, attendances);

    // Build comprehensive output JSON with transparent breakdown
    std::ostringstream out;
    out << "{"
        << "\"success\":true,"
        << "\"engine\":\"Salary Enroll Pay System C++17 OOP Engine\","
        << "\"ruleVersion\":\"" << json_utils::escape(ruleVersion) << "\","
        << "\"summary\":" << getBatchSummaryJSON(month, year) << ","
        << "\"slips\":[";
    for (size_t i = 0; i < processedSlips.size(); ++i) {
        if (i > 0) out << ",";
        out << processedSlips[i].toJSON();
    }
    out << "],"
        << "\"ecrText\":\"" << json_utils::escape(generateECRText()) << "\","
        << "\"esicCSV\":\"" << json_utils::escape(generateESICCSV()) << "\""
        << "}";

    return out.str();
}

bool PayrollEngine::runSelfTestSuite() {
    std::cout << "\n=======================================================================\n";
    std::cout << "          SALARY ENROLL PAY SYSTEM — C++ OOP VERIFICATION SUITE       \n";
    std::cout << "=======================================================================\n";

    // Test 1: Polymorphism & Statutory Calculator Base Class
    std::cout << "[TEST 1] Polymorphic Statutory Base Class & Derived Calculators ... ";
    StatutoryCalculator* p1 = new EPFCalculator(true, true, true, 15000.0);
    StatutoryCalculator* p2 = new ESICCalculator(true, 21000.0, 176.0);
    assert(p1->getComponentName() == "EPF");
    assert(p2->getComponentName() == "ESIC");
    p1->calculate(12000.0, 18000.0, 30, 30);
    p2->calculate(12000.0, 18000.0, 30, 30);
    assert(p1->getEmployeeContribution() == 1440.0); // 12% of 12000
    assert(p2->getEmployeeContribution() == 135.0);  // 0.75% of 18000
    delete p1;
    delete p2;
    std::cout << "PASSED ✓\n";

    // Test 2: EPF Wage Ceiling & EPS Cap
    std::cout << "[TEST 2] EPF ₹15,000 Ceiling & ₹1,250 EPS Cap Compliance ... ";
    EPFCalculator epfCap(true, true, true, 15000.0);
    epfCap.calculate(25000.0, 45000.0, 30, 30);
    assert(epfCap.getEpfWage() == 15000.0);
    assert(epfCap.getEmployeeContribution() == 1800.0); // 12% of 15000
    assert(epfCap.getEmployerEPS() == 1250.0);          // Max ₹1,250 cap
    assert(epfCap.getEmployerEPF() == 550.0);           // 1800 - 1250 = 550
    assert(epfCap.getEdliCharges() == 75.0);            // 0.5% of 15000
    assert(epfCap.getAdminCharges() == 75.0);           // 0.5% of 15000
    std::cout << "PASSED ✓\n";

    // Test 3: ESIC Wage Ceiling (₹21,000) & Low-Wage Exemption (<= ₹176)
    std::cout << "[TEST 3] ESIC Wage Ceiling (₹21,000) & Low-Wage Exemption ... ";
    SalaryStructure highSal(22000.0);
    Employee highEmp(1, "H1", "Executive", "VP", "Mgmt", "101111111111", "2011111111", highSal);
    AttendanceRecord fullAtt(30, 26, 0, 4, 0);
    PayrollEngine engine;
    PayrollSlip highSlip = engine.processEmployee(10, 2026, highEmp, fullAtt);
    assert(highSlip.getEsicEmployee() == 0.0); // Not eligible (> ₹21k)

    SalaryStructure lowSal(3500.0, 500.0);
    Employee lowEmp(2, "L1", "Helper", "Labor", "Plant", "102222222222", "2022222222", lowSal);
    PayrollSlip lowSlip = engine.processEmployee(10, 2026, lowEmp, fullAtt);
    assert(lowSlip.getESICDetails().getIsDailyWageExempt() == true);
    assert(lowSlip.getEsicEmployee() == 0.0);
    assert(lowSlip.getESICDetails().getEmployerContribution() > 0.0);
    std::cout << "PASSED ✓\n";

    // Test 4: Different Wage Bases (Gross != PF Wage Base != ESIC Wage Base)
    std::cout << "[TEST 4] Different Configured Wage Bases (Gross != PF Base != ESIC Base) ... ";
    SalaryStructure diffSal(15000.0, 3000.0, 5000.0, 2000.0); // Gross = 25,000
    Employee diffEmp(4, "D1", "Technician", "Ops", "Plant", "104444444444", "2044444444", diffSal);
    // Custom PF wage configured at ₹12,000; ESIC not eligible because gross > 21,000
    AttendanceRecord diffAtt(30, 26, 0, 4, 0, 0.0, 0.0, 0.0, 500.0, 12000.0, 0.0);
    PayrollSlip diffSlip = engine.processEmployee(10, 2026, diffEmp, diffAtt);
    assert(diffSlip.getGrossEarned() == 25000.0);
    assert(diffSlip.getPfWageBase() == 12000.0);
    assert(diffSlip.getEpfEmployee() == 1440.0); // 12% of 12,000, NOT 12% of 25,000!
    assert(diffSlip.getOtherDeductions() == 500.0);
    assert(diffSlip.getGrossEarned() != diffSlip.getPfWageBase());
    // Net Pay = 25000 - 1440(PF) - 200(PT) - 500(Other) = 22860
    assert(diffSlip.getNetPayable() == 22860.0);
    // Employer contributions must NOT be subtracted from net pay:
    assert(diffSlip.getEmployerEPF() > 0.0);
    std::cout << "PASSED ✓\n";

    // Test 5: Zero Wages & Inactive Attendance Safety
    std::cout << "[TEST 5] Zero Wages & Zero Attendance Handled Safely ... ";
    SalaryStructure zeroSal(0.0);
    Employee zeroEmp(5, "Z1", "Trainee", "Intern", "R&D", "105555555555", "2055555555", zeroSal);
    AttendanceRecord zeroAtt(30, 0, 0, 0, 30); // 0 paid days
    PayrollSlip zeroSlip = engine.processEmployee(10, 2026, zeroEmp, zeroAtt);
    assert(zeroSlip.getGrossEarned() == 0.0);
    assert(zeroSlip.getEpfEmployee() == 0.0);
    assert(zeroSlip.getEsicEmployee() == 0.0);
    assert(zeroSlip.getNetPayable() == 0.0);
    assert(zeroSlip.getTotalCTC() == 0.0);
    std::cout << "PASSED ✓\n";

    // Test 6: Attendance Validation & Error Detection
    std::cout << "[TEST 6] Invalid Attendance Rejection (present + leaves > calendarDays) ... ";
    AttendanceRecord invalidAtt(30, 28, 5, 4, 0); // 28 + 5 + 4 = 37 > 30
    std::string errMsg;
    bool isValid = invalidAtt.validate(errMsg);
    assert(!isValid);
    assert(errMsg.find("exceed") != std::string::npos);
    std::cout << "PASSED ✓\n";

    // Test 7: Negative Input Rejection in JSON Pipeline
    std::cout << "[TEST 7] Negative Input Detection in JSON-IPC Pipeline ... ";
    std::string badJson = "{\"month\":10,\"year\":2026,\"items\":[{\"empCode\":\"E1\",\"fullName\":\"Test\",\"basicWage\":-5000}]}";
    std::string badRes = engine.processJSONInput(badJson);
    assert(badRes.find("cannot be negative") != std::string::npos);
    std::cout << "PASSED ✓\n";

    // Test 8: Rounding Rules Compliance (EPFO Nearest, ESIC Next Higher Rupee)
    std::cout << "[TEST 8] Statutory Rounding (EPFO Nearest vs ESIC Ceil) ... ";
    // Basic = 12005.40 -> 12% = 1440.648 -> round nearest = 1441
    EPFCalculator roundPF(true, true, true, 15000.0);
    roundPF.calculate(12005.40, 12005.40, 30, 30);
    assert(roundPF.getEmployeeContribution() == 1441.0);

    // ESIC: Gross = 10001.00 -> 0.75% = 75.0075 -> ceil to next rupee = 76
    ESICCalculator roundESIC(true, 21000.0, 176.0);
    roundESIC.calculate(10001.00, 10001.00, 30, 30);
    assert(roundESIC.getEmployeeContribution() == 76.0);
    std::cout << "PASSED ✓\n";

    // Test 9: Overtime Remuneration & Factory Double-Rate Formula
    std::cout << "[TEST 9] Overtime Remuneration & Factory Double-Rate Formula ... ";
    Overtime otCalc(10.0); // 10 hours
    // Basic = 26,000 for 26 days -> 1000/day -> 125/hr -> 2x double rate = 250/hr * 10 hrs = 2500
    double computedOt = otCalc.calculate(26000.0, 26.0);
    assert(computedOt == 2500.0);
    // Explicit override test:
    Overtime otExplicit(5.0, 1800.0);
    assert(otExplicit.calculate(26000.0, 26.0) == 1800.0);
    std::cout << "PASSED ✓\n";

    // Test 10: ContributionRule Versioning & Dependency Injection
    std::cout << "[TEST 10] ContributionRule Versioning & Dependency Injection ... ";
    ContributionRule customRule("v2026.2", "Custom Schedule", "2026-10-01", 18000.0, true, 10.0);
    assert(customRule.getVersion() == "v2026.2");
    PFCalculator customPF(true, customRule);
    customPF.calculate(20000.0, 25000.0, 30, 30);
    assert(customPF.getPfWage() == 18000.0); // Capped at ₹18,000
    assert(customPF.getEmployeeContribution() == 1800.0); // 10% of 18000
    std::cout << "PASSED ✓\n";

    // Test 11: SalaryRecord Exact Arithmetic & Net Pay Invariants
    std::cout << "[TEST 11] SalaryRecord Exact Arithmetic & Net Pay Invariants ... ";
    SalaryRecord sRec(20000.0, 4000.0, 6000.0, 2000.0, 1000.0, 2000.0, 0.0,
                      1500.0, 1800.0, 274.0, 200.0, 1000.0, 500.0, 2000.0);
    // Gross = 20000+4000+6000+2000+1000+2000+0+1500 = 36500
    assert(sRec.getGrossEarned() == 36500.0);
    // Total Ded = 1800+274+200+1000+500+2000 = 5774
    assert(sRec.getTotalDeductions() == 5774.0);
    // Net Pay = 36500 - 5774 = 30726
    assert(sRec.getNetPayable() == 30726.0);
    std::cout << "PASSED ✓\n";

    // Test 12: ReportGenerator & Safe File Handling (std::ofstream & std::ifstream)
    std::cout << "[TEST 12] ReportGenerator & Safe File Handling (std::ofstream / ifstream) ... ";
    ReportGenerator reporter(10, 2026);
    std::string testFile = "build/test_audit_report.txt";
    std::string writeErr, readErr, readBack;
    bool saved = reporter.saveToFile(testFile, "PAYROLL_AUDIT_OK_TEST_DATA\n", writeErr);
    assert(saved);
    bool loaded = reporter.readFromFile(testFile, readBack, readErr);
    assert(loaded);
    assert(readBack == "PAYROLL_AUDIT_OK_TEST_DATA\n");
    std::cout << "PASSED ✓\n";

    std::cout << "-----------------------------------------------------------------------\n";
    std::cout << " ALL C++ OOP UNIT TESTS COMPLETED SUCCESSFULLY (12/12 PASSED) ✓\n";
    std::cout << "=======================================================================\n\n";
    return true;
}
