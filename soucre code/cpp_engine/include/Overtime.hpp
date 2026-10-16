#pragma once
#include <string>
#include <stdexcept>
#include "MoneyUtil.hpp"

/**
 * @class Overtime
 * @brief Represents overtime hours and calculated/explicit overtime remuneration.
 *
 * OOP CONCEPTS DEMONSTRATED:
 * 1. Encapsulation: Hours, rate multiplier, and monetary amounts are kept private
 *    and accessed solely through validated getters and calculation methods.
 * 2. Abstraction: Hides the statutory double-rate formula and paise conversion
 *    behind a clean calculate() interface.
 */
class Overtime {
private:
    double hours;              // Overtime hours worked (>= 0.0)
    double explicitAmount;     // Explicit/manual overtime pay (>= 0.0), overrides hourly formula if > 0
    double rateMultiplier;     // Default 2.0x standard statutory factory double-rate
    long long calculatedPaise; // Resulting overtime compensation in paise

public:
    // Constructors
    Overtime();
    explicit Overtime(double otHours, double otAmount = 0.0, double multiplier = 2.0);

    // Destructor
    virtual ~Overtime() = default;

    // Validation
    void validate() const;

    // Calculation method
    // If explicitAmount > 0, uses it directly; otherwise calculates:
    // (earnedBasic / (paidDays * 8 hours/day)) * multiplier * hours
    double calculate(double earnedBasic, double paidDays);

    // Getters
    double getHours() const { return hours; }
    double getExplicitAmount() const { return explicitAmount; }
    double getRateMultiplier() const { return rateMultiplier; }
    double getOvertimePay() const { return MoneyUtil::toRupees(calculatedPaise); }
    long long getOvertimePaise() const { return calculatedPaise; }

    // Setters with validation
    void setHours(double h);
    void setExplicitAmount(double amt);
    void setRateMultiplier(double m);

    std::string toJSON() const;
};
