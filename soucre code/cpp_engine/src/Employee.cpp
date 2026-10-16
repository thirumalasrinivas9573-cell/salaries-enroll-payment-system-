#include "../include/Employee.hpp"
#include "../include/SimpleJson.hpp"
#include <sstream>

Employee::Employee(int empId,
                   const std::string& code,
                   const std::string& name,
                   const std::string& desig,
                   const std::string& dept,
                   const std::string& uanNum,
                   const std::string& esicNum,
                   const SalaryStructure& sal)
    : id(empId),
      empCode(code),
      fullName(name),
      designation(desig),
      department(dept),
      joiningDate(""),
      bankName(""),
      bankAccount(""),
      ifsc(""),
      pan(""),
      uan(uanNum),
      esicIp(esicNum),
      pfOptOut(false),
      esicOptOut(false),
      active(true),
      salary(sal) {}

std::string Employee::toJSON() const {
    std::ostringstream ss;
    ss << "{"
       << "\"id\":" << id << ","
       << "\"empCode\":\"" << json_utils::escape(empCode) << "\","
       << "\"fullName\":\"" << json_utils::escape(fullName) << "\","
       << "\"designation\":\"" << json_utils::escape(designation) << "\","
       << "\"department\":\"" << json_utils::escape(department) << "\","
       << "\"joiningDate\":\"" << json_utils::escape(joiningDate) << "\","
       << "\"bankName\":\"" << json_utils::escape(bankName) << "\","
       << "\"bankAccount\":\"" << json_utils::escape(bankAccount) << "\","
       << "\"ifsc\":\"" << json_utils::escape(ifsc) << "\","
       << "\"pan\":\"" << json_utils::escape(pan) << "\","
       << "\"uan\":\"" << json_utils::escape(uan) << "\","
       << "\"esicIp\":\"" << json_utils::escape(esicIp) << "\","
       << "\"pfOptOut\":" << (pfOptOut ? "true" : "false") << ","
       << "\"esicOptOut\":" << (esicOptOut ? "true" : "false") << ","
       << "\"active\":" << (active ? "true" : "false") << ","
       << "\"salaryStructure\":" << salary.toJSON()
       << "}";
    return ss.str();
}
