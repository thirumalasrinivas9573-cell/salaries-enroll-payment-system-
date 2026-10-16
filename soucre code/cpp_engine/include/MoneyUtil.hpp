#pragma once
#include <cmath>
#include <string>
#include <sstream>
#include <iomanip>

/**
 * @class MoneyUtil
 * @brief Utility for integer paise-based currency mathematics.
 * 
 * OOP CONCEPT: Abstraction
 * Hides low-level decimal arithmetic and rounding peculiarities, ensuring that
 * monetary amounts never suffer from floating-point accumulation inaccuracies.
 * All monetary storage in calculations can use paise (1 Rupee = 100 Paise).
 */
class MoneyUtil {
public:
    // Convert Rupee double to integer Paise (e.g., 15000.50 -> 1500050)
    static long long toPaise(double rupees) {
        if (std::isnan(rupees) || std::isinf(rupees)) return 0LL;
        return static_cast<long long>(std::round(rupees * 100.0));
    }

    // Convert integer Paise to Rupee double
    static double toRupees(long long paise) {
        return static_cast<double>(paise) / 100.0;
    }

    // Round paise to the nearest whole Rupee (EPFO Rule: nearest integer)
    // 50 paise and above rounds up, under 50 rounds down.
    static long long roundToNearestRupee(long long paise) {
        long long remainder = paise % 100LL;
        long long baseRupees = paise / 100LL;
        if (remainder >= 50LL) {
            return (baseRupees + 1LL) * 100LL;
        } else {
            return baseRupees * 100LL;
        }
    }

    // Round paise UP to the next higher Rupee (ESIC Rule: ceiling rounding)
    // Any fraction of a rupee (even 1 paisa) is rounded up to the next rupee.
    static long long roundCeilRupee(long long paise) {
        long long remainder = paise % 100LL;
        long long baseRupees = paise / 100LL;
        if (remainder > 0LL) {
            return (baseRupees + 1LL) * 100LL;
        } else {
            return baseRupees * 100LL;
        }
    }

    // Format double rupees to 2 decimal string (e.g., "15000.00")
    static std::string formatRupees(double rupees) {
        std::ostringstream ss;
        ss << std::fixed << std::setprecision(2) << rupees;
        return ss.str();
    }
};
