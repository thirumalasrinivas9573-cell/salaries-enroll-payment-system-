#ifndef EMPLOYEE_HPP
#define EMPLOYEE_HPP

#include "SalaryStructure.hpp"
#include <string>

/**
 * @brief Represents an employee master record.
 * Demonstrates Encapsulation and Object Composition (holds a SalaryStructure).
 */
class Employee {
private:
    int id;
    std::string empCode;
    std::string fullName;
    std::string designation;
    std::string department;
    std::string joiningDate;
    std::string bankName;
    std::string bankAccount;
    std::string ifsc;
    std::string pan;
    std::string uan;            // 12-digit EPFO Universal Account Number
    std::string esicIp;         // 10-digit ESIC Insurance Person Number
    bool pfOptOut;
    bool esicOptOut;
    bool active;
    SalaryStructure salary;     // Composition: Employee HAS-A SalaryStructure

public:
    Employee(int empId = 0,
             const std::string& code = "",
             const std::string& name = "",
             const std::string& desig = "",
             const std::string& dept = "",
             const std::string& uanNum = "",
             const std::string& esicNum = "",
             const SalaryStructure& sal = SalaryStructure());

    // Getters
    int getId() const { return id; }
    std::string getEmpCode() const { return empCode; }
    std::string getFullName() const { return fullName; }
    std::string getDesignation() const { return designation; }
    std::string getDepartment() const { return department; }
    std::string getJoiningDate() const { return joiningDate; }
    std::string getBankName() const { return bankName; }
    std::string getBankAccount() const { return bankAccount; }
    std::string getIfsc() const { return ifsc; }
    std::string getPan() const { return pan; }
    std::string getUan() const { return uan; }
    std::string getEsicIp() const { return esicIp; }
    bool isPfOptOut() const { return pfOptOut; }
    bool isEsicOptOut() const { return esicOptOut; }
    bool isActive() const { return active; }
    const SalaryStructure& getSalaryStructure() const { return salary; }
    SalaryStructure& getSalaryStructureRef() { return salary; }

    // Setters
    void setId(int empId) { id = empId; }
    void setEmpCode(const std::string& code) { empCode = code; }
    void setFullName(const std::string& name) { fullName = name; }
    void setDesignation(const std::string& desig) { designation = desig; }
    void setDepartment(const std::string& dept) { department = dept; }
    void setJoiningDate(const std::string& date) { joiningDate = date; }
    void setBankName(const std::string& bName) { bankName = bName; }
    void setBankAccount(const std::string& acc) { bankAccount = acc; }
    void setIfsc(const std::string& code) { ifsc = code; }
    void setPan(const std::string& panNum) { pan = panNum; }
    void setUan(const std::string& uanNum) { uan = uanNum; }
    void setEsicIp(const std::string& esicNum) { esicIp = esicNum; }
    void setPfOptOut(bool opt) { pfOptOut = opt; }
    void setEsicOptOut(bool opt) { esicOptOut = opt; }
    void setActive(bool status) { active = status; }
    void setSalaryStructure(const SalaryStructure& sal) { salary = sal; }

    std::string toJSON() const;
};

#endif // EMPLOYEE_HPP
