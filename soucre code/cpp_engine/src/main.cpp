#include "../include/PayrollEngine.hpp"
#include <iostream>
#include <fstream>
#include <sstream>
#include <string>

void printHelp() {
    std::cout << "Salary Enroll Pay System — C++17 OOP Calculation Engine\n";
    std::cout << "Usage:\n";
    std::cout << "  ./payroll_engine --json [filepath]    Process JSON input from file or stdin\n";
    std::cout << "  ./payroll_engine --test               Run automated C++ OOP unit test suite\n";
    std::cout << "  ./payroll_engine --cli                Run interactive terminal payroll calculator\n";
    std::cout << "  ./payroll_engine --help               Display this help guide\n";
}

void runInteractiveCLI() {
    std::cout << "\n=======================================================================\n";
    std::cout << "   SALARY ENROLL PAY SYSTEM — INTERACTIVE TERMINAL EVALUATOR           \n";
    std::cout << "=======================================================================\n";
    
    std::string empCode, name, desig, dept, uan, esicIp;
    double basic = 0.0, da = 0.0, hra = 0.0, special = 0.0;
    int calDays = 30;
    double present = 26.0, absent = 0.0, otHours = 0.0, advance = 0.0;

    std::cout << "Enter Employee Code (e.g., EMP001)       : ";
    if (!(std::cin >> empCode)) return;
    std::cin.ignore();

    std::cout << "Enter Full Name                          : ";
    std::getline(std::cin, name);

    std::cout << "Enter Designation                        : ";
    std::getline(std::cin, desig);

    std::cout << "Enter Department                         : ";
    std::getline(std::cin, dept);

    std::cout << "Enter 12-digit UAN (EPFO)                : ";
    std::getline(std::cin, uan);

    std::cout << "Enter 10-digit ESIC IP No                : ";
    std::getline(std::cin, esicIp);

    std::cout << "Enter Monthly Basic Wage (INR)           : ";
    std::cin >> basic;

    std::cout << "Enter Monthly Dearness Allowance DA (INR): ";
    std::cin >> da;

    std::cout << "Enter Monthly HRA (INR)                  : ";
    std::cin >> hra;

    std::cout << "Enter Special Allowance (INR)            : ";
    std::cin >> special;

    std::cout << "Total Calendar Days in Month (e.g. 30)   : ";
    std::cin >> calDays;

    std::cout << "Present Days                             : ";
    std::cin >> present;

    std::cout << "Absent / Unpaid Leave Days (NCP Days)    : ";
    std::cin >> absent;

    std::cout << "Overtime Hours Worked                    : ";
    std::cin >> otHours;

    std::cout << "Salary Advance to Deduct (INR)           : ";
    std::cin >> advance;

    SalaryStructure sal(basic, da, hra, 0.0, 0.0, special, 0.0);
    Employee emp(1, empCode, name, desig, dept, uan, esicIp, sal);
    AttendanceRecord att(calDays, present, 0.0, (calDays - present - absent), absent, otHours, advance);

    PayrollEngine engine;
    PayrollSlip slip = engine.processEmployee(10, 2026, emp, att);

    std::cout << "\n" << slip.toFormattedString() << "\n";
    std::cout << "EPFO ECR 2.0 Export Line:\n";
    std::cout << ECRExportFormatter::formatSingleRecord(slip) << "\n\n";
    std::cout << "ESIC Monthly Contribution CSV Line:\n";
    std::cout << ESICExportFormatter::formatSingleRecord(slip) << "\n\n";
}

int main(int argc, char* argv[]) {
    if (argc < 2) {
        printHelp();
        return 0;
    }

    std::string mode = argv[1];

    if (mode == "--test") {
        bool ok = PayrollEngine::runSelfTestSuite();
        return ok ? 0 : 1;
    } else if (mode == "--cli") {
        runInteractiveCLI();
        return 0;
    } else if (mode == "--help" || mode == "-h") {
        printHelp();
        return 0;
    } else if (mode == "--json") {
        std::string jsonContent;
        if (argc >= 3) {
            std::ifstream inFile(argv[2]);
            if (!inFile.is_open()) {
                std::cerr << "{\"success\":false,\"error\":\"Failed to open input file\"}\n";
                return 1;
            }
            std::stringstream buffer;
            buffer << inFile.rdbuf();
            jsonContent = buffer.str();
        } else {
            // Read from standard input
            std::stringstream buffer;
            buffer << std::cin.rdbuf();
            jsonContent = buffer.str();
        }

        PayrollEngine engine;
        std::string response = engine.processJSONInput(jsonContent);
        std::cout << response << std::endl;
        return 0;
    } else {
        std::cerr << "Unknown argument: " << mode << "\n";
        printHelp();
        return 1;
    }
}
