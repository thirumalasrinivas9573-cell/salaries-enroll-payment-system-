#ifndef SALARY_STRUCTURE_HPP
#define SALARY_STRUCTURE_HPP

#include <string>

/**
 * @brief Represents the fixed salary structure / CTC breakdown for an employee.
 * Demonstrates Encapsulation with private members and validated getters/setters.
 */
class SalaryStructure {
private:
    double basicWage;
    double dearnessAllowance;    // DA
    double houseRentAllowance;   // HRA
    double conveyanceAllowance;
    double medicalAllowance;
    double specialAllowance;
    double otherAllowance;

public:
    SalaryStructure(double basic = 0.0,
                    double da = 0.0,
                    double hra = 0.0,
                    double conveyance = 0.0,
                    double medical = 0.0,
                    double special = 0.0,
                    double other = 0.0);

    // Getters
    double getBasicWage() const { return basicWage; }
    double getDearnessAllowance() const { return dearnessAllowance; }
    double getHouseRentAllowance() const { return houseRentAllowance; }
    double getConveyanceAllowance() const { return conveyanceAllowance; }
    double getMedicalAllowance() const { return medicalAllowance; }
    double getSpecialAllowance() const { return specialAllowance; }
    double getOtherAllowance() const { return otherAllowance; }

    // Setters with validation
    void setBasicWage(double val);
    void setDearnessAllowance(double val);
    void setHouseRentAllowance(double val);
    void setConveyanceAllowance(double val);
    void setMedicalAllowance(double val);
    void setSpecialAllowance(double val);
    void setOtherAllowance(double val);

    // Calculated properties
    double getMonthlyGross() const;
    double getBasicPlusDA() const;

    // Proration based on attendance
    double getProratedBasic(int paidDays, int calendarDays) const;
    double getProratedDA(int paidDays, int calendarDays) const;
    double getProratedHRA(int paidDays, int calendarDays) const;
    double getProratedConveyance(int paidDays, int calendarDays) const;
    double getProratedMedical(int paidDays, int calendarDays) const;
    double getProratedSpecial(int paidDays, int calendarDays) const;
    double getProratedOther(int paidDays, int calendarDays) const;
    double getProratedGross(int paidDays, int calendarDays) const;

    std::string toJSON() const;
};

#endif // SALARY_STRUCTURE_HPP
