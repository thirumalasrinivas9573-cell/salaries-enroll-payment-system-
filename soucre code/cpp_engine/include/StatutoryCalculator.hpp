#ifndef STATUTORY_CALCULATOR_HPP
#define STATUTORY_CALCULATOR_HPP

#include <string>

/**
 * @brief Abstract Base Class demonstrating Abstraction & Polymorphism in C++ OOP.
 * Both EPF (Provident Fund) and ESIC (Employee State Insurance) inherit from this interface.
 */
class StatutoryCalculator {
public:
    virtual ~StatutoryCalculator() = default;

    /**
     * @brief Pure virtual calculation method.
     * @param earnedBasicDA Prorated Basic + DA for the month
     * @param earnedGross Total earned gross wage for the month
     * @param paidDays Attendance days for which salary is payable
     * @param calendarDays Total days in the calendar month
     */
    virtual void calculate(double earnedBasicDA, double earnedGross, int paidDays, int calendarDays) = 0;

    /**
     * @brief Checks if the employee is legally eligible / covered under this statutory act.
     */
    virtual bool isEligible() const = 0;

    /**
     * @brief Returns the employee's contribution share (deducted from gross wage).
     */
    virtual double getEmployeeContribution() const = 0;

    /**
     * @brief Returns the total employer contribution share (company cost/liability).
     */
    virtual double getEmployerContribution() const = 0;

    /**
     * @brief Identifies the statutory component name (e.g., "EPF", "ESIC").
     */
    virtual std::string getComponentName() const = 0;

    /**
     * @brief Serializes the calculation breakdown into JSON format.
     */
    virtual std::string toJSON() const = 0;
};

#endif // STATUTORY_CALCULATOR_HPP
