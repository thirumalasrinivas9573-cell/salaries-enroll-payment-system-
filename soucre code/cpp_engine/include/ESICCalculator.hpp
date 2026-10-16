#ifndef ESIC_CALCULATOR_HPP
#define ESIC_CALCULATOR_HPP

#include "StatutoryCalculator.hpp"
#include "ContributionRule.hpp"
#include "MoneyUtil.hpp"
#include <string>
#include <cmath>

/**
 * @class ESICCalculator
 * @brief Indian Employees' State Insurance Act (ESIC 1948) Calculator.
 *
 * OOP CONCEPTS DEMONSTRATED:
 * 1. Inheritance: Inherits from StatutoryCalculator abstract base class.
 * 2. Polymorphism: Implements pure virtual methods calculate(), getEmployeeContribution(),
 *    getEmployerContribution(), and toJSON().
 * 3. Dependency Injection: Accepts ContributionRule object in constructor.
 * 4. Currency Precision: Applies ESIC higher-rupee ceiling rounding rule (roundCeilRupee).
 */
class ESICCalculator : public StatutoryCalculator {
private:
    bool eligible;
    double wageCeiling;         // Standard statutory ceiling (₹21,000)
    double minDailyWageExempt;  // Daily wage limit exempting employee share (₹176)
    double eeRate;              // Standard 0.75%
    double erRate;              // Standard 3.25%
    
    double esicWage;            // Earned gross wage subject to ESIC
    double employeeShare;       // 0.75% of ESIC wage
    double employerShare;       // 3.25% of ESIC wage
    double totalContribution;   // 4.00%
    bool isDailyWageExempt;     // True if daily rate <= ₹176

public:
    ESICCalculator(bool isEligible = true,
                   double ceiling = 21000.0,
                   double dailyExempt = 176.0);

    ESICCalculator(bool isEligible, const ContributionRule& rule);

    virtual ~ESICCalculator() override = default;

    // Polymorphic method overrides
    virtual void calculate(double earnedBasicDA, double earnedGross, int paidDays, int calendarDays) override;
    virtual bool isEligible() const override { return eligible; }
    virtual double getEmployeeContribution() const override { return employeeShare; }
    virtual double getEmployerContribution() const override { return employerShare; }
    virtual std::string getComponentName() const override { return "ESIC"; }
    virtual std::string toJSON() const override;

    // Specific ESIC getters
    double getEsicWage() const { return esicWage; }
    double getTotalContribution() const { return totalContribution; }
    bool getIsDailyWageExempt() const { return isDailyWageExempt; }
    double getWageCeiling() const { return wageCeiling; }

    // Configuration
    void setEligible(bool val) { eligible = val; }
    void setWageCeiling(double ceiling) { wageCeiling = ceiling; }
    void setMinDailyWageExempt(double amount) { minDailyWageExempt = amount; }
};

#endif // ESIC_CALCULATOR_HPP
