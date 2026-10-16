#include "../include/Overtime.hpp"
#include <sstream>
#include <cmath>

Overtime::Overtime()
    : hours(0.0), explicitAmount(0.0), rateMultiplier(2.0), calculatedPaise(0LL) {}

Overtime::Overtime(double otHours, double otAmount, double multiplier)
    : hours(otHours), explicitAmount(otAmount), rateMultiplier(multiplier), calculatedPaise(0LL) {
    validate();
    if (explicitAmount > 0.0) {
        calculatedPaise = MoneyUtil::toPaise(explicitAmount);
    }
}

void Overtime::validate() const {
    if (hours < 0.0) throw std::invalid_argument("Overtime hours cannot be negative.");
    if (explicitAmount < 0.0) throw std::invalid_argument("Overtime amount cannot be negative.");
    if (rateMultiplier < 0.0) throw std::invalid_argument("Overtime rate multiplier cannot be negative.");
}

double Overtime::calculate(double earnedBasic, double paidDays) {
    if (explicitAmount > 0.0) {
        calculatedPaise = MoneyUtil::toPaise(explicitAmount);
        return explicitAmount;
    }

    if (hours <= 0.0 || earnedBasic <= 0.0 || paidDays <= 0.0) {
        calculatedPaise = 0LL;
        return 0.0;
    }

    // Standard industrial rule: 8 working hours per day, statutory overtime paid at 2x hourly wage
    double dailyWage = earnedBasic / paidDays;
    double hourlyWage = dailyWage / 8.0;
    double rawOtPay = hourlyWage * rateMultiplier * hours;

    calculatedPaise = MoneyUtil::toPaise(rawOtPay);
    return MoneyUtil::toRupees(calculatedPaise);
}

void Overtime::setHours(double h) {
    if (h < 0.0) throw std::invalid_argument("Overtime hours cannot be negative.");
    hours = h;
}

void Overtime::setExplicitAmount(double amt) {
    if (amt < 0.0) throw std::invalid_argument("Overtime amount cannot be negative.");
    explicitAmount = amt;
    calculatedPaise = MoneyUtil::toPaise(amt);
}

void Overtime::setRateMultiplier(double m) {
    if (m < 0.0) throw std::invalid_argument("Overtime rate multiplier cannot be negative.");
    rateMultiplier = m;
}

std::string Overtime::toJSON() const {
    std::ostringstream ss;
    ss << "{"
       << "\"hours\":" << hours << ","
       << "\"explicitAmount\":" << explicitAmount << ","
       << "\"rateMultiplier\":" << rateMultiplier << ","
       << "\"calculatedPay\":" << MoneyUtil::toRupees(calculatedPaise)
       << "}";
    return ss.str();
}
