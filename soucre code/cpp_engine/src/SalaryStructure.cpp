#include "../include/SalaryStructure.hpp"
#include <sstream>
#include <iomanip>
#include <cmath>

SalaryStructure::SalaryStructure(double basic,
                                 double da,
                                 double hra,
                                 double conveyance,
                                 double medical,
                                 double special,
                                 double other)
    : basicWage(basic >= 0 ? basic : 0.0),
      dearnessAllowance(da >= 0 ? da : 0.0),
      houseRentAllowance(hra >= 0 ? hra : 0.0),
      conveyanceAllowance(conveyance >= 0 ? conveyance : 0.0),
      medicalAllowance(medical >= 0 ? medical : 0.0),
      specialAllowance(special >= 0 ? special : 0.0),
      otherAllowance(other >= 0 ? other : 0.0) {}

void SalaryStructure::setBasicWage(double val) { basicWage = (val >= 0 ? val : 0.0); }
void SalaryStructure::setDearnessAllowance(double val) { dearnessAllowance = (val >= 0 ? val : 0.0); }
void SalaryStructure::setHouseRentAllowance(double val) { houseRentAllowance = (val >= 0 ? val : 0.0); }
void SalaryStructure::setConveyanceAllowance(double val) { conveyanceAllowance = (val >= 0 ? val : 0.0); }
void SalaryStructure::setMedicalAllowance(double val) { medicalAllowance = (val >= 0 ? val : 0.0); }
void SalaryStructure::setSpecialAllowance(double val) { specialAllowance = (val >= 0 ? val : 0.0); }
void SalaryStructure::setOtherAllowance(double val) { otherAllowance = (val >= 0 ? val : 0.0); }

double SalaryStructure::getMonthlyGross() const {
    return basicWage + dearnessAllowance + houseRentAllowance +
           conveyanceAllowance + medicalAllowance + specialAllowance + otherAllowance;
}

double SalaryStructure::getBasicPlusDA() const {
    return basicWage + dearnessAllowance;
}

static inline double prorate(double amount, int paidDays, int calendarDays) {
    if (calendarDays <= 0 || paidDays <= 0) return 0.0;
    if (paidDays >= calendarDays) return amount;
    return std::round((amount / calendarDays) * paidDays * 100.0) / 100.0;
}

double SalaryStructure::getProratedBasic(int paidDays, int calendarDays) const {
    return prorate(basicWage, paidDays, calendarDays);
}

double SalaryStructure::getProratedDA(int paidDays, int calendarDays) const {
    return prorate(dearnessAllowance, paidDays, calendarDays);
}

double SalaryStructure::getProratedHRA(int paidDays, int calendarDays) const {
    return prorate(houseRentAllowance, paidDays, calendarDays);
}

double SalaryStructure::getProratedConveyance(int paidDays, int calendarDays) const {
    return prorate(conveyanceAllowance, paidDays, calendarDays);
}

double SalaryStructure::getProratedMedical(int paidDays, int calendarDays) const {
    return prorate(medicalAllowance, paidDays, calendarDays);
}

double SalaryStructure::getProratedSpecial(int paidDays, int calendarDays) const {
    return prorate(specialAllowance, paidDays, calendarDays);
}

double SalaryStructure::getProratedOther(int paidDays, int calendarDays) const {
    return prorate(otherAllowance, paidDays, calendarDays);
}

double SalaryStructure::getProratedGross(int paidDays, int calendarDays) const {
    return getProratedBasic(paidDays, calendarDays) +
           getProratedDA(paidDays, calendarDays) +
           getProratedHRA(paidDays, calendarDays) +
           getProratedConveyance(paidDays, calendarDays) +
           getProratedMedical(paidDays, calendarDays) +
           getProratedSpecial(paidDays, calendarDays) +
           getProratedOther(paidDays, calendarDays);
}

std::string SalaryStructure::toJSON() const {
    std::ostringstream ss;
    ss << std::fixed << std::setprecision(2);
    ss << "{"
       << "\"basicWage\":" << basicWage << ","
       << "\"dearnessAllowance\":" << dearnessAllowance << ","
       << "\"houseRentAllowance\":" << houseRentAllowance << ","
       << "\"conveyanceAllowance\":" << conveyanceAllowance << ","
       << "\"medicalAllowance\":" << medicalAllowance << ","
       << "\"specialAllowance\":" << specialAllowance << ","
       << "\"otherAllowance\":" << otherAllowance << ","
       << "\"monthlyGross\":" << getMonthlyGross()
       << "}";
    return ss.str();
}
