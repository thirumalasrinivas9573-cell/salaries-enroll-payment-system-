#ifndef EPF_CALCULATOR_HPP
#define EPF_CALCULATOR_HPP

#include "StatutoryCalculator.hpp"
#include <string>
#include <cmath>

/**
 * @brief Indian Employee Provident Fund (EPF & MP Act 1952) Calculator.
 * Demonstrates Polymorphism by inheriting from StatutoryCalculator.
 * Computes:
 * - Employee EPF (12%)
 * - Employer EPS (8.33% capped at ₹1,250)
 * - Employer EPF Difference (3.67%)
 * - EDLI Contribution (0.50%)
 * - Admin Charges (0.50%)
 */
class EPFCalculator : public StatutoryCalculator {
private:
    bool eligible;
    bool restrictToCeiling;     // Restrict PF wages to statutory limit (₹15,000)
    bool epsEligible;           // Pension eligibility (false if age >= 58)
    double wageCeiling;         // Statutory ceiling (standard ₹15,000)
    
    // Calculated wage bases
    double grossWage;
    double epfWage;
    double epsWage;
    double edliWage;

    // Contributions
    double employeeShare;       // Account 01: 12%
    double employerEPS;         // Account 10: 8.33% (max ₹1,250)
    double employerEPF;         // Account 01: Remaining diff (approx 3.67%)
    double edliCharges;         // Account 21: 0.50%
    double adminCharges;        // Account 02: 0.50%

public:
    EPFCalculator(bool isEligible = true,
                  bool limitCeiling = true,
                  bool isEpsActive = true,
                  double ceiling = 15000.0);

    virtual ~EPFCalculator() override = default;

    // Polymorphic method overrides
    virtual void calculate(double earnedBasicDA, double earnedGross, int paidDays, int calendarDays) override;
    virtual bool isEligible() const override { return eligible; }
    virtual double getEmployeeContribution() const override { return employeeShare; }
    virtual double getEmployerContribution() const override { return employerEPS + employerEPF + edliCharges + adminCharges; }
    virtual std::string getComponentName() const override { return "EPF"; }
    virtual std::string toJSON() const override;

    // Specific EPF getters for EPFO ECR file export
    double getGrossWage() const { return grossWage; }
    double getEpfWage() const { return epfWage; }
    double getEpsWage() const { return epsWage; }
    double getEdliWage() const { return edliWage; }
    double getEmployerEPS() const { return employerEPS; }
    double getEmployerEPF() const { return employerEPF; }
    double getEdliCharges() const { return edliCharges; }
    double getAdminCharges() const { return adminCharges; }

    // Configuration
    void setEligible(bool val) { eligible = val; }
    void setRestrictToCeiling(bool val) { restrictToCeiling = val; }
    void setEpsEligible(bool val) { epsEligible = val; }
    void setWageCeiling(double ceiling) { wageCeiling = ceiling; }
};

#endif // EPF_CALCULATOR_HPP
