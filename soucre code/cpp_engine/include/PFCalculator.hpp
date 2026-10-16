#pragma once
#include "StatutoryCalculator.hpp"
#include "ContributionRule.hpp"
#include "MoneyUtil.hpp"
#include <string>

/**
 * @class PFCalculator
 * @brief Indian Employees' Provident Fund (EPFO) Calculator.
 *
 * OOP CONCEPTS DEMONSTRATED:
 * 1. Inheritance: Derives from abstract StatutoryCalculator base class.
 * 2. Polymorphism: Overrides pure virtual methods calculate(), getEmployeeContribution(),
 *    getEmployerContribution(), and toJSON().
 * 3. Dependency Injection: Uses ContributionRule injected via constructor.
 * 4. Precision: Applies EPFO nearest-rupee statutory rounding rule via MoneyUtil.
 */
class PFCalculator : public StatutoryCalculator {
private:
    bool eligible;
    ContributionRule rule;

    // Calculated wage bases (Rupees)
    double grossWage;
    double pfWage;
    double epsWage;
    double edliWage;

    // Contributions (Rupees)
    double employeeShare;      // Account 01: 12%
    double employerEPS;        // Account 10: 8.33% (max ₹1,250)
    double employerEPF;        // Account 01: Remaining diff (approx 3.67%)
    double edliCharges;        // Account 21: 0.50%
    double adminCharges;       // Account 02: 0.50%

public:
    explicit PFCalculator(bool isEligible = true,
                          const ContributionRule& rules = ContributionRule());

    virtual ~PFCalculator() override = default;

    // StatutoryCalculator polymorphic interface implementation
    virtual void calculate(double earnedBasicDA, double earnedGross, int paidDays, int calendarDays) override;
    virtual bool isEligible() const override { return eligible; }
    virtual double getEmployeeContribution() const override { return employeeShare; }
    virtual double getEmployerContribution() const override { return employerEPS + employerEPF + edliCharges + adminCharges; }
    virtual std::string getComponentName() const override { return "EPF"; }
    virtual std::string toJSON() const override;

    // Specific EPFO Getters
    double getGrossWage() const { return grossWage; }
    double getPfWage() const { return pfWage; }
    double getEpsWage() const { return epsWage; }
    double getEdliWage() const { return edliWage; }
    double getEmployerEPS() const { return employerEPS; }
    double getEmployerEPF() const { return employerEPF; }
    double getEdliCharges() const { return edliCharges; }
    double getAdminCharges() const { return adminCharges; }

    const ContributionRule& getRule() const { return rule; }
    void setRule(const ContributionRule& r) { rule = r; }
    void setEligible(bool e) { eligible = e; }
};
