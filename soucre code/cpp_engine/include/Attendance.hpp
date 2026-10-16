#pragma once
#include <string>
#include <stdexcept>

/**
 * @class Attendance
 * @brief Base attendance class managing working days, leaves, and NCP days.
 *
 * OOP CONCEPTS DEMONSTRATED:
 * 1. Encapsulation: Private member variables with strict validation ensuring
 *    paid days (present + leaves + weekly offs) can never exceed month calendar days,
 *    and values can never be negative.
 * 2. Abstraction: Clean query interface for payable days and Non-Contributing Period (NCP) days.
 * 3. Base Class for Inheritance: Extended by AttendanceRecord to add wage inputs.
 */
class Attendance {
protected:
    int calendarDays;      // Total days in month (28 to 31)
    double presentDays;    // Days worked physically (>= 0.0)
    double paidLeaves;     // Authorized paid leaves (casual, sick, earned)
    double weeklyOffs;     // Paid weekend/rest days (typically 4-5)
    double absentDays;     // Unpaid absent days
    double ncpDays;        // Non-Contributing Period (for EPFO ECR calculation)

    virtual void recalculate();

public:
    // Constructors
    Attendance(int calDays = 30,
               double present = 26.0,
               double leaves = 0.0,
               double offDays = 4.0,
               double absent = 0.0);

    // Virtual Destructor
    virtual ~Attendance() = default;

    // Invariant validation
    virtual bool validate(std::string& errorMessage) const;

    // Getters
    int getCalendarDays() const { return calendarDays; }
    double getPresentDays() const { return presentDays; }
    double getPaidLeaves() const { return paidLeaves; }
    double getWeeklyOffs() const { return weeklyOffs; }
    double getAbsentDays() const { return absentDays; }
    double getNcpDays() const { return ncpDays; }

    // Total days eligible for salary disbursement
    virtual double getPaidDays() const {
        return presentDays + paidLeaves + weeklyOffs;
    }

    // Setters with automatic recalculation and validation
    void setCalendarDays(int days);
    void setPresentDays(double days);
    void setPaidLeaves(double leaves);
    void setWeeklyOffs(double offDays);
    void setAbsentDays(double days);
    void setNcpDays(double ncp);

    virtual std::string toJSON() const;
};
